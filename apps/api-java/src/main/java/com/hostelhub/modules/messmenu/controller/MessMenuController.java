package com.hostelhub.modules.messmenu.controller;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.hostelhub.security.AuthenticatedUser;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/mess-menu")
public class MessMenuController {

    private final NamedParameterJdbcTemplate jdbcTemplate;

    public MessMenuController(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public Object getMenus(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @RequestParam(required = false) UUID blockId,
            @RequestParam(required = false) String day
    ) {
        if (blockId == null && principal != null && "STUDENT".equalsIgnoreCase(principal.getRole())) {
            blockId = getStudentHostelId(principal.getId());
        }

        StringBuilder sql = new StringBuilder("""
                SELECT mm.*, hb.block_name
                FROM mess_menu mm
                LEFT JOIN hostel_blocks hb ON mm.hostel_block_id = hb.id
                WHERE 1 = 1
                """);
        MapSqlParameterSource params = new MapSqlParameterSource();

        if (blockId != null) {
            sql.append(" AND mm.hostel_block_id = :blockId");
            params.addValue("blockId", blockId);
        }
        if (day != null && !day.isBlank()) {
            sql.append(" AND LOWER(mm.day) = LOWER(:day)");
            params.addValue("day", day);
        }

        List<Map<String, Object>> menus = jdbcTemplate.query(sql.toString(), params, (rs, rowNum) -> mapMenu(rs, rs.getString("block_name")));
        if (day != null && !day.isBlank()) {
            return menus.isEmpty() ? null : menus.get(0);
        }
        return menus;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> createMenu(@RequestBody Map<String, Object> body) {
        String sql = """
                INSERT INTO mess_menu (hostel_block_id, day, breakfast, lunch, snacks, dinner)
                VALUES (:hostelBlockId, :day, :breakfast, :lunch, :snacks, :dinner)
                RETURNING *
                """;

        return jdbcTemplate.query(sql, new MapSqlParameterSource()
                .addValue("hostelBlockId", body.get("hostelBlockId"))
                .addValue("day", body.get("day"))
                .addValue("breakfast", body.get("breakfast"))
                .addValue("lunch", body.get("lunch"))
                .addValue("snacks", body.get("snacks"))
                .addValue("dinner", body.get("dinner")), rs -> {
            if (!rs.next()) {
                throw new IllegalArgumentException("Failed to create mess menu");
            }
            Map<String, Object> mapped = new LinkedHashMap<>();
            mapped.put("_id", rs.getObject("id", UUID.class));
            mapped.put("id", rs.getObject("id", UUID.class));
            mapped.put("day", rs.getString("day"));
            return mapped;
        });
    }

    @GetMapping("/week")
    public Map<String, Object> getWeeklyMenus(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @RequestParam(required = false) UUID hostelBlockId
    ) {
        if (hostelBlockId == null && principal != null && "STUDENT".equalsIgnoreCase(principal.getRole())) {
            hostelBlockId = getStudentHostelId(principal.getId());
        }

        StringBuilder sql = new StringBuilder("""
                SELECT mm.*, hb.block_name
                FROM mess_menu mm
                LEFT JOIN hostel_blocks hb ON mm.hostel_block_id = hb.id
                WHERE 1 = 1
                """);
        MapSqlParameterSource params = new MapSqlParameterSource();
        if (hostelBlockId != null) {
            sql.append(" AND mm.hostel_block_id = :hostelBlockId");
            params.addValue("hostelBlockId", hostelBlockId);
        }

        sql.append("""
                 ORDER BY CASE
                    WHEN mm.day = 'Monday' THEN 1
                    WHEN mm.day = 'Tuesday' THEN 2
                    WHEN mm.day = 'Wednesday' THEN 3
                    WHEN mm.day = 'Thursday' THEN 4
                    WHEN mm.day = 'Friday' THEN 5
                    WHEN mm.day = 'Saturday' THEN 6
                    WHEN mm.day = 'Sunday' THEN 7
                    ELSE 8 END
                """);

        List<Map<String, Object>> menus = jdbcTemplate.query(sql.toString(), params, (rs, rowNum) -> mapWeeklyMenu(rs, rs.getString("block_name")));

        return Map.of(
                "success", true,
                "menus", menus,
                "count", menus.size()
        );
    }

    @PostMapping("/{id}/rate")
    public Map<String, Object> rateMenu(@PathVariable UUID id, @RequestBody Map<String, Object> body) {
        String mealType = String.valueOf(body.get("mealType")).toLowerCase();
        String rating = "up".equals(body.get("rating")) ? "up" : "down";
        String column = mealType + "_" + rating;

        String sql = "UPDATE mess_menu SET " + column + " = " + column + " + 1 WHERE id = :id RETURNING *";
        List<Map<String, Object>> rows = jdbcTemplate.query(sql, new MapSqlParameterSource("id", id), (rs, rowNum) -> {
            Map<String, Object> mapped = new LinkedHashMap<>();
            mapped.put("_id", rs.getObject("id", UUID.class));
            mapped.put("id", rs.getObject("id", UUID.class));
            return mapped;
        });

        if (rows.isEmpty()) {
            throw new IllegalArgumentException("Menu not found");
        }

        return Map.of("success", true, "menu", rows.get(0));
    }

    private UUID getStudentHostelId(UUID userId) {
        try {
            return jdbcTemplate.queryForObject("""
                    SELECT hostel_block_id FROM hostel_applications
                    WHERE student_id = (SELECT id FROM students WHERE user_id = :userId)
                    AND status = 'Accepted'
                    LIMIT 1
                    """, new MapSqlParameterSource("userId", userId), UUID.class);
        } catch (Exception e) {
            return null;
        }
    }

    private Map<String, Object> mapMenu(java.sql.ResultSet rs, String blockName) throws java.sql.SQLException {
        Map<String, Object> mapped = new LinkedHashMap<>();
        mapped.put("_id", rs.getObject("id", UUID.class));
        mapped.put("date", java.time.Instant.now().toString());
        mapped.put("day", rs.getString("day"));
        mapped.put("hostelName", blockName);
        mapped.put("meals", List.of(
                meal("Breakfast", rs.getString("breakfast"), "07:30 AM - 09:30 AM", 450),
                meal("Lunch", rs.getString("lunch"), "12:30 PM - 02:30 PM", 850),
                meal("Snacks", rs.getString("snacks"), "04:30 PM - 05:30 PM", 300),
                meal("Dinner", rs.getString("dinner"), "07:30 PM - 09:30 PM", 750)
        ));
        return mapped;
    }

    private Map<String, Object> mapWeeklyMenu(java.sql.ResultSet rs, String blockName) throws java.sql.SQLException {
        Map<String, Object> mapped = new LinkedHashMap<>();
        mapped.put("_id", rs.getObject("id", UUID.class));
        mapped.put("day", rs.getString("day"));
        mapped.put("date", java.time.Instant.now().toString());
        mapped.put("hostelName", blockName);
        mapped.put("meals", List.of(
                mealNoCalories("Breakfast", rs.getString("breakfast"), "07:30 AM - 09:30 AM"),
                mealNoCalories("Lunch", rs.getString("lunch"), "12:30 PM - 02:30 PM"),
                mealNoCalories("Snacks", rs.getString("snacks"), "04:30 PM - 05:30 PM"),
                mealNoCalories("Dinner", rs.getString("dinner"), "07:30 PM - 09:30 PM")
        ));
        return mapped;
    }

    private Map<String, Object> meal(String mealType, String items, String timings, int calories) {
        return Map.of(
                "mealType", mealType,
                "items", items == null || items.isBlank() ? List.of() : List.of(items.split("\\s*,\\s*")),
                "timings", timings,
                "calories", calories
        );
    }

    private Map<String, Object> mealNoCalories(String mealType, String items, String timings) {
        return Map.of(
                "mealType", mealType,
                "items", items == null || items.isBlank() ? List.of() : List.of(items.split("\\s*,\\s*")),
                "timings", timings
        );
    }
}
