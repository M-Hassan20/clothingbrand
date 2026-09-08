package com.ecommerce.application.entity;

import com.ecommerce.application.enums.OrderStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;

@Entity
@Table(name = "orders", indexes = {
    @Index(name = "idx_orders_user_id", columnList = "user_id"),
    @Index(name = "idx_orders_status", columnList = "status")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Order extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    private User user;

    @Enumerated(EnumType.STRING)
    private OrderStatus status;

    private BigDecimal totalAmount;

    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    private String discountCode;

    @ManyToOne
    private Address shippingAddress;

    private String trackingNumber;

    private String courierName;

    private String postexStatus;

    private String pickupAddressCode;

    @Builder.Default
    private BigDecimal shippingFee = BigDecimal.ZERO;

    private String returnStatus;

    private String returnReason;

    private String returnResolution;

    private String returnBankDetails;

    private String requestedSize;

    private String returnRemarks;
}


