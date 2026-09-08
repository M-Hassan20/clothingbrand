package com.ecommerce.application.integration;

import com.ecommerce.application.AbstractIntegrationTest;
import com.ecommerce.application.dto.excel.ExcelImportResult;
import com.ecommerce.application.repository.ProductRepository;
import com.ecommerce.application.repository.ProductVariantRepository;
import com.ecommerce.application.service.impl.ExcelService;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mock.web.MockMultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;

class ExcelImportIT extends AbstractIntegrationTest {

    @Autowired
    private ExcelService excelService;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductVariantRepository productVariantRepository;

    @BeforeEach
    void setUp() {
        productVariantRepository.deleteAll();
        productRepository.deleteAll();
    }

    private void createRow(Sheet sheet, int rowNum, String name, String desc, String brand, String category,
                           String size, String color, Double price, Integer stock, String sku, Boolean active) {
        Row row = sheet.createRow(rowNum);
        row.createCell(0).setCellValue(name);
        row.createCell(1).setCellValue(desc);
        row.createCell(2).setCellValue(brand);
        row.createCell(3).setCellValue(category);
        row.createCell(4).setCellValue(size);
        row.createCell(5).setCellValue(color);
        if (price != null) {
            row.createCell(6).setCellValue(price);
        }
        if (stock != null) {
            row.createCell(7).setCellValue(stock);
        }
        row.createCell(8).setCellValue(sku);
        if (active != null) {
            row.createCell(9).setCellValue(active);
        }
    }

    @Test
    void importExcel_processesValidAndReportsInvalidRows() throws IOException {
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Products");

        // Header Row
        Row header = sheet.createRow(0);
        header.createCell(0).setCellValue("Product Name");
        header.createCell(1).setCellValue("Description");
        header.createCell(2).setCellValue("Brand");
        header.createCell(3).setCellValue("Category");
        header.createCell(4).setCellValue("Size");
        header.createCell(5).setCellValue("Color");
        header.createCell(6).setCellValue("Price");
        header.createCell(7).setCellValue("Stock");
        header.createCell(8).setCellValue("SKU");
        header.createCell(9).setCellValue("Is Active");

        // Add 3 valid rows
        createRow(sheet, 1, "Shirt A", "Desc A", "Brand A", "Coats", "M", "Beige", 100.0, 10, "SKU-A", true);
        createRow(sheet, 2, "Shirt B", "Desc B", "Brand B", "Coats", "L", "White", 120.0, 15, "SKU-B", true);
        createRow(sheet, 3, "Shirt C", "Desc C", "Brand C", "Coats", "S", "Black", 80.0, 20, "SKU-C", true);

        // Add 2 invalid rows
        createRow(sheet, 4, "", "Desc D", "Brand D", "Coats", "M", "Red", 50.0, 5, "SKU-D", true); // empty name
        createRow(sheet, 5, "Shirt E", "Desc E", "Brand E", "Coats", "L", "Blue", -10.0, 5, "SKU-E", true); // invalid price

        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        workbook.write(bos);
        byte[] xlsxBytes = bos.toByteArray();
        workbook.close();

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "products_import.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                xlsxBytes
        );

        // Act
        ExcelImportResult result = excelService.importProducts(file);

        // Assert
        assertThat(result.getTotalRows()).isEqualTo(5);
        assertThat(result.getSuccessfulImports()).isEqualTo(3);
        assertThat(result.getFailedImports()).isEqualTo(2);

        // Check product creations
        assertThat(productRepository.findAll()).hasSize(3);
        assertThat(productVariantRepository.findAll()).hasSize(3);

        // Check error messages indicate the exact rows (Row 4 and Row 5)
        assertThat(result.getErrors()).hasSize(2);
        assertThat(result.getErrors().get(0)).contains("Row 4", "Product name is required");
        assertThat(result.getErrors().get(1)).contains("Row 5", "Valid price is required");
    }
}
