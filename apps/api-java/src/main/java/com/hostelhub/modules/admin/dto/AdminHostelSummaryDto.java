package com.hostelhub.modules.admin.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record AdminHostelSummaryDto(
        UUID id,
        String blockName,
        String type,
        String description,
        Integer totalRooms,
        Integer availableRooms,
        Integer occupiedRooms,
        String location,
        BigDecimal rating,
        String approvalStatus,
        String category,
        WardenInfoDto wardenInfo
) {
    public record WardenInfoDto(
            String name,
            String email
    ) {
    }
}
