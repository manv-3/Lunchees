package com.lunchees.controller;

import com.lunchees.model.AppUser;
import com.lunchees.model.Role;
import com.lunchees.repository.AppUserRepository;
import com.lunchees.security.TokenService;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    public record LoginReq(String username, String password) {}
    public record RegisterReq(String username, String password, String fullName,
                              String memberId, String branchSection) {}

    private final AppUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;

    public AuthController(AppUserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          TokenService tokenService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
    }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody LoginReq req) {
        if (req.username() == null || req.username().isBlank() || req.password() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username and password are required");
        }
        AppUser user = userRepository.findByUsernameIgnoreCase(req.username().trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password"));

        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password");
        }
        return Map.of("token", tokenService.generateToken(user), "user", user);
    }

    @PostMapping("/register")
    public Map<String, Object> register(@RequestBody RegisterReq req) {
        if (req.username() == null || req.username().isBlank()
                || req.password() == null || req.password().length() < 4
                || req.fullName() == null || req.fullName().isBlank()
                || req.memberId() == null || req.memberId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Please fill username, password (min 4 chars), full name, and roll number");
        }
        String cleanUsername = req.username().trim();
        String cleanMemberId = req.memberId().trim().toUpperCase();

        if (userRepository.existsByUsernameIgnoreCase(cleanUsername)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already exists");
        }
        if (userRepository.existsByMemberIdIgnoreCase(cleanMemberId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Roll number / Member ID already registered");
        }

        AppUser user = new AppUser();
        user.setUsername(cleanUsername);
        user.setPasswordHash(passwordEncoder.encode(req.password()));
        user.setFullName(req.fullName().trim());
        user.setRole(Role.STUDENT);
        user.setMemberId(cleanMemberId);
        user.setBranchSection(req.branchSection() == null || req.branchSection().isBlank()
                ? "CSE - CSE 22" : req.branchSection().trim());
        user.setSubscriptionPlan("No Active Plan");
        user.setSubscriptionEndDate(null);

        AppUser saved = userRepository.save(user);
        return Map.of("token", tokenService.generateToken(saved), "user", saved);
    }

    @GetMapping("/me")
    public AppUser me(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof AppUser user)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not logged in");
        }
        return userRepository.findById(user.getId()).orElse(user);
    }
}
