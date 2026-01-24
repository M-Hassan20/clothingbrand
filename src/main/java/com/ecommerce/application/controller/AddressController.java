package com.ecommerce.application.controller;

import com.ecommerce.application.dto.request.AddressRequest;
import com.ecommerce.application.dto.response.AddressResponse;
import com.ecommerce.application.dto.response.ApiResponse;
import com.ecommerce.application.service.impl.AddressService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/addresses")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AddressController {

    private final AddressService addressService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AddressResponse>>> getUserAddresses(@RequestParam Long userId) {
        List<AddressResponse> addresses = addressService.getUserAddresses(userId);
        return ResponseEntity.ok(ApiResponse.success("User addresses retrieved successfully!", addresses));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AddressResponse>> getAddressById(@PathVariable Long id) {
        AddressResponse address = addressService.getAddressById(id);
        return ResponseEntity.ok(ApiResponse.success(address));
    }

    @GetMapping("/default")
    public ResponseEntity<ApiResponse<AddressResponse>> getDefaultAddress(@RequestParam Long userId) {
        AddressResponse address = addressService.getDefaultAddress(userId);
        if (address == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(ApiResponse.success("Default Address for user ID: " + userId , address));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AddressResponse>> createAddress(
            @RequestParam Long userId,
            @Valid @RequestBody AddressRequest request) {

        AddressResponse address = addressService.createAddress(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Address created successfully!", address));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AddressResponse>> updateAddress(
            @PathVariable Long id,
            @RequestParam Long userId,
            @Valid @RequestBody AddressRequest request) {

        AddressResponse address = addressService.updateAddress(id, userId, request);
        return ResponseEntity.ok(ApiResponse.success("Address updated successfully!", address));
    }

    @PatchMapping("/{id}/set-default")
    public ResponseEntity<ApiResponse<AddressResponse>> setDefaultAddress(
            @PathVariable Long id,
            @RequestParam Long userId) {

        AddressResponse address = addressService.setDefaultAddress(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Default address set successfully!", address));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAddress(
            @PathVariable Long id,
            @RequestParam Long userId) {

        addressService.deleteAddress(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Address deleted successfulyy", null));
    }
}