package com.ecommerce.application.dto.excel;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExcelImportResult {
    @Builder.Default
    private Integer totalRows = 0;
    @Builder.Default
    private Integer successfulImports = 0;
    @Builder.Default
    private Integer failedImports = 0;
    @Builder.Default
    private List<String> errors = new ArrayList<>();
    @Builder.Default
    private List<ProductImportRow> failedRows = new ArrayList<>();
}