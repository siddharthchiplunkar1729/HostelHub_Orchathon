package com.hostelhub.modules.content.controller;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ContentController {

    private final NamedParameterJdbcTemplate jdbcTemplate;

    public ContentController(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/api/stories")
    public List<Map<String, Object>> getStories(@RequestParam(required = false) UUID userId) {
        StringBuilder sql = new StringBuilder("""
                SELECT s.*, u.name AS user_name
                FROM stories s
                JOIN users u ON s.user_id = u.id
                WHERE 1 = 1
                """);
        MapSqlParameterSource params = new MapSqlParameterSource();
        if (userId != null) {
            sql.append(" AND s.user_id = :userId");
            params.addValue("userId", userId);
        }
        sql.append(" ORDER BY s.created_at DESC LIMIT 20");

        return jdbcTemplate.query(sql.toString(), params, (rs, rowNum) -> {
            Map<String, Object> author = new LinkedHashMap<>();
            author.put("name", rs.getString("user_name"));

            Map<String, Object> mapped = new LinkedHashMap<>();
            mapped.put("_id", rs.getObject("id", UUID.class));
            mapped.put("title", rs.getString("title"));
            mapped.put("content", rs.getString("content"));
            mapped.put("image", rs.getString("image"));
            mapped.put("tags", rs.getArray("tags") == null ? List.of() : List.of((String[]) rs.getArray("tags").getArray()));
            mapped.put("author", author);
            return mapped;
        });
    }

    @PostMapping("/api/stories")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> createStory(@RequestBody Map<String, Object> body) {
        String[] tags = body.get("tags") instanceof List<?> list ? list.stream().map(String::valueOf).toArray(String[]::new) : new String[0];
        String sql = """
                INSERT INTO stories (user_id, title, content, image, tags)
                VALUES (:userId, :title, :content, :image, CAST(:tags AS text[]))
                RETURNING *
                """;
        return jdbcTemplate.query(sql, new MapSqlParameterSource()
                .addValue("userId", body.get("userId"))
                .addValue("title", body.get("title"))
                .addValue("content", body.get("content"))
                .addValue("image", body.get("image"))
                .addValue("tags", toArrayLiteral(tags)), rs -> {
            if (!rs.next()) {
                throw new IllegalArgumentException("Failed to create story");
            }
            return Map.of("_id", rs.getObject("id", UUID.class));
        });
    }

    @GetMapping("/api/communities")
    public List<Map<String, Object>> getCommunities() {
        return jdbcTemplate.query("SELECT * FROM communities ORDER BY member_count DESC", new MapSqlParameterSource(), (rs, rowNum) -> {
            Map<String, Object> mapped = new LinkedHashMap<>();
            mapped.put("_id", rs.getObject("id", UUID.class));
            mapped.put("name", rs.getString("name"));
            mapped.put("description", rs.getString("description"));
            mapped.put("memberCount", rs.getInt("member_count"));
            mapped.put("image", rs.getString("image"));
            return mapped;
        });
    }

    @PostMapping("/api/communities")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> createCommunity(@RequestBody Map<String, Object> body) {
        String sql = """
                INSERT INTO communities (name, description, image)
                VALUES (:name, :description, :image)
                RETURNING *
                """;
        return jdbcTemplate.query(sql, new MapSqlParameterSource()
                .addValue("name", body.get("name"))
                .addValue("description", body.get("description"))
                .addValue("image", body.get("image")), rs -> {
            if (!rs.next()) {
                throw new IllegalArgumentException("Failed to create community");
            }
            return Map.of("_id", rs.getObject("id", UUID.class));
        });
    }

    @PostMapping("/api/bookings")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> createBooking(@RequestBody Map<String, Object> body) {
        if (body.get("hostelId") == null || body.get("checkIn") == null || body.get("checkOut") == null) {
            throw new IllegalArgumentException("Missing required fields");
        }

        String sql = """
                INSERT INTO bookings (hostel_block_id, student_id, check_in, check_out, amount, status)
                VALUES (:hostelId, :studentId, :checkIn, :checkOut, :amount, 'Confirmed')
                RETURNING *
                """;

        return jdbcTemplate.query(sql, new MapSqlParameterSource()
                .addValue("hostelId", body.get("hostelId"))
                .addValue("studentId", body.get("studentId"))
                .addValue("checkIn", body.get("checkIn"))
                .addValue("checkOut", body.get("checkOut"))
                .addValue("amount", body.getOrDefault("amount", 0)), rs -> {
            if (!rs.next()) {
                throw new IllegalArgumentException("Failed to create booking");
            }
            return Map.of("_id", rs.getObject("id", UUID.class));
        });
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
}
