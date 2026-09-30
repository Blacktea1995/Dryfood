package com.evomap.dryfood.service;

import com.evomap.dryfood.exception.BadRequestException;
import com.evomap.dryfood.exception.UnauthorizedException;
import com.evomap.dryfood.model.AuthToken;
import com.evomap.dryfood.model.Customer;
import com.evomap.dryfood.model.User;
import com.evomap.dryfood.repository.AuthTokenRepository;
import com.evomap.dryfood.repository.CustomerRepository;
import com.evomap.dryfood.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;

@Service
public class AuthService {

    private static final int ITERATIONS = 120_000;
    private static final int KEY_LENGTH = 256;
    private static final int SALT_LENGTH = 16;
    private static final int TOKEN_BYTES = 32;
    private static final int TOKEN_TTL_SECONDS = 24 * 7 * 3600;

    private final UserRepository userRepository;
    private final AuthTokenRepository authTokenRepository;
    private final CustomerRepository customerRepository;

    public AuthService(UserRepository userRepository,
                       AuthTokenRepository authTokenRepository,
                       CustomerRepository customerRepository) {
        this.userRepository = userRepository;
        this.authTokenRepository = authTokenRepository;
        this.customerRepository = customerRepository;
    }

    /** Ket qua dang nhap / dang ky. */
    public record AuthResult(User user, String token) {
    }

    /**
     * Dang ky tai khoan khach hang: tao User (role CUSTOMER) va Customer tuong ung
     * de don hang cua khach lien ket vao bang customers nhu luong admin hien tai.
     */
    @Transactional
    public AuthResult register(String name, String email, String password, String phone, String address) {
        email = normalizeEmail(email);
        if (userRepository.existsByEmail(email)) {
            throw new BadRequestException("Email nay da duoc dang ky");
        }
        if (password == null || password.length() < 6) {
            throw new BadRequestException("Mat khau phai co it nhat 6 ky tu");
        }

        Customer customer = new Customer(name, email, phone, address);
        Customer savedCustomer = customerRepository.save(customer);

        User user = new User(name, email, hashPassword(password), phone, address, User.Role.CUSTOMER);
        user.setCustomerId(savedCustomer.getId());
        userRepository.save(user);

        return issueToken(user);
    }

    /**
     * Dang nhap voi email/password; tra ve user + token.
     */
    @Transactional
    public AuthResult login(String email, String password) {
        User user = userRepository.findByEmail(normalizeEmail(email))
                .orElseThrow(() -> new UnauthorizedException("Sai email hoac mat khau"));

        if (password == null || !verifyPassword(password, user.getPasswordHash())) {
            throw new UnauthorizedException("Sai email hoac mat khau");
        }

        return issueToken(user);
    }

    @Transactional
    public void logout(String token) {
        if (token != null && !token.isBlank()) {
            authTokenRepository.deleteByToken(token);
        }
    }

    // ==================== helpers ====================

    private AuthResult issueToken(User user) {
        purgeExpiredTokens();
        AuthToken token = new AuthToken(generateToken(), user, LocalDateTime.now().plusSeconds(TOKEN_TTL_SECONDS));
        String raw = token.getToken();
        authTokenRepository.save(token);
        return new AuthResult(user, raw);
    }

    private void purgeExpiredTokens() {
        authTokenRepository.deleteByExpiresAtBefore(LocalDateTime.now());
    }

    private String hashPassword(String password) {
        byte[] salt = new byte[SALT_LENGTH];
        new SecureRandom().nextBytes(salt);
        byte[] hash = pbkdf2(password, salt);
        return "pbkdf2$" + base64(salt) + "$" + base64(hash);
    }

    private boolean verifyPassword(String password, String stored) {
        String[] parts = stored.split("\\$");
        if (parts.length != 3 || !"pbkdf2".equals(parts[0])) {
            return false;
        }
        try {
            byte[] salt = Base64.getDecoder().decode(parts[1]);
            byte[] expected = Base64.getDecoder().decode(parts[2]);
            byte[] actual = pbkdf2(password, salt);
            return constantTimeEquals(expected, actual);
        } catch (IllegalArgumentException ex) {
            return false;
        }
    }

    private byte[] pbkdf2(String password, byte[] salt) {
        try {
            PBEKeySpec spec = new PBEKeySpec(password.toCharArray(), salt, ITERATIONS, KEY_LENGTH);
            SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
            return factory.generateSecret(spec).getEncoded();
        } catch (Exception e) {
            throw new RuntimeException("Khong the hash mat khau", e);
        }
    }

    private boolean constantTimeEquals(byte[] a, byte[] b) {
        if (a == null || b == null || a.length != b.length) {
            return false;
        }
        int result = 0;
        for (int i = 0; i < a.length; i++) {
            result |= a[i] ^ b[i];
        }
        return result == 0;
    }

    private String generateToken() {
        byte[] bytes = new byte[TOKEN_BYTES];
        new SecureRandom().nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }

    private String base64(byte[] bytes) {
        return Base64.getEncoder().encodeToString(bytes);
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}
