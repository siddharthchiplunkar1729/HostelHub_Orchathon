package com.hostelhub.security;

import com.hostelhub.modules.users.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(JwtService jwtService, UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String authorization = request.getHeader("Authorization");

        if (authorization != null && authorization.startsWith("Bearer ")) {
            String token = authorization.substring(7);

            try {
                if (SecurityContextHolder.getContext().getAuthentication() == null) {
                    if (!jwtService.isAccessToken(token)) {
                        filterChain.doFilter(request, response);
                        return;
                    }

                    UUID userId = jwtService.extractUserId(token);
                    userRepository.findById(userId).ifPresent(user -> {
                        if (!Boolean.TRUE.equals(user.getIsActive())) {
                            SecurityContextHolder.clearContext();
                            return;
                        }

                        AuthenticatedUser principal = new AuthenticatedUser(user);
                        UsernamePasswordAuthenticationToken authentication =
                                new UsernamePasswordAuthenticationToken(
                                        principal,
                                        null,
                                        principal.getAuthorities()
                                );
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    });
                }
            } catch (JwtException | IllegalArgumentException ignored) {
                SecurityContextHolder.clearContext();
            }
        }

        filterChain.doFilter(request, response);
    }
}
