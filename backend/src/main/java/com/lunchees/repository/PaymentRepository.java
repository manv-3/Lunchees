package com.lunchees.repository;

import com.lunchees.model.PaymentRecord;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<PaymentRecord, Long> {
    List<PaymentRecord> findByUsernameOrderByPaidAtDesc(String username);
    List<PaymentRecord> findAllByOrderByPaidAtDesc();
}
