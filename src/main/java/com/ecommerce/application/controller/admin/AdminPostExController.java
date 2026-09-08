package com.ecommerce.application.controller.admin;

import com.ecommerce.application.dto.postex.PostExShipperAdviceRequest;
import com.ecommerce.application.dto.postex.PostExTrackingResponse;
import com.ecommerce.application.dto.response.ApiResponse;
import com.ecommerce.application.dto.response.OrderResponse;
import com.ecommerce.application.service.PostExService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/postex")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminPostExController {

    private final PostExService postExService;

    @PostMapping("/book/{orderId}")
    public ResponseEntity<ApiResponse<OrderResponse>> bookShipment(@PathVariable Long orderId) {
        OrderResponse orderResponse = postExService.bookShipment(orderId);
        return ResponseEntity.ok(ApiResponse.success("Shipment booked successfully with PostEx", orderResponse));
    }

    @GetMapping("/track/{trackingNumber}")
    public ResponseEntity<ApiResponse<PostExTrackingResponse>> trackShipment(@PathVariable String trackingNumber) {
        PostExTrackingResponse response = postExService.trackShipment(trackingNumber);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/airway-bill/{trackingNumber}")
    public ResponseEntity<byte[]> getAirwayBillPdf(@PathVariable String trackingNumber) {
        byte[] pdfBytes = postExService.downloadAirwayBillPdf(trackingNumber);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("inline", "airway-bill-" + trackingNumber + ".pdf");
        return ResponseEntity.ok().headers(headers).body(pdfBytes);
    }

    @PutMapping("/cancel/{trackingNumber}")
    public ResponseEntity<ApiResponse<Boolean>> cancelShipment(@PathVariable String trackingNumber) {
        boolean result = postExService.cancelShipment(trackingNumber);
        return ResponseEntity.ok(ApiResponse.success("Shipment cancelled successfully", result));
    }

    @PutMapping("/shipper-advice")
    public ResponseEntity<ApiResponse<Boolean>> submitShipperAdvice(@RequestBody PostExShipperAdviceRequest request) {
        boolean result = postExService.submitShipperAdvice(request);
        return ResponseEntity.ok(ApiResponse.success("Shipper advice submitted successfully", result));
    }
}
