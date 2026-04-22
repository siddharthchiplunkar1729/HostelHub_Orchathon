package com.hostelhub.modules.admin.controller;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final NamedParameterJdbcTemplate jdbcTemplate;

    public AdminUserController(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public List<Map<String, Object>> getAllUsers() {
        String sql = """
                SELECT id, name, email, phone, role, created_at, updated_at
                FROM users
                ORDER BY created_at DESC
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("_id", rs.getObject("id", UUID.class));
            map.put("name", rs.getString("name"));
            map.put("email", rs.getString("email"));
            map.put("phone", rs.getString("phone"));
            map.put("role", rs.getString("role"));
            map.put("createdAt", rs.getTimestamp("created_at"));
            map.put("updatedAt", rs.getTimestamp("updated_at"));
            return map;
        });
    }

    @PutMapping("/{id}/role")
    public Map<String, Object> updateUserRole(@PathVariable UUID id, @RequestBody Map<String, Object> body) {
        String newRole = (String) body.get("role");
        if (newRole == null || !List.of("Student", "Warden", "Admin").contains(newRole)) {
            throw new IllegalArgumentException("Invalid role");
        }

        String sql = """
                UPDATE users
                SET role = :role, updated_at = NOW()
                WHERE id = :id
                RETURNING id, name, email, role
                """;

        Map<String, Object> user = jdbcTemplate.query(sql, new MapSqlParameterSource()
                .addValue("id", id)
                .addValue("role", newRole), rs -> {
            if (!rs.next()) {
                throw new IllegalArgumentException("User not found");
            }
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("_id", rs.getObject("id", UUID.class));
            map.put("name", rs.getString("name"));
            map.put("email", rs.getString("email"));
            map.put("role", rs.getString("role"));
            return map;
        });

        return Map.of(
                "success", true,
                "message", "User role updated successfully",
                "user", user
        );
    }
}
