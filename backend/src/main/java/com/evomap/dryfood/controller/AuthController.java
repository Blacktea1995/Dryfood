package com.evomap.dryfood.controller;

import com.evomap.dryfood.model.User;
import com.evomap.dryfood.service.AuthService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@Valid @RequestBody RegisterRequest body) {
        AuthService.AuthResult result = authService.register(
                body.name(), body.email(), body.password(), body.phone(), body.address());
        return ResponseEntity.status(HttpStatus.CREATED).body(response(result));
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody LoginRequest body) {
        AuthService.AuthResult result = authService.login(body.email(), body.password());
        return ResponseEntity.ok(response(result));
    }

    @GetMapping("/me")
    public Map<String, Object> me(@RequestAttribute("user") User user) {
        return userResponse(user);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestAttribute(value = "user", required = false) User user,
                                       @RequestHeader(value = "Authorization", required = false) String authorization) {
        if (authorization != null && authorization.startsWith("Bearer ")) {
            authService.logout(authorization.substring(7).trim());
        }
        return ResponseEntity.noContent().build();
    }

    private Map<String, Object> response(AuthService.AuthResult result) {
        Map<String, Object> map = userResponse(result.user());
        map.put("token", result.token());
        return map;
    }

    private Map<String, Object> userResponse(User user) {
        Map<String, Object> map = new java.util.HashMap<>();
        map.put("id", user.getId());
        map.put("name", user.getName());
        map.put("email", user.getEmail());
        map.put("role", user.getRole().name());
        map.put("customerId", user.getCustomerId() == null ? 0 : user.getCustomerId());
        map.put("phone", user.getPhone() == null ? "" : user.getPhone());
        map.put("address", user.getAddress() == null ? "" : user.getAddress());
        return map;
    }

    public record LoginRequest(
            @NotBlank(message = "Email khong duoc de trong")
            @Email(message = "Email khong hop le")
            String email,
            @NotBlank(message = "Mat khau khong duoc de trong")
            String password
    ) {
    }

    public record RegisterRequest(
            @NotBlank(message = "Ten khong duoc de trong")
            String name,
            @NotBlank(message = "Email khong duoc de trong")
            @Email(message = "Email khong hop le")
            String email,
            @NotBlank(message = "Mat khau khong duoc de trong")
            @Size(min = 6, message = "Mat khau phai co it nhat 6 ky tu")
            String password,
            String phone,
            String address
    ) {
    }
}
