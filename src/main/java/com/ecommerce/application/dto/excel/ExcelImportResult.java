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
    private Integer totalRows;
    private Integer successfulImports;
    private Integer failedImports;
    private List<String> errors = new ArrayList<>();
    private List<ProductImportRow> failedRows = new ArrayList<>();
}