package com.hostelhub.modules.hostel.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record HostelSummaryDto(
        UUID id,
        String name,
        String blockName,
        String type,
        String description,
        Integer totalRooms,
        Integer availableRooms,
        Integer occupiedRooms,
        String location,
        BigDecimal rating,
        List<String> images,
        List<String> facilities,
        boolean messAvailable,
        String approvalStatus,
        String category
) {
}
