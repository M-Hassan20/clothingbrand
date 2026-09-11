package com.ecommerce.application.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendNewsletterRequest {

    @NotBlank(message = "Subject is required")
    private String subject;

    @NotBlank(message = "Content HTML is required")
    private String contentHtml;

    private String previewText;
}
