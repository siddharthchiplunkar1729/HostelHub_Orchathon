package com.hostelhub.modules.complaints.controller;

import com.hostelhub.security.AuthenticatedUser;
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
@RequestMapping("/api/complaints")
public class ComplaintController {

    private final NamedParameterJdbcTemplate jdbcTemplate;

    public ComplaintController(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('STUDENT','WARDEN','ADMIN')")
    public List<Map<String, Object>> getComplaints(
            @RequestParam(required = false) UUID studentId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "10") Integer limit,
            @AuthenticationPrincipal AuthenticatedUser principal
    ) {
        UUID effectiveStudentId = studentId;
        if ("Student".equals(principal.getRole())) {
            effectiveStudentId = jdbcTemplate.query(
                    "SELECT id FROM students WHERE user_id = :userId",
                    new MapSqlParameterSource("userId", principal.getId()),
                    rs -> rs.next() ? rs.getObject("id", UUID.class) : null
            );
        }

        StringBuilder sql = new StringBuilder("""
                SELECT c.*, u.name AS student_name, u.email AS student_email, s.room_number
                FROM complaints c
                JOIN students s ON c.student_id = s.id
                WHERE 1 = 1
                """);
        MapSqlParameterSource params = new MapSqlParameterSource().addValue("limit", limit);

        if (effectiveStudentId != null) {
            sql.append(" AND c.student_id = :studentId");
            params.addValue("studentId", effectiveStudentId);
        }
        if (status != null && !status.isBlank()) {
            sql.append(" AND c.status = :status");
            params.addValue("status", status);
        }
        if (category != null && !category.isBlank()) {
             sql.append(" AND c.category = :category");
             params.addValue("category", category);
        }

        sql.append(" ORDER BY c.created_at DESC LIMIT :limit");

        return jdbcTemplate.query(sql.toString(), params, (rs, rowNum) -> {
            Map<String, Object> student = new LinkedHashMap<>();
            student.put("_id", rs.getObject("student_id", UUID.class));
            student.put("name", rs.getString("student_name"));
            student.put("email", rs.getString("student_email"));
            student.put("roomNumber", rs.getString("room_number"));

            Map<String, Object> mapped = new LinkedHashMap<>();
            mapped.put("_id", rs.getObject("id", UUID.class));
            mapped.put("studentId", student);
            mapped.put("title", rs.getString("title"));
            mapped.put("category", rs.getString("category"));
            mapped.put("description", rs.getString("description"));
            mapped.put("status", rs.getString("status"));
            mapped.put("createdAt", rs.getTimestamp("created_at"));
            return mapped;
        });
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('STUDENT','WARDEN','ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> createComplaint(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal AuthenticatedUser principal
    ) {
        UUID studentId = jdbcTemplate.query(
                "SELECT id FROM students WHERE user_id = :userId",
                new MapSqlParameterSource("userId", principal.getId()),
                rs -> rs.next() ? rs.getObject("id", UUID.class) : null
        );

        if (studentId == null) {
            throw new IllegalArgumentException("Student profile not found");
        }

        String sql = """
                INSERT INTO complaints (student_id, title, category, description, status, updated_at)
                VALUES (:studentId, :title, :category, :description, 'Pending', NOW())
                RETURNING *
                """;

        return jdbcTemplate.query(sql, new MapSqlParameterSource()
                .addValue("studentId", studentId)
                .addValue("title", body.get("title"))
                .addValue("category", body.get("category"))
                .addValue("description", body.get("description")), rs -> {
            if (!rs.next()) {
                throw new IllegalArgumentException("Failed to create complaint");
            }
            return mapSimpleComplaint(rs);
        });
    }

    @PutMapping("/{id}")
    public Map<String, Object> updateComplaint(
            @PathVariable UUID id,
            @RequestBody Map<String, Object> body
    ) {
        List<String> assignments = new ArrayList<>();
        MapSqlParameterSource params = new MapSqlParameterSource().addValue("id", id);

        for (Map.Entry<String, Object> entry : body.entrySet()) {
            String key = entry.getKey();
            if (List.of("_id", "id", "student_id", "created_at").contains(key)) {
                continue;
            }
            String column = key.replaceAll("([A-Z])", "_$1").toLowerCase();
            assignments.add(column + " = :" + key);
            params.addValue(key, entry.getValue());
        }

        if (assignments.isEmpty()) {
            throw new IllegalArgumentException("No fields to update");
        }

        String sql = "UPDATE complaints SET " + String.join(", ", assignments) + ", updated_at = NOW() WHERE id = :id RETURNING *";
        return jdbcTemplate.query(sql, params, rs -> {
            if (!rs.next()) {
                throw new IllegalArgumentException("Complaint not found");
            }
            return mapSimpleComplaint(rs);
        });
    }

    @PostMapping("/{id}/assign")
    public Map<String, Object> assignComplaint(
            @PathVariable UUID id,
            @RequestBody Map<String, Object> body
    ) {
        String sql = """
                UPDATE complaints
                SET assigned_to = :assignedTo,
                    assigned_at = NOW(),
                    eta = :eta,
                    status = 'Assigned',
                    updated_at = NOW()
                WHERE id = :id
                RETURNING *
                """;

        Map<String, Object> complaint = jdbcTemplate.query(sql, new MapSqlParameterSource()
                .addValue("assignedTo", body.get("assignedTo"))
                .addValue("eta", body.get("eta"))
                .addValue("id", id), rs -> rs.next() ? mapSimpleComplaint(rs) : null);

        if (complaint == null) {
            throw new IllegalArgumentException("Complaint not found");
        }

        return Map.of(
                "success", true,
                "complaint", complaint,
                "message", "Complaint assigned successfully"
        );
    }

    @PostMapping("/{id}/resolve")
    public Map<String, Object> resolveComplaint(
            @PathVariable UUID id,
            @RequestBody Map<String, Object> body
    ) {
        String sql = """
                UPDATE complaints
                SET status = 'Resolved',
                    resolved_at = NOW(),
                    resolution_notes = :resolutionNotes,
                    resolution_photos = CAST(:resolutionPhotos AS text[]),
                    updated_at = NOW()
                WHERE id = :id
                RETURNING *
                """;

        String[] resolutionPhotos = body.get("resolutionPhotos") instanceof List<?> list
                ? list.stream().map(String::valueOf).toArray(String[]::new)
                : new String[0];

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("resolutionNotes", body.get("resolutionNotes"))
                .addValue("resolutionPhotos", toArrayLiteral(resolutionPhotos))
                .addValue("id", id);

        Map<String, Object> complaint = jdbcTemplate.query(sql, params, rs -> rs.next() ? mapSimpleComplaint(rs) : null);
        if (complaint == null) {
            throw new IllegalArgumentException("Complaint not found");
        }

        return Map.of(
                "success", true,
                "complaint", complaint,
                "message", "Complaint resolved successfully"
        );
    }

    private String toArrayLiteral(String[] values) {
        if (values == null || values.length == 0) {
            return "{}";
        }
        StringBuilder builder = new StringBuilder("{");
        for (int i = 0; i < values.length; i++) {
            if (i > 0) {
                builder.append(",");
            }
            builder.append("\"").append(values[i].replace("\"", "\\\"")).append("\"");
        }
        builder.append("}");
        return builder.toString();
    }

    private Map<String, Object> mapSimpleComplaint(java.sql.ResultSet rs) throws java.sql.SQLException {
        Map<String, Object> mapped = new LinkedHashMap<>();
        mapped.put("_id", rs.getObject("id", UUID.class));
        mapped.put("id", rs.getObject("id", UUID.class));
        mapped.put("student_id", rs.getObject("student_id", UUID.class));
        mapped.put("title", rs.getString("title"));
        mapped.put("category", rs.getString("category"));
        mapped.put("description", rs.getString("description"));
        mapped.put("status", rs.getString("status"));
        mapped.put("assigned_to", rs.getObject("assigned_to"));
        mapped.put("updated_at", rs.getTimestamp("updated_at"));
        return mapped;
    }
}
