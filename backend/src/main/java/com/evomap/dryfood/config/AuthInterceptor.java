package com.evomap.dryfood.config;

import com.evomap.dryfood.exception.UnauthorizedException;
import com.evomap.dryfood.model.AuthToken;
import com.evomap.dryfood.model.User;
import com.evomap.dryfood.repository.AuthTokenRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.LocalDateTime;

/**
 * Xac thuc + phan quyen cho /api/**:
 * - /api/auth/** : cong khai (khong can token)
 * - GET /api/products : cong khai (khach chua dang nhap van xem duoc)
 * - /api/customers/**, /api/dashboard/** : chi admin
 * - POST/PUT/DELETE /api/products/**, PUT/DELETE /api/orders/** : chi admin
 * - Con lai: can dang nhap (Bearer token)
 */
@Component
public class AuthInterceptor implements HandlerInterceptor {

    public static final String USER_ATTR = "user";

    private final AuthTokenRepository authTokenRepository;

    public AuthInterceptor(AuthTokenRepository authTokenRepository) {
        this.authTokenRepository = authTokenRepository;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String path = request.getRequestURI();
        String method = request.getMethod();

        // Cong khai: register + login
        if (path.equals("/api/auth/register") || path.equals("/api/auth/login")) {
            return true;
        }

        // Cong khai: xem danh sach san pham (store khach hang)
        if (method.equals("GET") && path.startsWith("/api/products")) {
            return true;
        }

        // Cac API con lai can dang nhap (gom ca /api/auth/me, /api/auth/logout)
        User user = authenticate(request);

        // Admin-only areas
        boolean adminArea = path.startsWith("/api/customers")
                || path.startsWith("/api/dashboard")
                || (path.startsWith("/api/products") && !method.equals("GET"))
                || (path.startsWith("/api/orders") && (method.equals("PUT") || method.equals("DELETE")));

        if (adminArea && user.getRole() != User.Role.ADMIN) {
            throw new UnauthorizedException("Khong co quyen truy cap (can tai khoan admin)");
        }

        request.setAttribute(USER_ATTR, user);
        return true;
    }

    private User authenticate(HttpServletRequest request) {
        String auth = request.getHeader("Authorization");
        if (auth == null || !auth.startsWith("Bearer ")) {
            throw new UnauthorizedException("Vui long dang nhap (thieu token)");
        }
        String token = auth.substring(7).trim();
        if (token.isEmpty()) {
            throw new UnauthorizedException("Vui long dang nhap (token rong)");
        }

        AuthToken authToken = authTokenRepository.findByToken(token)
                .orElseThrow(() -> new UnauthorizedException("Phien dang nhap khong hop le hoac da het han"));

        if (authToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            authTokenRepository.delete(authToken);
            throw new UnauthorizedException("Phien dang nhap da het han");
        }

        return authToken.getUser();
    }
}
