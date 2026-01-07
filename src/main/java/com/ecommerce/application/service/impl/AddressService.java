package com.ecommerce.application.service.impl;

import com.ecommerce.application.entity.Address;
import com.ecommerce.application.entity.User;
import com.ecommerce.application.exception.ResourceNotFoundException;
import com.ecommerce.application.repository.AddressRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AddressService {
    private final AddressRepository addressRepository;
    private final UserService userService;

    public Address getAddressById(Long id) {
        return addressRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Address", "id", id));
    }
    public List<Address> getUserAddresses(Long userId) {
        return addressRepository.findByUserId(userId);
    }

    public Address getDefaultAddress(Long userId) {
        return addressRepository.findByUserIdAndIsDefaultTrue(userId).orElse(null);
    }

    // Create address
    @Transactional
    public Address createAddress(Long userId, Address address) {
        User user = userService.getUserById(userId);
        address.setUser(user);

        // If this is the first address or marked as default, set as default
        List<Address> existingAddresses = getUserAddresses(userId);
        if (existingAddresses.isEmpty() || address.getIsDefault()) {
            // Remove default from other addresses
            if (address.getIsDefault()) {
                existingAddresses.forEach(addr -> {
                    if (addr.getIsDefault()) {
                        addr.setIsDefault(false);
                        addressRepository.save(addr);
                    }
                });
            } else {
                address.setIsDefault(true);
            }
        }

        return addressRepository.save(address);
    }

    // Update address
    @Transactional
    public Address updateAddress(Long id, Long userId, Address addressDetails) {
        Address address = getAddressById(id);

        // Verify user owns this address
        if (!address.getUser().getId().equals(userId)) {
            throw new RuntimeException("You are not authorized to update this address");
        }

        address.setLabel(addressDetails.getLabel());
        address.setStreet(addressDetails.getStreet());
        address.setCity(addressDetails.getCity());
        address.setCountry(addressDetails.getCountry());
        address.setZipCode(addressDetails.getZipCode());

        // If setting as default, remove default from others
        if (addressDetails.getIsDefault() && !address.getIsDefault()) {
            List<Address> userAddresses = getUserAddresses(userId);
            userAddresses.forEach(addr -> {
                if (addr.getIsDefault()) {
                    addr.setIsDefault(false);
                    addressRepository.save(addr);
                }
            });
            address.setIsDefault(true);
        }

        return addressRepository.save(address);
    }

    // Set default address
    @Transactional
    public Address setDefaultAddress(Long addressId, Long userId) {
        Address address = getAddressById(addressId);

        // Verify user owns this address
        if (!address.getUser().getId().equals(userId)) {
            throw new RuntimeException("You are not authorized to modify this address");
        }

        // Remove default from other addresses
        List<Address> userAddresses = getUserAddresses(userId);
        userAddresses.forEach(addr -> {
            if (addr.getIsDefault()) {
                addr.setIsDefault(false);
                addressRepository.save(addr);
            }
        });

        address.setIsDefault(true);
        return addressRepository.save(address);
    }

    // Delete address
    @Transactional
    public void deleteAddress(Long id, Long userId) {
        Address address = getAddressById(id);

        // Verify user owns this address
        if (!address.getUser().getId().equals(userId)) {
            throw new RuntimeException("You are not authorized to delete this address");
        }

        // If deleting default address, set another as default
        if (address.getIsDefault()) {
            List<Address> userAddresses = getUserAddresses(userId);
            userAddresses.stream()
                    .filter(addr -> !addr.getId().equals(id))
                    .findFirst()
                    .ifPresent(addr -> {
                        addr.setIsDefault(true);
                        addressRepository.save(addr);
                    });
        }

        addressRepository.deleteById(id);
    }
}
