package com.lunchees.controller;

import com.lunchees.model.AppUser;
import com.lunchees.model.Coupon;
import com.lunchees.model.Role;
import com.lunchees.repository.AppUserRepository;
import com.lunchees.repository.CouponRepository;
import com.lunchees.service.CouponService;
import java.time.LocalDate;
import java.util.*;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/coupons")
public class CouponController {

    public record MemberReq(String memberId, String memberName) {}
    public record GenerateReq(LocalDate validDate, List<MemberReq> members) {}
    public record GenerateActiveReq(LocalDate validDate) {}
    public record RedeemReq(String code, String qrData) {}

    private final CouponRepository couponRepository;
    private final AppUserRepository userRepository;
    private final CouponService couponService;

    public CouponController(CouponRepository couponRepository,
                            AppUserRepository userRepository,
                            CouponService couponService) {
        this.couponRepository = couponRepository;
        this.userRepository = userRepository;
        this.couponService = couponService;
    }

    @PostMapping("/generate")
    public List<Coupon> generate(@RequestBody GenerateReq req) {
        if (req.validDate() == null || req.members() == null || req.members().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Add a date and at least one member");
        }
        List<Coupon> created = new ArrayList<>();
        for (MemberReq member : req.members()) {
            couponService.createIfAbsent(member.memberId(), member.memberName(), req.validDate())
                    .ifPresent(created::add);
        }
        return created;
    }

    /** Generates coupons for all students whose subscription is valid on validDate. */
    @PostMapping("/generate-active")
    public Map<String, Object> generateForActiveStudents(@RequestBody(required = false) GenerateActiveReq req) {
        LocalDate date = (req != null && req.validDate() != null) ? req.validDate() : LocalDate.now();
        List<AppUser> students = userRepository.findByRoleOrderByMemberIdAsc(Role.STUDENT);
        List<Coupon> created = new ArrayList<>();
        int eligibleCount = 0;

        for (AppUser student : students) {
            if (student.getSubscriptionEndDate() != null && !student.getSubscriptionEndDate().isBefore(date)) {
                eligibleCount++;
                couponService.createIfAbsent(student.getMemberId(), student.getFullName(), date)
                        .ifPresent(created::add);
            }
        }
        return Map.of(
                "created", created,
                "eligibleStudents", eligibleCount,
                "skipped", eligibleCount - created.size()
        );
    }

    @GetMapping
    public List<Coupon> list(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) Coupon.Status status,
            @RequestParam(required = false) String search) {
        LocalDate targetDate = date != null ? date : LocalDate.now();
        List<Coupon> list = (status == null)
                ? couponRepository.findByValidDateOrderByIdDesc(targetDate)
                : couponRepository.findByValidDateAndStatusOrderByIdDesc(targetDate, status);

        if (search == null || search.isBlank()) {
            return list;
        }
        String q = search.trim().toLowerCase();
        return list.stream()
                .filter(c -> c.getCode().toLowerCase().contains(q)
                        || c.getMemberId().toLowerCase().contains(q)
                        || (c.getMemberName() != null && c.getMemberName().toLowerCase().contains(q)))
                .toList();
    }

    @GetMapping("/stats")
    public Map<String, Long> stats(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate targetDate = date != null ? date : LocalDate.now();
        long redeemed = couponRepository.countByValidDateAndStatus(targetDate, Coupon.Status.REDEEMED);
        long total = couponRepository.countByValidDate(targetDate);
        return Map.of("total", total, "redeemed", redeemed, "active", total - redeemed);
    }

    @PostMapping("/redeem")
    public Coupon redeemPayload(@RequestBody RedeemReq req, Authentication auth) {
        String raw = (req.qrData() != null && !req.qrData().isBlank()) ? req.qrData() : req.code();
        String staffUsername = auth != null ? auth.getName() : "counter";
        if (auth != null && auth.getPrincipal() instanceof AppUser user) {
            staffUsername = user.getUsername();
        }
        return couponService.redeem(raw, staffUsername);
    }

    @PostMapping("/redeem/{code}")
    public Coupon redeemByPath(@PathVariable String code, Authentication auth) {
        String staffUsername = "counter";
        if (auth != null && auth.getPrincipal() instanceof AppUser user) {
            staffUsername = user.getUsername();
        }
        return couponService.redeem(code, staffUsername);
    }

    @DeleteMapping("/{id}")
    public Map<String, String> deleteUnused(@PathVariable Long id) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Coupon not found"));
        if (coupon.getStatus() == Coupon.Status.REDEEMED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot delete an already redeemed coupon");
        }
        couponRepository.delete(coupon);
        return Map.of("message", "Coupon cancelled");
    }
}
