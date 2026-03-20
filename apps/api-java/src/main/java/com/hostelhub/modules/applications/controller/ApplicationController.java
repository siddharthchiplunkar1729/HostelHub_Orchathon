package com.hostelhub.modules.applications.controller;

import com.hostelhub.security.AuthenticatedUser;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    public ApplicationController(NamedParameterJdbcTemplate jdbcTemplate, com.fasterxml.jackson.databind.ObjectMapper objectMapper) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
    }

    @PostMapping("/apply")
    @PreAuthorize("hasRole('STUDENT')")
    @Transactional
    public Map<String, Object> apply(@AuthenticationPrincipal AuthenticatedUser principal, @RequestBody Map<String, Object> body) {
        if (principal == null) {
            throw new IllegalArgumentException("User principal not found. Please log in again.");
        }

        UUID studentId = getStudentIdForUser(principal.getId());
        Object hostelBlockId = body.get("hostelBlockId");
        Object applicationData = body.get("applicationData");

        System.out.println("Applying: user=" + principal.getId() + ", studentId=" + studentId + ", blockId=" + hostelBlockId);

        if (studentId == null) {
            System.err.println("Student record missing for user: " + principal.getId());
            throw new IllegalArgumentException("Student profile not found. Please contact support.");
        }
        
        if (hostelBlockId == null || hostelBlockId.toString().isBlank()) {
            throw new IllegalArgumentException("Hostel Block ID is missing in request.");
        }

        Integer existing = jdbcTemplate.queryForObject("""
                SELECT COUNT(*) FROM hostel_applications
                WHERE student_id = :studentId AND hostel_block_id = CAST(:hostelBlockId AS uuid) AND status = 'Pending'
                """, new MapSqlParameterSource()
                .addValue("studentId", studentId)
                .addValue("hostelBlockId", hostelBlockId.toString()), Integer.class);
        if (existing != null && existing > 0) {
            throw new IllegalArgumentException("You already have a pending application for this hostel");
        }

        System.out.println("Applying: studentId=" + studentId + ", blockId=" + hostelBlockId);

        Map<String, Object> application = jdbcTemplate.query("""
                INSERT INTO hostel_applications (student_id, hostel_block_id, status, application_data)
                VALUES (:studentId, CAST(:hostelBlockId AS uuid), 'Pending', CAST(:applicationData AS jsonb))
                RETURNING *
                """, new MapSqlParameterSource()
                .addValue("studentId", studentId)
                .addValue("hostelBlockId", hostelBlockId.toString())
                .addValue("applicationData", toJson(applicationData)), rs -> {
            if (!rs.next()) {
                throw new IllegalArgumentException("Failed to submit application");
            }
            return mapApplicationRow(rs);
        });

        jdbcTemplate.update("""
                UPDATE students
                SET enrollment_status = 'Applied', updated_at = NOW()
                WHERE id = :studentId
                """, new MapSqlParameterSource("studentId", studentId));

        return Map.of(
                "success", true,
                "message", "Application submitted successfully",
                "data", application
        );
    }

    @GetMapping("/my-applications")
    @PreAuthorize("hasRole('STUDENT')")
    public List<Map<String, Object>> getMyApplications(@AuthenticationPrincipal AuthenticatedUser principal) {
        UUID studentId = getStudentIdForUser(principal.getId());
        if (studentId == null) {
            throw new IllegalArgumentException("Student profile not found");
        }

        return jdbcTemplate.query("""
                SELECT ha.*, hb.block_name, hb.type, hb.location
                FROM hostel_applications ha
                JOIN hostel_blocks hb ON ha.hostel_block_id = hb.id
                WHERE ha.student_id = :studentId
                ORDER BY ha.created_at DESC
                """, new MapSqlParameterSource("studentId", studentId), (rs, rowNum) -> {
            Map<String, Object> mapped = mapApplicationRow(rs);
            mapped.put("hostelBlockId", Map.of(
                    "_id", rs.getObject("hostel_block_id", UUID.class),
                    "blockName", rs.getString("block_name"),
                    "type", rs.getString("type"),
                    "location", rs.getString("location")
            ));
            return mapped;
        });
    }

    @GetMapping("/hostel/{id}")
    public List<Map<String, Object>> getApplicationsForHostel(@PathVariable UUID id) {
        return jdbcTemplate.query("""
                SELECT
                    ha.*,
                    s.roll_number, s.course, s.year, s.department,
                    u.name, u.email, u.phone
                FROM hostel_applications ha
                JOIN students s ON ha.student_id = s.id
                JOIN users u ON s.user_id = u.id
                WHERE ha.hostel_block_id = :id
                ORDER BY ha.created_at DESC
                """, new MapSqlParameterSource("id", id), (rs, rowNum) -> {
            Map<String, Object> mapped = new LinkedHashMap<>();
            mapped.put("_id", rs.getObject("id", UUID.class));
            mapped.put("status", rs.getString("status"));
            mapped.put("applicationData", rs.getString("application_data"));
            mapped.put("createdAt", rs.getTimestamp("created_at"));
            mapped.put("hostelBlockId", rs.getObject("hostel_block_id", UUID.class));
            mapped.put("studentId", Map.of(
                    "_id", rs.getObject("student_id", UUID.class),
                    "name", rs.getString("name"),
                    "email", rs.getString("email"),
                    "phone", rs.getString("phone"),
                    "rollNumber", rs.getString("roll_number"),
                    "course", rs.getString("course"),
                    "year", rs.getObject("year"),
                    "department", rs.getString("department"),
                    "feeStatus", "Paid"
            ));
            return mapped;
        });
    }

    @PatchMapping("/{id}/review")
    @PreAuthorize("hasAnyRole('WARDEN','ADMIN')")
    @Transactional
    public Map<String, Object> reviewApplication(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthenticatedUser principal,
            @RequestBody Map<String, Object> body
    ) {
        String status = (String) body.get("status");
        String notes = body.get("notes") == null ? null : body.get("notes").toString();

        if (!List.of("Accepted", "Rejected").contains(status)) {
            throw new IllegalArgumentException("Invalid application status");
        }

        Map<String, Object> application = jdbcTemplate.query("""
                UPDATE hostel_applications
                SET status = :status, notes = :notes, reviewed_by = :reviewedBy, reviewed_date = NOW()
                WHERE id = :id
                RETURNING *
                """, new MapSqlParameterSource()
                .addValue("status", status)
                .addValue("notes", notes)
                .addValue("reviewedBy", principal.getId())
                .addValue("id", id), rs -> {
            if (!rs.next()) {
                return null;
            }
            return mapApplicationRow(rs);
        });

        if (application == null) {
            throw new IllegalArgumentException("Application not found");
        }

        UUID studentId = (UUID) application.get("studentId");
        UUID hostelBlockId = (UUID) application.get("hostelBlockId");

        if ("Accepted".equals(status)) {
            jdbcTemplate.update("""
                    UPDATE students
                    SET enrollment_status = 'Accepted', hostel_block_id = :hostelBlockId, updated_at = NOW()
                    WHERE id = :studentId
                    """, new MapSqlParameterSource()
                    .addValue("hostelBlockId", hostelBlockId)
                    .addValue("studentId", studentId));

            UUID userId = jdbcTemplate.query(
                    "SELECT user_id FROM students WHERE id = :studentId",
                    new MapSqlParameterSource("studentId", studentId),
                    rs -> rs.next() ? rs.getObject("user_id", UUID.class) : null
            );
            if (userId != null) {
                jdbcTemplate.update("UPDATE users SET can_access_dashboard = true WHERE id = :id", new MapSqlParameterSource("id", userId));
            }

            jdbcTemplate.update("""
                    UPDATE hostel_blocks
                    SET available_rooms = GREATEST(available_rooms - 1, 0),
                        occupied_rooms = occupied_rooms + 1
                    WHERE id = :id
                    """, new MapSqlParameterSource("id", hostelBlockId));
        } else {
            jdbcTemplate.update("""
                    UPDATE students
                    SET enrollment_status = 'Rejected', hostel_block_id = NULL, updated_at = NOW()
                    WHERE id = :studentId
                    """, new MapSqlParameterSource("studentId", studentId));

            UUID userId = jdbcTemplate.query(
                    "SELECT user_id FROM students WHERE id = :studentId",
                    new MapSqlParameterSource("studentId", studentId),
                    rs -> rs.next() ? rs.getObject("user_id", UUID.class) : null
            );
            if (userId != null) {
                jdbcTemplate.update("UPDATE users SET can_access_dashboard = false WHERE id = :id", new MapSqlParameterSource("id", userId));
            }
        }

        return Map.of(
                "success", true,
                "message", "Application " + status.toLowerCase() + " successfully",
                "data", application
        );
    }

    private UUID getStudentIdForUser(UUID userId) {
        return jdbcTemplate.query(
                "SELECT id FROM students WHERE user_id = :userId",
                new MapSqlParameterSource("userId", userId),
                rs -> rs.next() ? rs.getObject("id", UUID.class) : null
        );
    }

    private Map<String, Object> mapApplicationRow(java.sql.ResultSet rs) throws java.sql.SQLException {
        Map<String, Object> mapped = new LinkedHashMap<>();
        mapped.put("_id", rs.getObject("id", UUID.class));
        mapped.put("id", rs.getObject("id", UUID.class));
        mapped.put("studentId", rs.getObject("student_id", UUID.class));
        mapped.put("hostelBlockId", rs.getObject("hostel_block_id", UUID.class));
        mapped.put("status", rs.getString("status"));
        mapped.put("applicationData", rs.getString("application_data"));
        mapped.put("createdAt", rs.getTimestamp("created_at"));
        return mapped;
    }

    private String toJson(Object value) {
        try {
            return value == null ? "{}" : objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            return "{}";
        }
    }
}
