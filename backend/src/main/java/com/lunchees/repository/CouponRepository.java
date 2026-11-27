package com.lunchees.repository;

import com.lunchees.model.Coupon;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CouponRepository extends JpaRepository<Coupon, Long> {
    Optional<Coupon> findByCode(String code);
    Optional<Coupon> findByMemberIdAndValidDate(String memberId, LocalDate validDate);
    boolean existsByMemberIdAndValidDate(String memberId, LocalDate validDate);
    List<Coupon> findByValidDateOrderByIdDesc(LocalDate date);
    List<Coupon> findByValidDateAndStatusOrderByIdDesc(LocalDate date, Coupon.Status status);
    List<Coupon> findByMemberIdOrderByValidDateDescIdDesc(String memberId);
    long countByValidDate(LocalDate date);
    long countByValidDateAndStatus(LocalDate date, Coupon.Status status);
}
