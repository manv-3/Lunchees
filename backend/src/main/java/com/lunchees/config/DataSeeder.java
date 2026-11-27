package com.lunchees.config;

import com.lunchees.model.AppUser;
import com.lunchees.model.Role;
import com.lunchees.repository.AppUserRepository;
import java.time.LocalDate;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {
    private final AppUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(AppUserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        LocalDate today = LocalDate.now();
        seed("admin", "admin123", "Mess Administrator", Role.ADMIN, "ADMIN01", "ABESEC Mess Office", "Staff Access", null);
        seed("staff", "staff123", "Ramesh Kumar", Role.MESS_STAFF, "STAFF01", "Mess Counter", "Staff Access", null);
        seed("student", "student123", "Aarav Sharma", Role.STUDENT, "22CSE042", "CSE - CSE 22", "Monthly Plan (30 Days)", today.plusDays(30));
    }

    private void seed(String u, String p, String name, Role r, String id, String b, String plan, LocalDate end) {
        if (userRepository.findByUsernameIgnoreCase(u).isEmpty()) {
            AppUser user = new AppUser();
            user.setUsername(u);
            user.setPasswordHash(passwordEncoder.encode(p));
            user.setFullName(name);
            user.setRole(r);
            user.setMemberId(id);
            user.setBranchSection(b);
            user.setSubscriptionPlan(plan);
            user.setSubscriptionEndDate(end);
            userRepository.save(user);
        }
    }
}