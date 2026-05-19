package com.cabxpress.controller;

import com.cabxpress.dto.ApiDtos.UserResponse;
import com.cabxpress.entity.User;
import com.cabxpress.enums.Role;
import com.cabxpress.exception.ApiException;
import com.cabxpress.repository.UserRepository;
import com.cabxpress.service.AuthService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final AuthService authService;

    public UserController(UserRepository users, PasswordEncoder encoder, AuthService authService) {
        this.users = users;
        this.encoder = encoder;
        this.authService = authService;
    }

    @GetMapping public List<UserResponse> all(@RequestParam(required = false) Role role) {
        List<User> rows = role == null ? users.findAll() : users.findByRoleAndEnabledTrue(role);
        return rows.stream().map(authService::toResponse).toList();
    }
    @GetMapping("/{id}") public UserResponse one(@PathVariable Long id) { return authService.toResponse(find(id)); }
    @PostMapping public UserResponse create(@RequestBody User user) {
        if (users.existsByEmail(user.email.toLowerCase())) throw new ApiException(HttpStatus.CONFLICT, "Email already exists");
        user.passwordHash = encoder.encode(user.passwordHash);
        user.email = user.email.toLowerCase();
        return authService.toResponse(users.save(user));
    }
    @PutMapping("/{id}") public UserResponse update(@PathVariable Long id, @RequestBody User input) {
        User user = find(id);
        user.name = input.name;
        user.phone = input.phone;
        user.role = input.role;
        user.enabled = input.enabled;
        user.verified = input.verified;
        return authService.toResponse(users.save(user));
    }
    @DeleteMapping("/{id}") public void delete(@PathVariable Long id) { users.delete(find(id)); }
    private User find(Long id) { return users.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found")); }
}
