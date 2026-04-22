package com.hostelhub.common.exception;

import jakarta.validation.ConstraintViolationException;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException exception) {
        HttpStatus status = exception.getMessage() != null && exception.getMessage().contains("not found")
                ? HttpStatus.NOT_FOUND
                : HttpStatus.BAD_REQUEST;

        return buildErrorResponse(status, exception.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException exception) {
        String message = exception.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .orElse("Validation failed");

        return buildErrorResponse(HttpStatus.BAD_REQUEST, message);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, Object>> handleConstraintViolation(ConstraintViolationException exception) {
        String message = exception.getConstraintViolations().stream()
                .findFirst()
                .map(violation -> violation.getPropertyPath() + ": " + violation.getMessage())
                .orElse("Validation failed");

        return buildErrorResponse(HttpStatus.BAD_REQUEST, message);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> handleArgumentTypeMismatch(MethodArgumentTypeMismatchException exception) {
        return buildErrorResponse(HttpStatus.BAD_REQUEST, "Invalid value for " + exception.getName());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException exception) {
        return buildErrorResponse(HttpStatus.FORBIDDEN, "Access denied");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleUnhandledException(Exception exception) {
        return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred");
    }

    private ResponseEntity<Map<String, Object>> buildErrorResponse(HttpStatus status, String message) {
        String safeMessage = message == null || message.isBlank() ? "Request failed" : message;
        return ResponseEntity.status(status)
                .header(HttpHeaders.CONTENT_TYPE, "application/json")
                .body(Map.of(
                        "success", false,
                        "error", safeMessage
                ));
    }
}
