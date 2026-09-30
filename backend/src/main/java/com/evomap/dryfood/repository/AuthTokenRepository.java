package com.evomap.dryfood.repository;

import com.evomap.dryfood.model.AuthToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface AuthTokenRepository extends JpaRepository<AuthToken, Long> {

    Optional<AuthToken> findByToken(String token);

    void deleteByToken(String token);

    void deleteByExpiresAtBefore(LocalDateTime now);
}
