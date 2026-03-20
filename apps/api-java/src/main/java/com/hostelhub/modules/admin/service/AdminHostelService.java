package com.hostelhub.modules.admin.service;

import com.hostelhub.modules.admin.dto.AdminHostelStatusRequest;
import com.hostelhub.modules.admin.dto.AdminHostelSummaryDto;
import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class AdminHostelService {

    private final NamedParameterJdbcTemplate jdbcTemplate;

    public AdminHostelService(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<AdminHostelSummaryDto> getAdminHostels(String status) {
        StringBuilder sql = new StringBuilder("""
                SELECT hb.*, u.name AS warden_name, u.email AS warden_email
                FROM hostel_blocks hb
                LEFT JOIN users u ON hb.warden_user_id = u.id
                WHERE 1 = 1
                """);

        MapSqlParameterSource params = new MapSqlParameterSource();

        if (status != null && !status.isBlank() && !"All".equalsIgnoreCase(status)) {
            sql.append("""
                     AND (
                         hb.approval_status = :status
                         OR (:status = 'Approved' AND hb.approval_status IS NULL)
                     )
                    """);
            params.addValue("status", status);
        }

        sql.append(" ORDER BY hb.created_at DESC");

        return jdbcTemplate.query(sql.toString(), params, (rs, rowNum) -> mapRow(rs));
    }

    public AdminHostelSummaryDto updateApprovalStatus(UUID hostelId, AdminHostelStatusRequest request) {
        if (!List.of("Approved", "Rejected", "Suspended").contains(request.status())) {
            throw new IllegalArgumentException("Invalid approval status");
        }

        String sql = """
                UPDATE hostel_blocks
                SET approval_status = :status, updated_at = NOW()
                WHERE id = :id
                RETURNING *, '' AS warden_name, '' AS warden_email
                """;

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("status", request.status())
                .addValue("id", hostelId);

        List<AdminHostelSummaryDto> results = jdbcTemplate.query(sql, params, (rs, rowNum) -> mapRow(rs));
        if (results.isEmpty()) {
            throw new IllegalArgumentException("Hostel not found");
        }

        return results.get(0);
    }

    private AdminHostelSummaryDto mapRow(ResultSet rs) throws SQLException {
        return new AdminHostelSummaryDto(
                rs.getObject("id", java.util.UUID.class),
                rs.getString("block_name"),
                rs.getString("type"),
                rs.getString("description"),
                getNullableInt(rs, "total_rooms"),
                getNullableInt(rs, "available_rooms"),
                getNullableInt(rs, "occupied_rooms"),
                rs.getString("location"),
                getNullableBigDecimal(rs, "rating"),
                defaultApprovalStatus(rs.getString("approval_status")),
                rs.getString("category"),
                new AdminHostelSummaryDto.WardenInfoDto(
                        defaultString(rs.getString("warden_name"), "Unassigned"),
                        defaultString(rs.getString("warden_email"), "n/a")
                )
        );
    }

    private Integer getNullableInt(ResultSet rs, String column) throws SQLException {
        int value = rs.getInt(column);
        return rs.wasNull() ? null : value;
    }

    private BigDecimal getNullableBigDecimal(ResultSet rs, String column) throws SQLException {
        BigDecimal value = rs.getBigDecimal(column);
        return value != null ? value : BigDecimal.ZERO;
    }

    private String defaultApprovalStatus(String approvalStatus) {
        return approvalStatus != null ? approvalStatus : "Approved";
    }

    private String defaultString(String value, String fallback) {
        return value != null && !value.isBlank() ? value : fallback;
    }
}
