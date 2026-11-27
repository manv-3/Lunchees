package com.lunchees.controller;

import com.lunchees.model.Coupon;
import com.lunchees.service.CouponService;
import java.time.LocalDate;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/coupons")
public class CouponController {
    public record MemberReq(String memberId, String memberName) {}
    public record GenerateReq(LocalDate validDate, List<MemberReq> members) {}
    private final CouponService couponService;

    public CouponController(CouponService couponService) {
        this.couponService = couponService;
    }

    @PostMapping("/generate")
    public List<Coupon> generate(@RequestBody GenerateReq req) {
        if (req.validDate() == null || req.members() == null || req.members().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Add a date and at least one member");
        }
        List<Coupon> created = new ArrayList<>();
        for (MemberReq m : req.members()) {
            couponService.createIfAbsent(m.memberId(), m.memberName(), req.validDate()).ifPresent(created::add);
        }
        return created;
    }
}