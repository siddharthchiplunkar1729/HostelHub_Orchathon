package com.hostelhub.security;

import com.hostelhub.modules.users.entity.UserEntity;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

public class AuthenticatedUser implements UserDetails {

    private final UserEntity user;
    private final String normalizedRole;

    public AuthenticatedUser(UserEntity user) {
        this.user = user;
        this.normalizedRole = user.getRole() == null ? "" : user.getRole().trim().toUpperCase();
    }

    public UUID getId() {
        return user.getId();
    }

    public String getRole() {
        return user.getRole();
    }

    public UserEntity getUser() {
        return user;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return normalizedRole.isBlank()
                ? List.of()
                : List.of(new SimpleGrantedAuthority("ROLE_" + normalizedRole));
    }

    @Override
    public String getPassword() {
        return user.getPassword();
    }

    @Override
    public String getUsername() {
        return user.getEmail();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return Boolean.TRUE.equals(user.getIsActive());
    }
}
