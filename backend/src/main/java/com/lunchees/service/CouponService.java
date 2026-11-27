package com.lunchees.service;

import com.lunchees.model.Coupon;
import com.lunchees.repository.CouponRepository;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class CouponService {
    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private final SecureRandom random = new SecureRandom();
    private final CouponRepository couponRepository;

    public CouponService(CouponRepository couponRepository) {
        this.couponRepository = couponRepository;
    }

    public String generateUniqueCode() {
        String code;
        do {
            StringBuilder sb = new StringBuilder("LNC-");
            for (int i = 0; i < 6; i++) sb.append(ALPHABET.charAt(random.nextInt(ALPHABET.length())));
            code = sb.toString();
        } while (couponRepository.findByCode(code).isPresent());
        return code;
    }

    public Optional<Coupon> createIfAbsent(String memberId, String memberName, LocalDate validDate) {
        if (memberId == null || memberId.isBlank() || validDate == null) return Optional.empty();
        String cleanId = memberId.trim().toUpperCase();
        if (couponRepository.existsByMemberIdAndValidDate(cleanId, validDate)) return Optional.empty();
        Coupon c = new Coupon();
        c.setCode(generateUniqueCode());
        c.setMemberId(cleanId);
        c.setMemberName(memberName == null ? "" : memberName.trim());
        c.setValidDate(validDate);
        c.setIssuedAt(LocalDateTime.now());
        return Optional.of(couponRepository.save(c));
    }
}