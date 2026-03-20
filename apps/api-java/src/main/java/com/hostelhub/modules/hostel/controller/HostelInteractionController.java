package com.hostelhub.modules.hostel.controller;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/hostels/{id}")
public class HostelInteractionController {

    private final NamedParameterJdbcTemplate jdbcTemplate;

    public HostelInteractionController(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/reviews")
    public Map<String, Object> getReviews(@PathVariable UUID id) {
        List<Map<String, Object>> reviews = jdbcTemplate.query("""
                SELECT r.*, u.name AS student_name
                FROM reviews r
                JOIN students s ON r.student_id = s.id
                JOIN users u ON s.user_id = u.id
                WHERE r.hostel_block_id = :id
                ORDER BY r.created_at DESC
                """, new MapSqlParameterSource("id", id), (rs, rowNum) -> {
            Map<String, Object> mapped = new LinkedHashMap<>();
            mapped.put("_id", rs.getObject("id", UUID.class));
            mapped.put("student_name", rs.getString("student_name"));
            mapped.put("rating", rs.getInt("rating"));
            mapped.put("review_text", rs.getString("review_text"));
            mapped.put("helpful", rs.getInt("helpful"));
            mapped.put("created_at", rs.getTimestamp("created_at"));
            return mapped;
        });

        Map<String, Object> stats = jdbcTemplate.query("""
                SELECT AVG(rating) AS average_rating, COUNT(*) AS total_reviews
                FROM reviews WHERE hostel_block_id = :id
                """, new MapSqlParameterSource("id", id), rs -> {
            if (!rs.next()) {
                return Map.of("averageRating", 0, "totalReviews", 0);
            }
            return Map.of(
                    "averageRating", rs.getBigDecimal("average_rating") == null ? 0 : rs.getBigDecimal("average_rating"),
                    "totalReviews", rs.getInt("total_reviews")
            );
        });

        if (stats == null) {
            stats = Map.of("averageRating", 0, "totalReviews", 0);
        }

        return Map.of(
                "reviews", reviews,
                "averageRating", stats.get("averageRating"),
                "totalReviews", stats.get("totalReviews")
        );
    }

    @PostMapping("/reviews")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public Map<String, Object> createReview(@PathVariable UUID id, @RequestBody Map<String, Object> body) {
        String sql = """
                INSERT INTO reviews (student_id, hostel_block_id, rating, review_text)
                VALUES (:studentId, :hostelId, :rating, :reviewText)
                RETURNING *
                """;
        Map<String, Object> review = jdbcTemplate.query(sql, new MapSqlParameterSource()
                .addValue("studentId", body.get("studentId"))
                .addValue("hostelId", id)
                .addValue("rating", body.get("rating"))
                .addValue("reviewText", body.get("reviewText")), rs -> {
            if (!rs.next()) {
                throw new IllegalArgumentException("Failed to create review");
            }
            return Map.of("_id", rs.getObject("id", UUID.class));
        });

        jdbcTemplate.update("""
                UPDATE hostel_blocks
                SET rating = (SELECT AVG(rating) FROM reviews WHERE hostel_block_id = :id)
                WHERE id = :id
                """, new MapSqlParameterSource("id", id));

        return Map.of("success", true, "review", review);
    }

    @PostMapping("/reviews/{reviewId}/helpful")
    public Map<String, Object> markHelpful(@PathVariable UUID id, @PathVariable UUID reviewId) {
        Integer helpfulCount = jdbcTemplate.query("""
                UPDATE reviews
                SET helpful = helpful + 1
                WHERE id = :id
                RETURNING helpful
                """, new MapSqlParameterSource("id", reviewId), rs -> rs.next() ? rs.getInt("helpful") : null);

        if (helpfulCount == null) {
            throw new IllegalArgumentException("Review not found");
        }

        return Map.of("success", true, "helpfulCount", helpfulCount);
    }

    @GetMapping("/comments")
    public List<Map<String, Object>> getComments(@PathVariable UUID id) {
        return jdbcTemplate.query("""
                SELECT c.*, u.name AS user_name
                FROM hostel_comments c
                JOIN users u ON c.user_id = u.id
                WHERE c.hostel_block_id = :id
                ORDER BY c.created_at ASC
                """, new MapSqlParameterSource("id", id), (rs, rowNum) -> {
            Map<String, Object> user = new LinkedHashMap<>();
            user.put("name", rs.getString("user_name"));

            Map<String, Object> mapped = new LinkedHashMap<>();
            mapped.put("_id", rs.getObject("id", UUID.class));
            mapped.put("userId", rs.getObject("user_id", UUID.class));
            mapped.put("userType", rs.getString("user_type"));
            mapped.put("text", rs.getString("comment_text"));
            mapped.put("parentId", rs.getObject("parent_id"));
            mapped.put("createdAt", rs.getTimestamp("created_at"));
            mapped.put("user", user);
            return mapped;
        });
    }

    @PostMapping("/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> createComment(@PathVariable UUID id, @RequestBody Map<String, Object> body) {
        String sql = """
                INSERT INTO hostel_comments (hostel_block_id, user_id, user_type, comment_text, parent_id)
                VALUES (:hostelId, :userId, :userType, :text, :parentId)
                RETURNING *
                """;

        Map<String, Object> comment = jdbcTemplate.query(sql, new MapSqlParameterSource()
                .addValue("hostelId", id)
                .addValue("userId", body.get("userId"))
                .addValue("userType", body.get("userType"))
                .addValue("text", body.get("text"))
                .addValue("parentId", body.get("parentId")), rs -> {
            if (!rs.next()) {
                throw new IllegalArgumentException("Failed to create comment");
            }
            return Map.of("_id", rs.getObject("id", UUID.class));
        });

        return Map.of("success", true, "comment", comment);
    }

    @PostMapping("/comments/{commentId}/reply")
    public Map<String, Object> replyToComment(
            @PathVariable UUID id,
            @PathVariable UUID commentId,
            @RequestBody Map<String, Object> body
    ) {
        String sql = """
                INSERT INTO hostel_comments (hostel_block_id, user_id, user_type, comment_text, parent_id)
                VALUES (:hostelId, :userId, :userType, :text, :parentId)
                RETURNING *
                """;

        Map<String, Object> reply = jdbcTemplate.query(sql, new MapSqlParameterSource()
                .addValue("hostelId", id)
                .addValue("userId", body.get("userId"))
                .addValue("userType", body.getOrDefault("userType", "Student"))
                .addValue("text", body.get("text"))
                .addValue("parentId", commentId), rs -> {
            if (!rs.next()) {
                throw new IllegalArgumentException("Failed to create reply");
            }
            return Map.of("_id", rs.getObject("id", UUID.class));
        });

        return Map.of("success", true, "reply", reply);
    }
}
