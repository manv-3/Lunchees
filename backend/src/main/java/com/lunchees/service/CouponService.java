package com.lunchees.service;

import com.lunchees.model.AppUser;
import com.lunchees.model.Coupon;
import com.lunchees.repository.CouponRepository;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CouponService {

    // Omit 0/O/1/I so codes stay easy to read manually at the counter
    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final Pattern CODE_PATTERN = Pattern.compile("(LNC-[A-Z0-9]{6})");
    private final SecureRandom random = new SecureRandom();
    private final CouponRepository couponRepository;

    public CouponService(CouponRepository couponRepository) {
        this.couponRepository = couponRepository;
    }

    public String generateUniqueCode() {
        String code;
        do {
            StringBuilder sb = new StringBuilder("LNC-");
            for (int i = 0; i < 6; i++) {
                sb.append(ALPHABET.charAt(random.nextInt(ALPHABET.length())));
            }
            code = sb.toString();
        } while (couponRepository.findByCode(code).isPresent());
        return code;
    }

    /** Creates a coupon if the member does not already have one on validDate. */
    public Optional<Coupon> createIfAbsent(String memberId, String memberName, LocalDate validDate) {
        if (memberId == null || memberId.isBlank() || validDate == null) {
            return Optional.empty();
        }
        String cleanId = memberId.trim().toUpperCase();
        if (couponRepository.existsByMemberIdAndValidDate(cleanId, validDate)) {
            return Optional.empty();
        }
        Coupon coupon = new Coupon();
        String code = generateUniqueCode();
        coupon.setCode(code);
        coupon.setMemberId(cleanId);
        coupon.setMemberName(memberName == null ? "" : memberName.trim());
        coupon.setValidDate(validDate);
        coupon.setStatus(Coupon.Status.ACTIVE);
        coupon.setIssuedAt(LocalDateTime.now());
        coupon.setQrPayload(buildQrPayload(code, cleanId, validDate));
        return Optional.of(couponRepository.save(coupon));
    }

    /** Returns today's coupon for a student, generating one if missing. */
    public ClaimResult claimOrGetForStudent(AppUser student, LocalDate date) {
        Optional<Coupon> existing = couponRepository.findByMemberIdAndValidDate(
                student.getMemberId().trim().toUpperCase(), date);
        if (existing.isPresent()) {
            return new ClaimResult(existing.get(), false);
        }
        Coupon created = createIfAbsent(student.getMemberId(), student.getFullName(), date)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "Coupon already exists"));
        return new ClaimResult(created, true);
    }

    /** Extracts LNC-XXXXXX from raw QR payloads or plain codes and redeems it. */
    public Coupon redeem(String rawInput, String staffUsername) {
        String code = extractCode(rawInput);
        Coupon coupon = couponRepository.findByCode(code)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No coupon found for code: " + code));

        if (coupon.getStatus() == Coupon.Status.REDEEMED) {
            String time = coupon.getRedeemedAt() != null
                    ? coupon.getRedeemedAt().toLocalTime().withNano(0).toString()
                    : "earlier";
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Already used at " + time);
        }
        if (!coupon.getValidDate().equals(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Not valid today. This coupon is for " + coupon.getValidDate());
        }

        coupon.setStatus(Coupon.Status.REDEEMED);
        coupon.setRedeemedAt(LocalDateTime.now());
        coupon.setRedeemedBy(staffUsername);
        return couponRepository.save(coupon);
    }

    public static String buildQrPayload(String code, String memberId, LocalDate validDate) {
        return "LUNCHEES|" + code + "|" + memberId + "|" + validDate;
    }

    public static String extractCode(String rawInput) {
        if (rawInput == null || rawInput.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter or scan a coupon code");
        }
        String upper = rawInput.trim().toUpperCase();
        Matcher matcher = CODE_PATTERN.matcher(upper);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return upper;
    }

    public record ClaimResult(Coupon coupon, boolean created) {}
}
