package com.ecommerce.application.service;

import com.ecommerce.application.service.impl.RevalidationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RevalidationServiceTest {

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private RevalidationService revalidationService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(revalidationService, "restTemplate", restTemplate);
        ReflectionTestUtils.setField(revalidationService, "revalidateUrl", "http://localhost:9999/revalidate");
        ReflectionTestUtils.setField(revalidationService, "secret", "revalidate-secret");
    }

    @Test
    void revalidate_restTemplateThrowsException_doesNotPropagateException() {
        when(restTemplate.postForEntity(eq("http://localhost:9999/revalidate"), any(), eq(String.class)))
                .thenThrow(new RestClientException("Connection refused"));

        assertThatCode(() -> revalidationService.revalidate("tag-1", "tag-2"))
                .doesNotThrowAnyException();

        verify(restTemplate).postForEntity(eq("http://localhost:9999/revalidate"), any(), eq(String.class));
    }
}
