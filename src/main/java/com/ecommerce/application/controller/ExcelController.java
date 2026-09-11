package com.ecommerce.application.controller;

import com.ecommerce.application.dto.excel.ExcelImportResult;
import com.ecommerce.application.dto.response.ApiResponse;
import com.ecommerce.application.service.impl.ExcelService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/admin/excel")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ExcelController {

    private final ExcelService excelService;

    /**
     * Import products from Excel
     */
    @PostMapping("/import/products")
    public ResponseEntity<ApiResponse<ExcelImportResult>> importProducts(
            @RequestParam("file") MultipartFile file) throws IOException {

        ExcelImportResult result = excelService.importProducts(file);
        return ResponseEntity.ok(ApiResponse.success("Import completed", result));
    }

    /**
     * Export all products to Excel
     */
    @GetMapping("/export/products")
    public void exportProducts(HttpServletResponse response) throws IOException {
        excelService.exportProducts(response);
    }

    /**
     * Export orders to Excel
     */
    @GetMapping("/export/orders")
    public void exportOrders(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            HttpServletResponse response) throws IOException {

        excelService.exportOrders(startDate, endDate, response);
    }

    /**
     * Export revenue report
     */
    @GetMapping("/export/revenue")
    public void exportRevenueReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            HttpServletResponse response) throws IOException {

        excelService.exportRevenueReport(startDate, endDate, response);
    }

    /**
     * Export inventory report
     */
    @GetMapping("/export/inventory")
    public void exportInventoryReport(HttpServletResponse response) throws IOException {
        excelService.exportInventoryReport(response);
    }

    /**
     * Download product import template
     */
    @GetMapping("/template/products")
    public void downloadProductTemplate(HttpServletResponse response) throws IOException {
        // Create template with headers only
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment; filename=product_import_template.xlsx");

        // You can implement a method to create empty template
        // For now, users can export products and use that as template
        excelService.exportProducts(response);
    }
}