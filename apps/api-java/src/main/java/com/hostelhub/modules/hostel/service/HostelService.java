package com.hostelhub.modules.hostel.service;

import com.hostelhub.modules.hostel.dto.HostelSummaryDto;
import com.hostelhub.modules.hostel.entity.HostelBlockEntity;
import com.hostelhub.modules.hostel.repository.HostelBlockRepository;
import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

@Service
public class HostelService {

    private final HostelBlockRepository hostelBlockRepository;

    public HostelService(HostelBlockRepository hostelBlockRepository) {
        this.hostelBlockRepository = hostelBlockRepository;
    }

    public List<HostelSummaryDto> getHostels(String location, String type, BigDecimal minRating) {
        Specification<HostelBlockEntity> specification = (root, query, cb) -> cb.conjunction();

        if (location != null && !location.isBlank()) {
            String term = "%" + location.toLowerCase() + "%";
            specification = specification.and((root, query, cb) -> cb.or(
                    cb.like(cb.lower(root.get("blockName")), term),
                    cb.like(cb.lower(root.get("location")), term)
            ));
        }

        if (type != null && !type.isBlank()) {
            specification = specification.and((root, query, cb) -> cb.equal(root.get("type"), type));
        }

        if (minRating != null) {
            specification = specification.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("rating"), minRating));
        }

        return hostelBlockRepository.findAll(specification, Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .map(this::toSummaryDto)
                .toList();
    }

    public HostelSummaryDto toSummaryDto(HostelBlockEntity entity) {
        List<String> facilities = entity.getFacilities() == null ? List.of() : Arrays.asList(entity.getFacilities());
        List<String> images = entity.getImages() == null ? List.of() : Arrays.asList(entity.getImages());

        return new HostelSummaryDto(
                entity.getId(),
                entity.getBlockName(),
                entity.getBlockName(),
                entity.getType(),
                entity.getDescription(),
                entity.getTotalRooms(),
                entity.getAvailableRooms(),
                entity.getOccupiedRooms(),
                entity.getLocation(),
                entity.getRating() != null ? entity.getRating() : BigDecimal.ZERO,
                images,
                facilities,
                facilities.contains("Mess"),
                entity.getApprovalStatus() != null ? entity.getApprovalStatus() : "Approved",
                entity.getCategory()
        );
    }
}
