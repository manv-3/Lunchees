package com.lunchees.controller;

import com.lunchees.model.AppUser;
import com.lunchees.model.Coupon;
import com.lunchees.repository.AppUserRepository;
import com.lunchees.repository.CouponRepository;
import com.lunchees.service.CouponService;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/student")
public class StudentController {

    private final AppUserRepository userRepository;
    private final CouponRepository couponRepository;
    private final CouponService couponService;

    public StudentController(AppUserRepository userRepository,
                             CouponRepository couponRepository,
                             CouponService couponService) {
        this.userRepository = userRepository;
        this.couponRepository = couponRepository;
        this.couponService = couponService;
    }

    private AppUser currentStudent(Authentication auth) {
        if (auth == null || !(auth.getPrincipal() instanceof AppUser principal)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not logged in");
        }
        return userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    @GetMapping("/coupons")
    public List<Coupon> myCoupons(Authentication auth) {
        AppUser student = currentStudent(auth);
        return couponRepository.findByMemberIdOrderByValidDateDescIdDesc(student.getMemberId());
    }

    @GetMapping("/coupon/today")
    public Map<String, Object> todayCoupon(Authentication auth) {
        AppUser student = currentStudent(auth);
        Coupon coupon = couponRepository.findByMemberIdAndValidDate(student.getMemberId(), LocalDate.now())
                .orElse(null);
        Map<String, Object> res = new HashMap<>();
        res.put("coupon", coupon);
        res.put("subscriptionActive", student.isSubscriptionActive());
        res.put("subscriptionEndDate", student.getSubscriptionEndDate());
        return res;
    }

    @PostMapping("/coupon/claim")
    public Map<String, Object> claimTodayCoupon(Authentication auth) {
        AppUser student = currentStudent(auth);
        if (!student.isSubscriptionActive()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Your mess subscription has expired or is inactive. Please renew your subscription first.");
        }
        CouponService.ClaimResult result = couponService.claimOrGetForStudent(student, LocalDate.now());
        return Map.of(
                "coupon", result.coupon(),
                "created", result.created()
        );
    }
}
