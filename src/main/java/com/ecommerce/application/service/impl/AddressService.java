package com.ecommerce.application.service.impl;

import com.ecommerce.application.dto.request.AddressRequest;
import com.ecommerce.application.dto.response.AddressResponse;
import com.ecommerce.application.entity.Address;
import com.ecommerce.application.entity.User;
import com.ecommerce.application.exception.ResourceNotFoundException;
import com.ecommerce.application.mapper.AddressMapper;
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
    private final AddressMapper addressMapper;

    public AddressResponse getAddressById(Long id) {
        return addressMapper.toResponse(addressRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Address", "id", id)));
    }
    public Address getAddressEntityById(Long id) {
        return addressRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Address", "ID", id));
    }
    public List<AddressResponse> getUserAddresses(Long userId) {
        return addressMapper.toResponseList(addressRepository.findByUserId(userId));
    }
    private List<Address> getUserAddressesEntity(Long userId) {
        return addressRepository.findByUserId(userId);
    }

    public AddressResponse getDefaultAddress(Long userId) {
        return addressMapper.toResponse(addressRepository.findByUserIdAndIsDefaultTrue(userId).orElse(null));
    }

    private Address getDefaultAddressEntity(Long userId) {
        return addressRepository.findByUserIdAndIsDefaultTrue(userId).orElse(null);
    }

    // Create address
    @Transactional
    public AddressResponse createAddress(Long userId, AddressRequest request) {
        User user = userService.getUserEntityById(userId);
        Address address = addressMapper.toEntity(request);
        address.setUser(user);

        // If this is the first address or marked as default, set as default
        List<Address> existingAddresses = getUserAddressesEntity(userId);
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

        return addressMapper.toResponse(addressRepository.save(address));
    }

    // Update address
    @Transactional
    public AddressResponse updateAddress(Long id, Long userId, AddressRequest addressDetails) {
        Address address = getAddressEntityById(id);

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
            List<Address> userAddresses = getUserAddressesEntity(userId);
            userAddresses.forEach(addr -> {
                if (addr.getIsDefault()) {
                    addr.setIsDefault(false);
                    addressRepository.save(addr);
                }
            });
            address.setIsDefault(true);
        }

        return addressMapper.toResponse(addressRepository.save(address));
    }

    // Set default address
    @Transactional
    public AddressResponse setDefaultAddress(Long addressId, Long userId) {
        Address address = getAddressEntityById(addressId);

        // Verify user owns this address
        if (!address.getUser().getId().equals(userId)) {
            throw new RuntimeException("You are not authorized to modify this address");
        }

        // Remove default from other addresses
        List<Address> userAddresses = getUserAddressesEntity(userId);
        userAddresses.forEach(addr -> {
            if (addr.getIsDefault()) {
                addr.setIsDefault(false);
                addressRepository.save(addr);
            }
        });

        address.setIsDefault(true);
        return addressMapper.toResponse(addressRepository.save(address));
    }

    // Delete address
    @Transactional
    public void deleteAddress(Long id, Long userId) {
        Address address = getAddressEntityById(id);

        // Verify user owns this address
        if (!address.getUser().getId().equals(userId)) {
            throw new RuntimeException("You are not authorized to delete this address");
        }

        // If deleting default address, set another as default
        if (address.getIsDefault()) {
            List<Address> userAddresses = getUserAddressesEntity(userId);
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
