package com.hostelhub.modules.warden.controller;

import com.hostelhub.security.AuthenticatedUser;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/warden/dashboard")
public class WardenDashboardController {

    private final NamedParameterJdbcTemplate jdbcTemplate;

    public WardenDashboardController(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('WARDEN','ADMIN')")
    public Map<String, Object> getDashboard(
            @RequestParam(required = false) UUID blockId,
            @AuthenticationPrincipal AuthenticatedUser principal
    ) {
        List<UUID> blockIds = jdbcTemplate.query("""
                SELECT id
                FROM hostel_blocks
                WHERE (:isAdmin = true OR warden_user_id = :wardenId)
                ORDER BY created_at DESC
                """, new MapSqlParameterSource()
                .addValue("isAdmin", isAdmin(principal))
                .addValue("wardenId", principal.getId()), (rs, rowNum) -> rs.getObject("id", UUID.class));

        if (blockIds.isEmpty()) {
            return Map.of(
                    "success", true,
                    "stats", Map.of(
                            "totalBlocks", 0,
                            "totalStudents", 0,
                            "pendingApplications", 0,
                            "acceptedApplications", 0,
                            "complaints", Map.of(
                                    "pending", 0,
                                    "assigned", 0,
                                    "inProgress", 0,
                                    "resolvedToday", 0
                            )
                    ),
                    "blocks", List.of(),
                    "occupancy", List.of(),
                    "applications", List.of()
            );
        }

        List<UUID> targetBlockIds = blockId != null ? List.of(blockId) : blockIds;

        List<Map<String, Object>> blocks = jdbcTemplate.query("""
                SELECT hb.*, u.name AS warden_name, u.phone AS warden_phone
                FROM hostel_blocks hb
                LEFT JOIN users u ON hb.warden_user_id = u.id
                WHERE hb.id IN (:ids)
                ORDER BY hb.created_at DESC
                """, new MapSqlParameterSource("ids", blockIds), (rs, rowNum) -> {
            Map<String, Object> mapped = new LinkedHashMap<>();
            mapped.put("_id", rs.getObject("id", UUID.class));
            mapped.put("blockName", rs.getString("block_name"));
            mapped.put("type", rs.getString("type"));
            mapped.put("description", rs.getString("description"));
            mapped.put("totalRooms", rs.getInt("total_rooms"));
            mapped.put("availableRooms", rs.getInt("available_rooms"));
            mapped.put("occupiedRooms", rs.getInt("occupied_rooms"));
            mapped.put("location", rs.getString("location"));
            mapped.put("category", rs.getString("category"));
            mapped.put("approvalStatus", rs.getString("approval_status"));
            mapped.put("virtualTourUrl", rs.getString("virtual_tour_url"));
            mapped.put("images", rs.getArray("images") == null ? List.of() : List.of((String[]) rs.getArray("images").getArray()));
            mapped.put("facilities", rs.getArray("facilities") == null ? List.of() : List.of((String[]) rs.getArray("facilities").getArray()));
            mapped.put("wardenInfo", Map.of(
                    "name", rs.getString("warden_name") != null ? rs.getString("warden_name") : "Assigned Warden",
                    "phone", rs.getString("warden_phone") != null ? rs.getString("warden_phone") : "N/A"
            ));
            return mapped;
        });

        Integer totalStudents = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM students
                WHERE hostel_block_id IN (:ids)
                """, new MapSqlParameterSource("ids", targetBlockIds), Integer.class);

        List<Map<String, Object>> applicationStats = jdbcTemplate.query("""
                SELECT status, COUNT(*) AS count
                FROM hostel_applications
                WHERE hostel_block_id IN (:ids)
                GROUP BY status
                """, new MapSqlParameterSource("ids", targetBlockIds), (rs, rowNum) -> Map.of(
                "status", rs.getString("status"),
                "count", rs.getInt("count")
        ));

        int pendingApplications = 0;
        int acceptedApplications = 0;
        for (Map<String, Object> row : applicationStats) {
            String status = (String) row.get("status");
            Integer count = (Integer) row.get("count");
            if ("Pending".equals(status)) {
                pendingApplications = count;
            }
            if ("Accepted".equals(status)) {
                acceptedApplications = count;
            }
        }

        List<Map<String, Object>> occupancy = jdbcTemplate.query("""
                SELECT id, block_name, type, total_rooms, occupied_rooms, available_rooms
                FROM hostel_blocks
                WHERE id IN (:ids)
                ORDER BY created_at DESC
                """, new MapSqlParameterSource("ids", blockIds), (rs, rowNum) -> {
            int totalRooms = rs.getInt("total_rooms");
            int occupiedRooms = rs.getInt("occupied_rooms");
            Map<String, Object> mapped = new LinkedHashMap<>();
            mapped.put("blockId", rs.getObject("id", UUID.class));
            mapped.put("blockName", rs.getString("block_name"));
            mapped.put("type", rs.getString("type"));
            mapped.put("totalRooms", totalRooms);
            mapped.put("occupiedRooms", occupiedRooms);
            mapped.put("availableRooms", rs.getInt("available_rooms"));
            mapped.put("occupancyRate", totalRooms == 0 ? "0.0" : String.format("%.1f", (occupiedRooms * 100.0) / totalRooms));
            return mapped;
        });

        List<Map<String, Object>> applications = jdbcTemplate.query("""
                SELECT
                    ha.id, ha.status, ha.application_data, ha.created_at, ha.hostel_block_id,
                    s.id AS student_id, s.roll_number, s.course, s.year, s.department,
                    u.name, u.email, u.phone
                FROM hostel_applications ha
                JOIN students s ON ha.student_id = s.id
                JOIN users u ON s.user_id = u.id
                WHERE ha.hostel_block_id IN (:ids)
                ORDER BY ha.created_at DESC
                LIMIT 20
                """, new MapSqlParameterSource("ids", targetBlockIds), (rs, rowNum) -> {
            Map<String, Object> student = new LinkedHashMap<>();
            student.put("_id", rs.getObject("student_id", UUID.class));
            student.put("name", rs.getString("name"));
            student.put("email", rs.getString("email"));
            student.put("phone", rs.getString("phone"));
            student.put("rollNumber", rs.getString("roll_number"));
            student.put("course", rs.getString("course"));
            student.put("year", rs.getObject("year"));
            student.put("department", rs.getString("department"));
            student.put("feeStatus", Map.of("isPaid", true));

            Map<String, Object> mapped = new LinkedHashMap<>();
            mapped.put("_id", rs.getObject("id", UUID.class));
            mapped.put("status", rs.getString("status"));
            mapped.put("applicationData", rs.getString("application_data"));
            mapped.put("createdAt", rs.getTimestamp("created_at"));
            mapped.put("hostelBlockId", rs.getObject("hostel_block_id", UUID.class));
            mapped.put("studentId", student);
            return mapped;
        });

        Map<String, Integer> complaints = new LinkedHashMap<>();
        List<Map<String, Object>> complaintStats = jdbcTemplate.query("""
                SELECT c.status, COUNT(*) AS count
                FROM complaints c
                JOIN students s ON c.student_id = s.id
                WHERE s.hostel_block_id IN (:ids)
                GROUP BY c.status
                """, new MapSqlParameterSource("ids", targetBlockIds), (rs, rowNum) -> Map.of(
                "status", rs.getString("status"),
                "count", rs.getInt("count")
        ));
        complaints.put("pending", 0);
        complaints.put("assigned", 0);
        complaints.put("inProgress", 0);
        complaints.put("resolvedToday", 0);
        for (Map<String, Object> row : complaintStats) {
            String status = ((String) row.get("status")).toLowerCase();
            Integer count = (Integer) row.get("count");
            if ("pending".equals(status)) {
                complaints.put("pending", count);
            } else if ("assigned".equals(status)) {
                complaints.put("assigned", count);
            } else if ("in progress".equals(status) || "inprogress".equals(status)) {
                complaints.put("inProgress", count);
            }
        }
        Integer resolvedToday = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM complaints c
                JOIN students s ON c.student_id = s.id
                WHERE s.hostel_block_id IN (:ids)
                  AND c.resolved_at IS NOT NULL
                  AND DATE(c.resolved_at) = CURRENT_DATE
                """, new MapSqlParameterSource("ids", targetBlockIds), Integer.class);
        complaints.put("resolvedToday", resolvedToday == null ? 0 : resolvedToday);

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalBlocks", blockIds.size());
        stats.put("totalStudents", totalStudents == null ? 0 : totalStudents);
        stats.put("studentsInBlock", blockId != null ? totalStudents : null);
        stats.put("pendingApplications", pendingApplications);
        stats.put("acceptedApplications", acceptedApplications);
        stats.put("complaints", complaints);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("stats", stats);
        response.put("blocks", blocks);
        response.put("occupancy", occupancy);
        response.put("applications", applications);
        return response;
    }

    private boolean isAdmin(AuthenticatedUser principal) {
        return principal != null && "Admin".equalsIgnoreCase(principal.getRole());
    }

    @GetMapping("/complaints")
    @PreAuthorize("hasAnyRole('WARDEN','ADMIN')")
    public List<Map<String, Object>> getWardenComplaints(
            @RequestParam(required = false) UUID hostelBlockId,
            @AuthenticationPrincipal AuthenticatedUser principal
    ) {
        List<UUID> blockIds = jdbcTemplate.query("""
                SELECT id
                FROM hostel_blocks
                WHERE (:isAdmin = true OR warden_user_id = :wardenId)
                """, new MapSqlParameterSource()
                .addValue("isAdmin", isAdmin(principal))
                .addValue("wardenId", principal.getId()), (rs, rowNum) -> rs.getObject("id", UUID.class));

        if (blockIds.isEmpty()) {
            return List.of();
        }

        List<UUID> targetBlockIds = hostelBlockId != null ? List.of(hostelBlockId) : blockIds;

        String sql = """
                SELECT c.*, u.name AS student_name, u.email AS student_email, s.room_number
                FROM complaints c
                JOIN students s ON c.student_id = s.id
                JOIN users u ON s.user_id = u.id
                WHERE s.hostel_block_id IN (:ids)
                ORDER BY c.created_at DESC
                """;

        return jdbcTemplate.query(sql, new MapSqlParameterSource("ids", targetBlockIds), (rs, rowNum) -> {
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
            mapped.put("assignedTo", rs.getString("assigned_to"));
            mapped.put("assignedAt", rs.getTimestamp("assigned_at"));
            mapped.put("eta", rs.getString("eta"));
            mapped.put("resolutionNotes", rs.getString("resolution_notes"));
            mapped.put("resolutionPhotos", rs.getArray("resolution_photos") != null ? List.of((String[]) rs.getArray("resolution_photos").getArray()) : List.of());
            return mapped;
        });
    }
}
