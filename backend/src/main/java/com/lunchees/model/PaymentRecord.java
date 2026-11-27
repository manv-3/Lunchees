package com.lunchees.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "payment_records")
@Getter
@Setter
@NoArgsConstructor
public class PaymentRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String transactionId;

    @Column(nullable = false)
    private String username;

    @Column(nullable = false)
    private String memberId;

    private String memberName;
    private String planCode;
    private String planName;
    private int daysAdded;
    private int amountInr;
    private String paymentMethod;
    private String paymentReference;
    private LocalDate newValidUntil;
    private LocalDateTime paidAt;
    private String status;
}
