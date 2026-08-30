package com.ecommerce.application.service.impl;

import com.ecommerce.application.dto.excel.ExcelImportResult;
import com.ecommerce.application.dto.excel.ProductImportRow;
import com.ecommerce.application.entity.*;
import com.ecommerce.application.enums.OrderStatus;
import com.ecommerce.application.repository.*;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ExcelService {

    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final CategoryRepository categoryRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;

    /**
     * Import products from Excel file
     */
    @Transactional
    public ExcelImportResult importProducts(MultipartFile file) throws IOException {
        ExcelImportResult result = ExcelImportResult.builder()
                .totalRows(0)
                .successfulImports(0)
                .failedImports(0)
                .errors(new ArrayList<>())
                .failedRows(new ArrayList<>())
                .build();

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);

            // Skip header row
            int rowNum = 0;
            for (Row row : sheet) {
                if (rowNum == 0) {
                    rowNum++;
                    continue; // Skip header
                }

                result.setTotalRows(result.getTotalRows() + 1);

                try {
                    ProductImportRow importRow = parseProductRow(row, rowNum);

                    if (Boolean.TRUE.equals(importRow.getHasErrors())) {
                        result.setFailedImports(result.getFailedImports() + 1);
                        result.getErrors().add("Row " + rowNum + ": " + importRow.getErrorMessage());
                        result.getFailedRows().add(importRow);
                    } else {
                        importProduct(importRow);
                        result.setSuccessfulImports(result.getSuccessfulImports() + 1);
                    }
                } catch (Exception e) {
                    result.setFailedImports(result.getFailedImports() + 1);
                    result.getErrors().add("Row " + rowNum + ": " + e.getMessage());
                }

                rowNum++;
            }
        }

        return result;
    }

    /**
     * Parse Excel row to ProductImportRow
     */
    private ProductImportRow parseProductRow(Row row, int rowNum) {
        ProductImportRow importRow = ProductImportRow.builder()
                .rowNumber(rowNum)
                .build();

        try {
            // Column mapping (adjust based on your Excel template)
            importRow.setProductName(getCellStringValue(row.getCell(0)));
            importRow.setDescription(getCellStringValue(row.getCell(1)));
            importRow.setBrand(getCellStringValue(row.getCell(2)));
            importRow.setCategoryName(getCellStringValue(row.getCell(3)));
            importRow.setSize(getCellStringValue(row.getCell(4)));
            importRow.setColor(getCellStringValue(row.getCell(5)));
            importRow.setPrice(getCellBigDecimalValue(row.getCell(6)));
            importRow.setStockQuantity(getCellIntegerValue(row.getCell(7)));
            importRow.setSku(getCellStringValue(row.getCell(8)));
            importRow.setIsActive(getCellBooleanValue(row.getCell(9)));

            // Validate required fields
            List<String> errors = new ArrayList<>();

            if (importRow.getProductName() == null || importRow.getProductName().trim().isEmpty()) {
                errors.add("Product name is required");
            }
            if (importRow.getCategoryName() == null || importRow.getCategoryName().trim().isEmpty()) {
                errors.add("Category is required");
            }
            if (importRow.getPrice() == null || importRow.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
                errors.add("Valid price is required");
            }
            if (importRow.getSku() == null || importRow.getSku().trim().isEmpty()) {
                errors.add("SKU is required");
            }

            if (!errors.isEmpty()) {
                importRow.setHasErrors(true);
                importRow.setErrorMessage(String.join(", ", errors));
            }

        } catch (Exception e) {
            importRow.setHasErrors(true);
            importRow.setErrorMessage("Error parsing row: " + e.getMessage());
        }

        return importRow;
    }

    /**
     * Import single product from row
     */
    private void importProduct(ProductImportRow importRow) {
        // Find or create category
        Category category = categoryRepository.findByName(importRow.getCategoryName())
                .orElseGet(() -> {
                    Category newCategory = new Category();
                    newCategory.setName(importRow.getCategoryName());
                    return categoryRepository.save(newCategory);
                });

        // Find or create product
        Product product = productRepository.findByNameAndBrand(
                importRow.getProductName(),
                importRow.getBrand()
        ).orElseGet(() -> {
            Product newProduct = Product.builder()
                    .name(importRow.getProductName())
                    .description(importRow.getDescription())
                    .brand(importRow.getBrand())
                    .category(category)
                    .isActive(importRow.getIsActive() != null ? importRow.getIsActive() : true)
                    .build();
            return productRepository.save(newProduct);
        });

        // Check if variant with SKU already exists
        Optional<ProductVariant> existingVariant = productVariantRepository.findBySku(importRow.getSku());

        if (existingVariant.isPresent()) {
            // Update existing variant
            ProductVariant variant = existingVariant.get();
            variant.setSize(importRow.getSize());
            variant.setColor(importRow.getColor());
            variant.setPrice(importRow.getPrice());
            variant.setStockQuantity(importRow.getStockQuantity());
            productVariantRepository.save(variant);
        } else {
            // Create new variant
            ProductVariant variant = ProductVariant.builder()
                    .product(product)
                    .size(importRow.getSize())
                    .color(importRow.getColor())
                    .price(importRow.getPrice())
                    .stockQuantity(importRow.getStockQuantity())
                    .sku(importRow.getSku())
                    .publicImageUrl("") // Will be updated later
                    .additionalImageUrls(new ArrayList<>())
                    .isActive(true)
                    .build();
            productVariantRepository.save(variant);
        }
    }

    /**
     * Export all products to Excel
     */
    public void exportProducts(HttpServletResponse response) throws IOException {
        List<Product> products = productRepository.findAll();

        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Products");

        // Create header style
        CellStyle headerStyle = createHeaderStyle(workbook);

        // Create header row
        Row headerRow = sheet.createRow(0);
        String[] headers = {
                "Product Name", "Description", "Brand", "Category",
                "Size", "Color", "Price", "Stock", "SKU", "Active"
        };

        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }

        // Fill data rows
        int rowNum = 1;
        for (Product product : products) {
            List<ProductVariant> variants = productVariantRepository.findByProductId(product.getId());

            if (variants.isEmpty()) {
                // Product without variants
                Row row = sheet.createRow(rowNum++);
                fillProductRow(row, product, null);
            } else {
                // Product with variants
                for (ProductVariant variant : variants) {
                    Row row = sheet.createRow(rowNum++);
                    fillProductRow(row, product, variant);
                }
            }
        }

        // Auto-size columns
        for (int i = 0; i < headers.length; i++) {
            sheet.autoSizeColumn(i);
        }

        // Write to response
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment; filename=products_" +
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".xlsx");

        workbook.write(response.getOutputStream());
        workbook.close();
    }

    /**
     * Export orders to Excel
     */
    public void exportOrders(LocalDateTime startDate, LocalDateTime endDate, HttpServletResponse response) throws IOException {
        List<Order> orders;

        if (startDate != null && endDate != null) {
            orders = orderRepository.findOrdersByDateRange(startDate, endDate);
        } else {
            orders = orderRepository.findAll();
        }

        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Orders");

        // Create header style
        CellStyle headerStyle = createHeaderStyle(workbook);
        CellStyle currencyStyle = createCurrencyStyle(workbook);
        CellStyle dateStyle = createDateStyle(workbook);

        // Create header row
        Row headerRow = sheet.createRow(0);
        String[] headers = {
                "Order ID", "Order Date", "Customer Name", "Customer Email",
                "Status", "Items", "Total Amount", "Shipping Address"
        };

        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }

        // Fill data rows
        int rowNum = 1;
        BigDecimal grandTotal = BigDecimal.ZERO;

        for (Order order : orders) {
            Row row = sheet.createRow(rowNum++);

            row.createCell(0).setCellValue(order.getId());

            Cell dateCell = row.createCell(1);
            dateCell.setCellValue(order.getCreatedAt().toString());
            dateCell.setCellStyle(dateStyle);

            row.createCell(2).setCellValue(order.getUser().getFullName());
            row.createCell(3).setCellValue(order.getUser().getEmail());
            row.createCell(4).setCellValue(order.getStatus().toString());

            List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
            row.createCell(5).setCellValue(items.size());

            Cell amountCell = row.createCell(6);
            amountCell.setCellValue(order.getTotalAmount().doubleValue());
            amountCell.setCellStyle(currencyStyle);

            if (order.getShippingAddress() != null) {
                row.createCell(7).setCellValue(formatAddress(order.getShippingAddress()));
            }

            grandTotal = grandTotal.add(order.getTotalAmount());
        }

        // Add summary row
        Row summaryRow = sheet.createRow(rowNum + 1);
        Cell summaryLabelCell = summaryRow.createCell(5);
        summaryLabelCell.setCellValue("Grand Total:");
        summaryLabelCell.setCellStyle(headerStyle);

        Cell summaryValueCell = summaryRow.createCell(6);
        summaryValueCell.setCellValue(grandTotal.doubleValue());
        summaryValueCell.setCellStyle(currencyStyle);

        // Auto-size columns
        for (int i = 0; i < headers.length; i++) {
            sheet.autoSizeColumn(i);
        }

        // Write to response
        String filename = "orders";
        if (startDate != null && endDate != null) {
            filename += "_" + startDate.format(DateTimeFormatter.ofPattern("yyyyMMdd")) +
                    "_to_" + endDate.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        }
        filename += ".xlsx";

        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment; filename=" + filename);

        workbook.write(response.getOutputStream());
        workbook.close();
    }

    /**
     * Export revenue analytics to Excel
     */
    public void exportRevenueReport(LocalDateTime startDate, LocalDateTime endDate, HttpServletResponse response) throws IOException {
        List<Order> orders = orderRepository.findOrdersByDateRange(startDate, endDate);

        Workbook workbook = new XSSFWorkbook();

        // Sheet 1: Summary
        createRevenueSummarySheet(workbook, orders, startDate, endDate);

        // Sheet 2: Daily Breakdown
        createDailyRevenueSheet(workbook, orders);

        // Sheet 3: Product Performance
        createProductPerformanceSheet(workbook, orders);

        // Sheet 4: Category Performance
        createCategoryPerformanceSheet(workbook, orders);

        // Write to response
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment; filename=revenue_report_" +
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".xlsx");

        workbook.write(response.getOutputStream());
        workbook.close();
    }

    /**
     * Export inventory report
     */
    public void exportInventoryReport(HttpServletResponse response) throws IOException {
        List<ProductVariant> variants = productVariantRepository.findAll();

        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Inventory");

        CellStyle headerStyle = createHeaderStyle(workbook);
        CellStyle lowStockStyle = createLowStockStyle(workbook);
        CellStyle outOfStockStyle = createOutOfStockStyle(workbook);

        // Create header
        Row headerRow = sheet.createRow(0);
        String[] headers = {
                "Product Name", "Brand", "Category", "Size", "Color",
                "SKU", "Price", "Stock Quantity", "Status"
        };

        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }

        // Fill data
        int rowNum = 1;
        for (ProductVariant variant : variants) {
            Row row = sheet.createRow(rowNum++);
            Product product = variant.getProduct();

            row.createCell(0).setCellValue(product.getName());
            row.createCell(1).setCellValue(product.getBrand());
            row.createCell(2).setCellValue(product.getCategory().getName());
            row.createCell(3).setCellValue(variant.getSize());
            row.createCell(4).setCellValue(variant.getColor());
            row.createCell(5).setCellValue(variant.getSku());
            row.createCell(6).setCellValue(variant.getPrice().doubleValue());

            Cell stockCell = row.createCell(7);
            stockCell.setCellValue(variant.getStockQuantity());

            Cell statusCell = row.createCell(8);
            if (variant.getStockQuantity() == 0) {
                statusCell.setCellValue("OUT OF STOCK");
                statusCell.setCellStyle(outOfStockStyle);
            } else if (variant.getStockQuantity() < 10) {
                statusCell.setCellValue("LOW STOCK");
                statusCell.setCellStyle(lowStockStyle);
            } else {
                statusCell.setCellValue("IN STOCK");
            }
        }

        // Auto-size columns
        for (int i = 0; i < headers.length; i++) {
            sheet.autoSizeColumn(i);
        }

        // Write to response
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment; filename=inventory_" +
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".xlsx");

        workbook.write(response.getOutputStream());
        workbook.close();
    }

    // ==================== Helper Methods ====================

    private void fillProductRow(Row row, Product product, ProductVariant variant) {
        row.createCell(0).setCellValue(product.getName());
        row.createCell(1).setCellValue(product.getDescription());
        row.createCell(2).setCellValue(product.getBrand());
        row.createCell(3).setCellValue(product.getCategory().getName());

        if (variant != null) {
            row.createCell(4).setCellValue(variant.getSize());
            row.createCell(5).setCellValue(variant.getColor());
            row.createCell(6).setCellValue(variant.getPrice().doubleValue());
            row.createCell(7).setCellValue(variant.getStockQuantity());
            row.createCell(8).setCellValue(variant.getSku());
            row.createCell(9).setCellValue(variant.getIsActive() ? "Yes" : "No");
        }
    }

    private void createRevenueSummarySheet(Workbook workbook, List<Order> orders, LocalDateTime startDate, LocalDateTime endDate) {
        Sheet sheet = workbook.createSheet("Summary");
        CellStyle headerStyle = createHeaderStyle(workbook);
        CellStyle currencyStyle = createCurrencyStyle(workbook);

        int rowNum = 0;

        // Title
        Row titleRow = sheet.createRow(rowNum++);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("Revenue Report");
        titleCell.setCellStyle(headerStyle);

        rowNum++; // Empty row

        // Date range
        Row dateRow = sheet.createRow(rowNum++);
        dateRow.createCell(0).setCellValue("Period:");
        dateRow.createCell(1).setCellValue(startDate.format(DateTimeFormatter.ofPattern("yyyy-MM-dd")) +
                " to " + endDate.format(DateTimeFormatter.ofPattern("yyyy-MM-dd")));

        rowNum++; // Empty row

        // Calculate metrics
        BigDecimal totalRevenue = orders.stream()
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long totalOrders = orders.size();
        long completedOrders = orders.stream()
                .filter(o -> o.getStatus() == OrderStatus.DELIVERED)
                .count();

        BigDecimal avgOrderValue = totalOrders > 0
                ? totalRevenue.divide(BigDecimal.valueOf(totalOrders), 2, BigDecimal.ROUND_HALF_UP)
                : BigDecimal.ZERO;

        // Metrics
        addMetricRow(sheet, rowNum++, "Total Revenue:", totalRevenue, currencyStyle);
        addMetricRow(sheet, rowNum++, "Total Orders:", BigDecimal.valueOf(totalOrders), null);
        addMetricRow(sheet, rowNum++, "Completed Orders:", BigDecimal.valueOf(completedOrders), null);
        addMetricRow(sheet, rowNum++, "Average Order Value:", avgOrderValue, currencyStyle);

        sheet.autoSizeColumn(0);
        sheet.autoSizeColumn(1);
    }

    private void createDailyRevenueSheet(Workbook workbook, List<Order> orders) {
        Sheet sheet = workbook.createSheet("Daily Revenue");
        CellStyle headerStyle = createHeaderStyle(workbook);
        CellStyle currencyStyle = createCurrencyStyle(workbook);

        // Group by date
        Map<String, BigDecimal> dailyRevenue = new TreeMap<>();
        Map<String, Long> dailyOrders = new TreeMap<>();

        for (Order order : orders) {
            String date = order.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
            dailyRevenue.merge(date, order.getTotalAmount(), BigDecimal::add);
            dailyOrders.merge(date, 1L, Long::sum);
        }

        // Header
        Row headerRow = sheet.createRow(0);
        headerRow.createCell(0).setCellValue("Date");
        headerRow.createCell(1).setCellValue("Orders");
        headerRow.createCell(2).setCellValue("Revenue");
        for (int i = 0; i < 3; i++) {
            headerRow.getCell(i).setCellStyle(headerStyle);
        }

        // Data
        int rowNum = 1;
        for (Map.Entry<String, BigDecimal> entry : dailyRevenue.entrySet()) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(entry.getKey());
            row.createCell(1).setCellValue(dailyOrders.get(entry.getKey()));

            Cell revenueCell = row.createCell(2);
            revenueCell.setCellValue(entry.getValue().doubleValue());
            revenueCell.setCellStyle(currencyStyle);
        }

        for (int i = 0; i < 3; i++) {
            sheet.autoSizeColumn(i);
        }
    }

    private void createProductPerformanceSheet(Workbook workbook, List<Order> orders) {
        Sheet sheet = workbook.createSheet("Product Performance");
        CellStyle headerStyle = createHeaderStyle(workbook);
        CellStyle currencyStyle = createCurrencyStyle(workbook);

        // Aggregate product sales
        Map<String, Integer> productQuantities = new HashMap<>();
        Map<String, BigDecimal> productRevenue = new HashMap<>();

        for (Order order : orders) {
            List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
            for (OrderItem item : items) {
                String productName = item.getProductNameSnapshot();
                productQuantities.merge(productName, item.getQuantity(), Integer::sum);
                BigDecimal itemRevenue = item.getPriceSnapshot()
                        .multiply(BigDecimal.valueOf(item.getQuantity()));
                productRevenue.merge(productName, itemRevenue, BigDecimal::add);
            }
        }

        // Header
        Row headerRow = sheet.createRow(0);
        headerRow.createCell(0).setCellValue("Product");
        headerRow.createCell(1).setCellValue("Units Sold");
        headerRow.createCell(2).setCellValue("Revenue");
        for (int i = 0; i < 3; i++) {
            headerRow.getCell(i).setCellStyle(headerStyle);
        }

        // Sort by revenue
        List<Map.Entry<String, BigDecimal>> sortedProducts = new ArrayList<>(productRevenue.entrySet());
        sortedProducts.sort((a, b) -> b.getValue().compareTo(a.getValue()));

        // Data
        int rowNum = 1;
        for (Map.Entry<String, BigDecimal> entry : sortedProducts) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(entry.getKey());
            row.createCell(1).setCellValue(productQuantities.get(entry.getKey()));

            Cell revenueCell = row.createCell(2);
            revenueCell.setCellValue(entry.getValue().doubleValue());
            revenueCell.setCellStyle(currencyStyle);
        }

        for (int i = 0; i < 3; i++) {
            sheet.autoSizeColumn(i);
        }
    }

    private void createCategoryPerformanceSheet(Workbook workbook, List<Order> orders) {
        Sheet sheet = workbook.createSheet("Category Performance");
        CellStyle headerStyle = createHeaderStyle(workbook);
        CellStyle currencyStyle = createCurrencyStyle(workbook);

        // Aggregate category sales
        Map<String, Integer> categoryQuantities = new HashMap<>();
        Map<String, BigDecimal> categoryRevenue = new HashMap<>();

        for (Order order : orders) {
            List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
            for (OrderItem item : items) {
                ProductVariant variant = item.getProductVariant();
                if (variant != null && variant.getProduct() != null) {
                    String categoryName = variant.getProduct().getCategory().getName();
                    categoryQuantities.merge(categoryName, item.getQuantity(), Integer::sum);
                    BigDecimal itemRevenue = item.getPriceSnapshot()
                            .multiply(BigDecimal.valueOf(item.getQuantity()));
                    categoryRevenue.merge(categoryName, itemRevenue, BigDecimal::add);
                }
            }
        }

        // Header
        Row headerRow = sheet.createRow(0);
        headerRow.createCell(0).setCellValue("Category");
        headerRow.createCell(1).setCellValue("Units Sold");
        headerRow.createCell(2).setCellValue("Revenue");
        for (int i = 0; i < 3; i++) {
            headerRow.getCell(i).setCellStyle(headerStyle);
        }

        // Sort by revenue
        List<Map.Entry<String, BigDecimal>> sortedCategories = new ArrayList<>(categoryRevenue.entrySet());
        sortedCategories.sort((a, b) -> b.getValue().compareTo(a.getValue()));

        // Data
        int rowNum = 1;
        for (Map.Entry<String, BigDecimal> entry : sortedCategories) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(entry.getKey());
            row.createCell(1).setCellValue(categoryQuantities.get(entry.getKey()));

            Cell revenueCell = row.createCell(2);
            revenueCell.setCellValue(entry.getValue().doubleValue());
            revenueCell.setCellStyle(currencyStyle);
        }

        for (int i = 0; i < 3; i++) {
            sheet.autoSizeColumn(i);
        }
    }

    private void addMetricRow(Sheet sheet, int rowNum, String label, BigDecimal value, CellStyle style) {
        Row row = sheet.createRow(rowNum);
        row.createCell(0).setCellValue(label);
        Cell valueCell = row.createCell(1);
        valueCell.setCellValue(value.doubleValue());
        if (style != null) {
            valueCell.setCellStyle(style);
        }
    }

    private String formatAddress(Address address) {
        return String.format("%s, %s, %s, %s",
                address.getStreet(),
                address.getCity(),
                address.getCountry(),
                address.getZipCode()
        );
    }

    // Cell value getters
    private String getCellStringValue(Cell cell) {
        if (cell == null) return null;
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> String.valueOf((long) cell.getNumericCellValue());
            default -> null;
        };
    }

    private BigDecimal getCellBigDecimalValue(Cell cell) {
        if (cell == null) return null;
        return switch (cell.getCellType()) {
            case NUMERIC -> BigDecimal.valueOf(cell.getNumericCellValue());
            case STRING -> {
                try {
                    yield new BigDecimal(cell.getStringCellValue());
                } catch (NumberFormatException e) {
                    yield null;
                }
            }
            default -> null;
        };
    }
    private Integer getCellIntegerValue(Cell cell) {
        if (cell == null) return null;
        return switch (cell.getCellType()) {
            case NUMERIC -> (int) cell.getNumericCellValue();
            case STRING -> {
                try {
                    yield Integer.parseInt(cell.getStringCellValue());
                } catch (NumberFormatException e) {
                    yield null;
                }
            }
            default -> null;
        };
    }

    private Boolean getCellBooleanValue(Cell cell) {
        if (cell == null) return true; // Default to true
        return switch (cell.getCellType()) {
            case BOOLEAN -> cell.getBooleanCellValue();
            case STRING -> cell.getStringCellValue().equalsIgnoreCase("yes") ||
                    cell.getStringCellValue().equalsIgnoreCase("true");
            default -> true;
        };
    }

    // Styles
    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 12);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    private CellStyle createCurrencyStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        DataFormat format = workbook.createDataFormat();
        style.setDataFormat(format.getFormat("$#,##0.00"));
        return style;
    }

    private CellStyle createDateStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        DataFormat format = workbook.createDataFormat();
        style.setDataFormat(format.getFormat("yyyy-mm-dd hh:mm:ss"));
        return style;
    }

    private CellStyle createLowStockStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setColor(IndexedColors.ORANGE.getIndex());
        font.setBold(true);
        style.setFont(font);
        return style;
    }

    private CellStyle createOutOfStockStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setColor(IndexedColors.RED.getIndex());
        font.setBold(true);
        style.setFont(font);
        return style;
    }
}
