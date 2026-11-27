package com.lunchees.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"memberId", "validDate"}))
public class Coupon {

    public enum Status {
        ACTIVE,
        REDEEMED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String code;

    @Column(nullable = false)
    private String memberId;

    private String memberName;
    private LocalDate validDate;

    @Enumerated(EnumType.STRING)
    private Status status = Status.ACTIVE;

    private LocalDateTime issuedAt;
    private LocalDateTime redeemedAt;
    private String redeemedBy;
    private String qrPayload;
}
