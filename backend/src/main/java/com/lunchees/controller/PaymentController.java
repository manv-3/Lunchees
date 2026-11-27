package com.lunchees.controller;

import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {
    public record PlanInfo(String code, String name, int days, int priceInr, String description) {}

    @GetMapping("/plans")
    public List<PlanInfo> getPlans() {
        return List.of(
            new PlanInfo("WEEKLY", "Weekly Plan (7 Days)", 7, 500, "7 days lunch coupon validity"),
            new PlanInfo("MONTHLY", "Monthly Plan (30 Days)", 30, 1800, "30 days lunch access")
        );
    }
}