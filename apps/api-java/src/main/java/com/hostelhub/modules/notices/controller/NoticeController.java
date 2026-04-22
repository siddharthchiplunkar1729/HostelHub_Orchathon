package com.hostelhub.modules.notices.controller;

import com.hostelhub.security.AuthenticatedUser;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notices")
public class NoticeController {

    private final NamedParameterJdbcTemplate jdbcTemplate;

    public NoticeController(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<Map<String, Object>> getNotices(
            @RequestParam(required = false) UUID hostelBlockId,
            @RequestParam(defaultValue = "10") Integer limit
    ) {
        StringBuilder sql = new StringBuilder("""
                SELECT n.*, hb.block_name
                FROM notices n
                LEFT JOIN hostel_blocks hb ON n.hostel_block_id = hb.id
                WHERE 1 = 1
                """);
        MapSqlParameterSource params = new MapSqlParameterSource().addValue("limit", limit);

        if (hostelBlockId != null) {
            sql.append(" AND n.hostel_block_id = :hostelBlockId");
            params.addValue("hostelBlockId", hostelBlockId);
        }

        sql.append("""
                 ORDER BY CASE
                    WHEN n.priority = 'Urgent' THEN 1
                    WHEN n.priority = 'High' THEN 2
                    ELSE 3 END,
                 n.created_at DESC
                 LIMIT :limit
                """);

        return jdbcTemplate.query(sql.toString(), params, (rs, rowNum) -> mapNoticeRow(rs));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('WARDEN','ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> createNotice(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal AuthenticatedUser principal
    ) {
        UUID hostelBlockId = parseUuid(body.get("hostelBlockId"), "Hostel block is required");
        ensureBlockAccess(principal, hostelBlockId);

        String sql = """
                INSERT INTO notices (hostel_block_id, title, content, priority, expires_at, updated_at)
                VALUES (:hostelBlockId, :title, :content, :priority, :expiresAt, NOW())
                RETURNING *
                """;

        return jdbcTemplate.query(sql, new MapSqlParameterSource()
                .addValue("hostelBlockId", hostelBlockId)
                .addValue("title", body.get("title"))
                .addValue("content", body.get("content"))
                .addValue("priority", body.getOrDefault("priority", "Normal"))
                .addValue("expiresAt", body.get("expiresAt")), rs -> {
            if (!rs.next()) {
                throw new IllegalArgumentException("Failed to create notice");
            }
            return mapSimpleNotice(rs);
        });
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('WARDEN','ADMIN')")
    public Map<String, Object> updateNotice(
            @PathVariable UUID id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal AuthenticatedUser principal
    ) {
        ensureNoticeAccess(principal, id);

        List<String> assignments = new ArrayList<>();
        MapSqlParameterSource params = new MapSqlParameterSource().addValue("id", id);

        for (Map.Entry<String, Object> entry : body.entrySet()) {
            if (List.of("_id", "id", "created_at", "createdAt").contains(entry.getKey())) {
                continue;
            }
            String key = entry.getKey();
            String column = key.replaceAll("([A-Z])", "_$1").toLowerCase();
            assignments.add(column + " = :" + key);
            params.addValue(key, entry.getValue());
        }

        if (assignments.isEmpty()) {
            throw new IllegalArgumentException("No fields to update");
        }

        String sql = "UPDATE notices SET " + String.join(", ", assignments) + ", updated_at = NOW() WHERE id = :id RETURNING *";
        Map<String, Object> notice = jdbcTemplate.query(sql, params, rs -> rs.next() ? mapSimpleNotice(rs) : null);

        if (notice == null) {
            throw new IllegalArgumentException("Notice not found");
        }

        return Map.of(
                "success", true,
                "notice", notice,
                "message", "Notice updated successfully"
        );
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('WARDEN','ADMIN')")
    public Map<String, Object> deleteNotice(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthenticatedUser principal
    ) {
        ensureNoticeAccess(principal, id);

        Integer count = jdbcTemplate.update(
                "DELETE FROM notices WHERE id = :id",
                new MapSqlParameterSource("id", id)
        );

        if (count == null || count == 0) {
            throw new IllegalArgumentException("Notice not found");
        }

        return Map.of("success", true, "message", "Notice deleted successfully");
    }

    @PutMapping("/{id}/acknowledge")
    public Map<String, Object> acknowledgeNotice(@PathVariable UUID id, @RequestBody Map<String, Object> body) {
        String sql = """
                INSERT INTO notice_acknowledgements (notice_id, student_id)
                VALUES (:noticeId, :studentId)
                ON CONFLICT (notice_id, student_id) DO NOTHING
                RETURNING *
                """;

        List<Map<String, Object>> rows = jdbcTemplate.query(sql, new MapSqlParameterSource()
                .addValue("noticeId", id)
                .addValue("studentId", body.get("studentId")), (rs, rowNum) -> Map.of("id", rs.getObject("id", UUID.class)));

        boolean acknowledged = !rows.isEmpty();
        return Map.of(
                "success", true,
                "acknowledged", acknowledged,
                "message", acknowledged ? "Acknowledged" : "Already acknowledged"
        );
    }

    @GetMapping("/{id}/stats")
    @PreAuthorize("hasAnyRole('WARDEN','ADMIN')")
    public Map<String, Object> getNoticeStats(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthenticatedUser principal
    ) {
        ensureNoticeAccess(principal, id);

        List<Map<String, Object>> acknowledgements = jdbcTemplate.query("""
                SELECT na.acknowledged_at, u.name, u.email, s.photo
                FROM notice_acknowledgements na
                JOIN students s ON na.student_id = s.id
                JOIN users u ON s.user_id = u.id
                WHERE na.notice_id = :id
                ORDER BY na.acknowledged_at DESC
                """, new MapSqlParameterSource("id", id), (rs, rowNum) -> {
            Map<String, Object> mapped = new LinkedHashMap<>();
            mapped.put("acknowledgedAt", rs.getTimestamp("acknowledged_at"));
            mapped.put("name", rs.getString("name"));
            mapped.put("email", rs.getString("email"));
            mapped.put("photo", rs.getString("photo"));
            return mapped;
        });

        return Map.of(
                "success", true,
                "noticeId", id,
                "totalAcknowledgements", acknowledgements.size(),
                "acknowledgements", acknowledgements
        );
    }

    private Map<String, Object> mapNoticeRow(ResultSet rs) throws SQLException {
        Map<String, Object> hostelInfo = new LinkedHashMap<>();
        hostelInfo.put("id", rs.getObject("hostel_block_id", UUID.class));
        hostelInfo.put("name", rs.getString("block_name"));

        Map<String, Object> from = new LinkedHashMap<>();
        from.put("role", "Administrative Officer");
        from.put("name", "Hostel Hub System");

        Map<String, Object> mapped = new LinkedHashMap<>();
        mapped.put("_id", rs.getObject("id", UUID.class));
        mapped.put("title", rs.getString("title"));
        mapped.put("content", rs.getString("content"));
        mapped.put("priority", rs.getString("priority"));
        mapped.put("createdAt", rs.getTimestamp("created_at"));
        mapped.put("expiresAt", rs.getTimestamp("expires_at"));
        mapped.put("updatedAt", rs.getTimestamp("updated_at"));
        mapped.put("hostelBlockId", rs.getObject("hostel_block_id", UUID.class));
        mapped.put("hostelName", rs.getString("block_name"));
        mapped.put("hostelInfo", hostelInfo);
        mapped.put("type", "Urgent".equals(rs.getString("priority")) ? "Emergency" : "General");
        mapped.put("from", from);
        return mapped;
    }

    private Map<String, Object> mapSimpleNotice(ResultSet rs) throws SQLException {
        Map<String, Object> mapped = new LinkedHashMap<>();
        mapped.put("_id", rs.getObject("id", UUID.class));
        mapped.put("id", rs.getObject("id", UUID.class));
        mapped.put("hostel_block_id", rs.getObject("hostel_block_id", UUID.class));
        mapped.put("hostelBlockId", rs.getObject("hostel_block_id", UUID.class));
        mapped.put("title", rs.getString("title"));
        mapped.put("content", rs.getString("content"));
        mapped.put("priority", rs.getString("priority"));
        mapped.put("expires_at", rs.getTimestamp("expires_at"));
        mapped.put("expiresAt", rs.getTimestamp("expires_at"));
        mapped.put("updated_at", rs.getTimestamp("updated_at"));
        mapped.put("updatedAt", rs.getTimestamp("updated_at"));
        return mapped;
    }

    private void ensureNoticeAccess(AuthenticatedUser principal, UUID noticeId) {
        UUID hostelBlockId = jdbcTemplate.query("""
                SELECT hostel_block_id
                FROM notices
                WHERE id = :id
                """, new MapSqlParameterSource("id", noticeId), rs -> rs.next() ? rs.getObject("hostel_block_id", UUID.class) : null);

        if (hostelBlockId == null) {
            throw new IllegalArgumentException("Notice not found");
        }

        ensureBlockAccess(principal, hostelBlockId);
    }

    private void ensureBlockAccess(AuthenticatedUser principal, UUID hostelBlockId) {
        if (principal == null) {
            throw new IllegalArgumentException("Authentication required");
        }
        if ("Admin".equalsIgnoreCase(principal.getRole())) {
            return;
        }

        Integer count = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM hostel_blocks
                WHERE id = :hostelBlockId AND warden_user_id = :wardenId
                """, new MapSqlParameterSource()
                .addValue("hostelBlockId", hostelBlockId)
                .addValue("wardenId", principal.getId()), Integer.class);

        if (count == null || count == 0) {
            throw new IllegalArgumentException("You do not have access to manage this hostel block");
        }
    }

    private UUID parseUuid(Object value, String errorMessage) {
        if (value == null || value.toString().isBlank()) {
            throw new IllegalArgumentException(errorMessage);
        }
        return UUID.fromString(value.toString());
    }
}
