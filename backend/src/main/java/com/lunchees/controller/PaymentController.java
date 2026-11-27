package com.lunchees.controller;

import com.lunchees.model.AppUser;
import com.lunchees.model.PaymentRecord;
import com.lunchees.repository.AppUserRepository;
import com.lunchees.repository.PaymentRepository;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    public record PlanInfo(String code, String name, int days, int priceInr, String description) {}
    public record RenewReq(String planCode, String paymentMethod, String paymentReference) {}

    private static final List<PlanInfo> PLANS = List.of(
            new PlanInfo("WEEKLY", "Weekly Plan (7 Days)", 7, 500, "7 days lunch coupon validity"),
            new PlanInfo("MONTHLY", "Monthly Plan (30 Days)", 30, 1800, "Most popular - 30 days lunch access"),
            new PlanInfo("SEMESTER", "Semester Plan (120 Days)", 120, 6500, "Full semester mess pass at discount")
    );

    private final AppUserRepository userRepository;
    private final PaymentRepository paymentRepository;
    private final SecureRandom random = new SecureRandom();

    public PaymentController(AppUserRepository userRepository, PaymentRepository paymentRepository) {
        this.userRepository = userRepository;
        this.paymentRepository = paymentRepository;
    }

    @GetMapping("/plans")
    public List<PlanInfo> getPlans() {
        return PLANS;
    }

    @Transactional
    @PostMapping("/renew")
    public Map<String, Object> renew(@RequestBody RenewReq req, Authentication auth) {
        if (auth == null || !(auth.getPrincipal() instanceof AppUser principal)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not logged in");
        }
        AppUser user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        if (req.planCode() == null || req.planCode().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please select a subscription plan");
        }
        PlanInfo plan = PLANS.stream()
                .filter(p -> p.code().equalsIgnoreCase(req.planCode().trim()))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid subscription plan"));

        if (req.paymentReference() == null || req.paymentReference().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter UPI ID / Card digits / Bank reference");
        }

        LocalDate today = LocalDate.now();
        LocalDate baseDate = (user.getSubscriptionEndDate() != null && !user.getSubscriptionEndDate().isBefore(today))
                ? user.getSubscriptionEndDate()
                : today;
        LocalDate newEndDate = baseDate.plusDays(plan.days());

        user.setSubscriptionPlan(plan.name());
        user.setSubscriptionEndDate(newEndDate);
        AppUser savedUser = userRepository.save(user);

        PaymentRecord record = new PaymentRecord();
        record.setTransactionId("TXN-" + (100000 + random.nextInt(900000)));
        record.setUsername(savedUser.getUsername());
        record.setMemberId(savedUser.getMemberId());
        record.setMemberName(savedUser.getFullName());
        record.setPlanCode(plan.code());
        record.setPlanName(plan.name());
        record.setDaysAdded(plan.days());
        record.setAmountInr(plan.priceInr());
        record.setPaymentMethod(req.paymentMethod() == null || req.paymentMethod().isBlank()
                ? "UPI" : req.paymentMethod().trim());
        record.setPaymentReference(req.paymentReference().trim());
        record.setNewValidUntil(newEndDate);
        record.setPaidAt(LocalDateTime.now());
        record.setStatus("SUCCESS");

        PaymentRecord savedPayment = paymentRepository.save(record);
        return Map.of("payment", savedPayment, "user", savedUser);
    }

    @GetMapping("/my")
    public List<PaymentRecord> myPayments(Authentication auth) {
        if (auth == null || !(auth.getPrincipal() instanceof AppUser principal)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not logged in");
        }
        return paymentRepository.findByUsernameOrderByPaidAtDesc(principal.getUsername());
    }

    @GetMapping
    public Map<String, Object> allPayments() {
        List<PaymentRecord> payments = paymentRepository.findAllByOrderByPaidAtDesc();
        int totalRevenue = payments.stream().mapToInt(PaymentRecord::getAmountInr).sum();
        return Map.of(
                "totalRevenue", totalRevenue,
                "totalTransactions", payments.size(),
                "payments", payments
        );
    }
}
