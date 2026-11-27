package com.lunchees.controller;

import com.lunchees.model.AppUser;
import com.lunchees.model.Role;
import com.lunchees.repository.AppUserRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    public record CreateUserReq(String username, String password, String fullName,
                                Role role, String memberId, String branchSection, int initialDays) {}
    public record ExtendReq(int days, String planName) {}

    private final AppUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminUserController(AppUserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    public List<AppUser> listUsers() {
        return userRepository.findAllByOrderByRoleAscUsernameAsc();
    }

    @PostMapping
    public AppUser createUser(@RequestBody CreateUserReq req) {
        if (req.username() == null || req.username().isBlank()
                || req.password() == null || req.password().length() < 4
                || req.fullName() == null || req.fullName().isBlank()
                || req.memberId() == null || req.memberId().isBlank()
                || req.role() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Fill all required user fields");
        }
        String cleanUsername = req.username().trim();
        String cleanMemberId = req.memberId().trim().toUpperCase();
        if (userRepository.existsByUsernameIgnoreCase(cleanUsername)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already exists");
        }
        if (userRepository.existsByMemberIdIgnoreCase(cleanMemberId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Member ID already exists");
        }

        AppUser user = new AppUser();
        user.setUsername(cleanUsername);
        user.setPasswordHash(passwordEncoder.encode(req.password()));
        user.setFullName(req.fullName().trim());
        user.setRole(req.role());
        user.setMemberId(cleanMemberId);
        user.setBranchSection(req.branchSection() == null || req.branchSection().isBlank()
                ? "CSE - CSE 22" : req.branchSection().trim());

        if (req.role() == Role.STUDENT && req.initialDays() > 0) {
            user.setSubscriptionEndDate(LocalDate.now().plusDays(req.initialDays()));
            user.setSubscriptionPlan("Admin Granted (" + req.initialDays() + " Days)");
        } else if (req.role() == Role.STUDENT) {
            user.setSubscriptionPlan("No Active Plan");
        } else {
            user.setSubscriptionPlan("Staff Access");
        }
        return userRepository.save(user);
    }

    @PostMapping("/{id}/extend")
    public AppUser extendSubscription(@PathVariable Long id, @RequestBody(required = false) ExtendReq req) {
        AppUser user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        int days = (req != null && req.days() > 0) ? req.days() : 30;
        LocalDate today = LocalDate.now();
        LocalDate base = (user.getSubscriptionEndDate() != null && !user.getSubscriptionEndDate().isBefore(today))
                ? user.getSubscriptionEndDate() : today;
        user.setSubscriptionEndDate(base.plusDays(days));
        user.setSubscriptionPlan(req != null && req.planName() != null && !req.planName().isBlank()
                ? req.planName() : "Admin Extended (" + days + " Days)");
        return userRepository.save(user);
    }

    @GetMapping("/summary")
    public Map<String, Long> summary() {
        List<AppUser> students = userRepository.findByRoleOrderByMemberIdAsc(Role.STUDENT);
        long active = students.stream().filter(AppUser::isSubscriptionActive).count();
        return Map.of(
                "totalStudents", (long) students.size(),
                "activeSubscriptions", active,
                "expiredSubscriptions", students.size() - active
        );
    }
}
