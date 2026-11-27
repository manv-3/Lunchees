package com.lunchees.config;

import com.lunchees.model.AppUser;
import com.lunchees.model.Coupon;
import com.lunchees.model.PaymentRecord;
import com.lunchees.model.Role;
import com.lunchees.repository.AppUserRepository;
import com.lunchees.repository.CouponRepository;
import com.lunchees.repository.PaymentRepository;
import com.lunchees.service.CouponService;
import java.time.LocalDate;
import java.time.LocalDateTime;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    private final AppUserRepository userRepository;
    private final CouponRepository couponRepository;
    private final PaymentRepository paymentRepository;
    private final PasswordEncoder passwordEncoder;
    private final CouponService couponService;

    public DataSeeder(AppUserRepository userRepository,
                      CouponRepository couponRepository,
                      PaymentRepository paymentRepository,
                      PasswordEncoder passwordEncoder,
                      CouponService couponService) {
        this.userRepository = userRepository;
        this.couponRepository = couponRepository;
        this.paymentRepository = paymentRepository;
        this.passwordEncoder = passwordEncoder;
        this.couponService = couponService;
    }

    @Override
    public void run(String... args) {
        LocalDate today = LocalDate.now();

        seedUser("admin", "admin123", "Mess Administrator", Role.ADMIN,
                "ADMIN01", "ABESEC Mess Office", "Staff Access", null);

        seedUser("staff", "staff123", "Ramesh Kumar", Role.MESS_STAFF,
                "STAFF01", "Mess Counter", "Staff Access", null);

        AppUser student1 = seedUser("student", "student123", "Aarav Sharma", Role.STUDENT,
                "22CSE042", "CSE - CSE 22", "Monthly Plan (30 Days)", today.plusDays(30));

        seedUser("student2", "student123", "Priya Verma", Role.STUDENT,
                "22CSE043", "CSE - CSE 22", "Weekly Plan (7 Days)", today.minusDays(2));

        seedUser("rohan22", "student123", "Rohan Gupta", Role.STUDENT,
                "22CSE044", "CSE - CSE 22", "Monthly Plan (30 Days)", today.plusDays(15));

        seedUser("sneha22", "student123", "Sneha Patel", Role.STUDENT,
                "22CSE045", "CSE - CSE 22", "Semester Plan (120 Days)", today.plusDays(90));

        if (couponRepository.count() == 0) {
            couponService.createIfAbsent("22CSE044", "Rohan Gupta", today);

            couponService.createIfAbsent("22CSE045", "Sneha Patel", today).ifPresent(c -> {
                c.setStatus(Coupon.Status.REDEEMED);
                c.setRedeemedAt(LocalDateTime.now().minusMinutes(25));
                c.setRedeemedBy("staff");
                couponRepository.save(c);
            });

            couponService.createIfAbsent(student1.getMemberId(), student1.getFullName(), today.minusDays(1))
                    .ifPresent(c -> {
                        c.setStatus(Coupon.Status.REDEEMED);
                        c.setRedeemedAt(LocalDateTime.now().minusDays(1));
                        c.setRedeemedBy("staff");
                        couponRepository.save(c);
                    });
        }

        if (paymentRepository.count() == 0) {
            PaymentRecord record = new PaymentRecord();
            record.setTransactionId("TXN-SEED-1001");
            record.setUsername(student1.getUsername());
            record.setMemberId(student1.getMemberId());
            record.setMemberName(student1.getFullName());
            record.setPlanCode("MONTHLY");
            record.setPlanName("Monthly Plan (30 Days)");
            record.setDaysAdded(30);
            record.setAmountInr(1800);
            record.setPaymentMethod("UPI");
            record.setPaymentReference("aarav@okicici");
            record.setNewValidUntil(student1.getSubscriptionEndDate());
            record.setPaidAt(LocalDateTime.now().minusDays(1));
            record.setStatus("SUCCESS");
            paymentRepository.save(record);
        }
    }

    private AppUser seedUser(String username, String rawPassword, String fullName, Role role,
                             String memberId, String branchSection, String plan, LocalDate endDate) {
        return userRepository.findByUsernameIgnoreCase(username).orElseGet(() -> {
            AppUser u = new AppUser();
            u.setUsername(username);
            u.setPasswordHash(passwordEncoder.encode(rawPassword));
            u.setFullName(fullName);
            u.setRole(role);
            u.setMemberId(memberId);
            u.setBranchSection(branchSection);
            u.setSubscriptionPlan(plan);
            u.setSubscriptionEndDate(endDate);
            return userRepository.save(u);
        });
    }
}
