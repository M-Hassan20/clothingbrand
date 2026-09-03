package com.ecommerce.application.service.impl;

import com.ecommerce.application.dto.InvoiceData;
import com.ecommerce.application.entity.*;
import com.ecommerce.application.repository.OrderItemRepository;
import com.ecommerce.application.repository.OrderRepository;
import com.ecommerce.application.repository.PaymentRepository;
import com.ecommerce.application.service.impl.EmailService;
import com.itextpdf.io.font.constants.StandardFonts;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.properties.HorizontalAlignment;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final PaymentRepository paymentRepository;
    private final EmailService emailService;

    @Value("${company.name}")
    private String companyName;

    @Value("${company.address}")
    private String companyAddress;

    @Value("${company.phone}")
    private String companyPhone;

    @Value("${company.email}")
    private String companyEmail;

    @Value("${company.website}")
    private String companyWebsite;

    /**
     * Generate invoice PDF for an order
     */
    public byte[] generateInvoice(Long orderId) throws IOException {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        List<OrderItem> orderItems = orderItemRepository.findByOrderId(orderId);
        Payment payment = paymentRepository.findByOrderId(orderId).orElse(null);

        InvoiceData invoiceData = buildInvoiceData(order, orderItems, payment);

        return createPdfInvoice(invoiceData);
    }

    /**
     * Generate and email invoice to customer
     */
    public void generateAndEmailInvoice(Long orderId) throws IOException {
        byte[] invoicePdf = generateInvoice(orderId);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        // TODO: Implement email with attachment
        // For now, just log
        System.out.println("Invoice generated for order #" + orderId);
    }

    /**
     * Build invoice data from order
     */
    private InvoiceData buildInvoiceData(Order order, List<OrderItem> orderItems, Payment payment) {
        BigDecimal subtotal = orderItems.stream()
                .map(item -> item.getPriceSnapshot().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal shippingFee = BigDecimal.ZERO;
        BigDecimal discount = order.getDiscountAmount() != null ? order.getDiscountAmount() : BigDecimal.ZERO;
        BigDecimal tax = BigDecimal.ZERO;

        return InvoiceData.builder()
                .orderId(order.getId())
                .orderDate(order.getCreatedAt())
                .orderStatus(order.getStatus().toString())
                .customerName(order.getUser().getFullName())
                .customerEmail(order.getUser().getEmail())
                .customerPhone(order.getUser().getPhone())
                .shippingAddress(order.getShippingAddress())
                .orderItems(orderItems)
                .subtotal(subtotal)
                .shippingFee(shippingFee)
                .discount(discount)
                .tax(tax)
                .total(order.getTotalAmount())
                .paymentMethod(payment != null ? "Online Payment" : "Cash on Delivery")
                .paymentStatus(payment != null ? payment.getPaymentStatus().toString() : "PENDING")
                .companyName(companyName)
                .companyAddress(companyAddress)
                .companyPhone(companyPhone)
                .companyEmail(companyEmail)
                .companyWebsite(companyWebsite)
                .build();
    }

    /**
     * Create PDF invoice
     */
    private byte[] createPdfInvoice(InvoiceData data) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf);

        // Fonts
        PdfFont boldFont = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
        PdfFont regularFont = PdfFontFactory.createFont(StandardFonts.HELVETICA);

        // Colors
        DeviceRgb primaryColor = new DeviceRgb(0, 0, 0); // Black
        DeviceRgb secondaryColor = new DeviceRgb(100, 100, 100); // Gray

        // Add company header
        addHeader(document, data, boldFont);

        // Add invoice title and details
        addInvoiceInfo(document, data, boldFont, regularFont);

        // Add customer and shipping info
        addCustomerInfo(document, data, boldFont, regularFont);

        // Add items table
        addItemsTable(document, data, boldFont, regularFont);

        // Add totals
        addTotals(document, data, boldFont, regularFont);

        // Add payment info
        addPaymentInfo(document, data, boldFont, regularFont);

        // Add footer
        addFooter(document, data, regularFont);

        document.close();
        return baos.toByteArray();
    }

    private void addHeader(Document document, InvoiceData data, PdfFont boldFont) {
        Table headerTable = new Table(UnitValue.createPercentArray(new float[]{1, 1}))
                .useAllAvailableWidth();

        // Company info (left)
        Paragraph companyInfo = new Paragraph()
                .add(new Text(data.getCompanyName() + "\n").setFont(boldFont).setFontSize(16))
                .add(new Text(data.getCompanyAddress() + "\n").setFontSize(10))
                .add(new Text("Phone: " + data.getCompanyPhone() + "\n").setFontSize(10))
                .add(new Text("Email: " + data.getCompanyEmail()).setFontSize(10));

        headerTable.addCell(new Cell().add(companyInfo).setBorder(Border.NO_BORDER));

        // Invoice title (right)
        Paragraph invoiceTitle = new Paragraph("INVOICE")
                .setFont(boldFont)
                .setFontSize(24)
                .setTextAlignment(TextAlignment.RIGHT);

        headerTable.addCell(new Cell().add(invoiceTitle).setBorder(Border.NO_BORDER));

        document.add(headerTable);
        document.add(new Paragraph("\n"));
    }

    private void addInvoiceInfo(Document document, InvoiceData data, PdfFont boldFont, PdfFont regularFont) {
        Table infoTable = new Table(UnitValue.createPercentArray(new float[]{1, 1}))
                .useAllAvailableWidth();

        // Invoice details (left)
        Paragraph invoiceDetails = new Paragraph()
                .add(new Text("Invoice #: ").setFont(boldFont))
                .add(new Text("INV-" + String.format("%06d", data.getOrderId()) + "\n").setFont(regularFont))
                .add(new Text("Order #: ").setFont(boldFont))
                .add(new Text("#" + data.getOrderId() + "\n").setFont(regularFont))
                .add(new Text("Date: ").setFont(boldFont))
                .add(new Text(data.getOrderDate().format(DateTimeFormatter.ofPattern("dd MMM yyyy")) + "\n").setFont(regularFont))
                .add(new Text("Status: ").setFont(boldFont))
                .add(new Text(data.getOrderStatus()).setFont(regularFont));

        infoTable.addCell(new Cell().add(invoiceDetails).setBorder(Border.NO_BORDER));
        infoTable.addCell(new Cell().setBorder(Border.NO_BORDER)); // Empty cell

        document.add(infoTable);
        document.add(new Paragraph("\n"));
    }

    private void addCustomerInfo(Document document, InvoiceData data, PdfFont boldFont, PdfFont regularFont) {
        Table customerTable = new Table(UnitValue.createPercentArray(new float[]{1, 1}))
                .useAllAvailableWidth();

        // Bill to (left)
        Paragraph billTo = new Paragraph()
                .add(new Text("BILL TO\n").setFont(boldFont).setFontSize(12))
                .add(new Text(data.getCustomerName() + "\n").setFont(regularFont))
                .add(new Text(data.getCustomerEmail() + "\n").setFont(regularFont))
                .add(new Text(data.getCustomerPhone() != null ? data.getCustomerPhone() : "").setFont(regularFont));

        customerTable.addCell(new Cell().add(billTo).setBorder(Border.NO_BORDER).setPadding(10)
                .setBackgroundColor(new DeviceRgb(245, 245, 245)));

        // Ship to (right)
        Address addr = data.getShippingAddress();
        Paragraph shipTo = new Paragraph()
                .add(new Text("SHIP TO\n").setFont(boldFont).setFontSize(12));

        if (addr != null) {
            shipTo.add(new Text(addr.getLabel() + "\n").setFont(regularFont))
                    .add(new Text(addr.getStreet() + "\n").setFont(regularFont))
                    .add(new Text(addr.getCity() + ", " + addr.getCountry() + "\n").setFont(regularFont))
                    .add(new Text(addr.getZipCode()).setFont(regularFont));
        }

        customerTable.addCell(new Cell().add(shipTo).setBorder(Border.NO_BORDER).setPadding(10)
                .setBackgroundColor(new DeviceRgb(245, 245, 245)));

        document.add(customerTable);
        document.add(new Paragraph("\n"));
    }

    private void addItemsTable(Document document, InvoiceData data, PdfFont boldFont, PdfFont regularFont) {
        Table itemsTable = new Table(UnitValue.createPercentArray(new float[]{3, 1, 1, 1, 1.5f}))
                .useAllAvailableWidth();

        // Header row
        itemsTable.addHeaderCell(new Cell().add(new Paragraph("ITEM").setFont(boldFont))
                .setBackgroundColor(new DeviceRgb(0, 0, 0))
                .setFontColor(ColorConstants.WHITE)
                .setPadding(8));
        itemsTable.addHeaderCell(new Cell().add(new Paragraph("SIZE").setFont(boldFont))
                .setBackgroundColor(new DeviceRgb(0, 0, 0))
                .setFontColor(ColorConstants.WHITE)
                .setPadding(8));
        itemsTable.addHeaderCell(new Cell().add(new Paragraph("QTY").setFont(boldFont))
                .setBackgroundColor(new DeviceRgb(0, 0, 0))
                .setFontColor(ColorConstants.WHITE)
                .setPadding(8)
                .setTextAlignment(TextAlignment.CENTER));
        itemsTable.addHeaderCell(new Cell().add(new Paragraph("PRICE").setFont(boldFont))
                .setBackgroundColor(new DeviceRgb(0, 0, 0))
                .setFontColor(ColorConstants.WHITE)
                .setPadding(8)
                .setTextAlignment(TextAlignment.RIGHT));
        itemsTable.addHeaderCell(new Cell().add(new Paragraph("TOTAL").setFont(boldFont))
                .setBackgroundColor(new DeviceRgb(0, 0, 0))
                .setFontColor(ColorConstants.WHITE)
                .setPadding(8)
                .setTextAlignment(TextAlignment.RIGHT));

        // Data rows
        for (OrderItem item : data.getOrderItems()) {
            BigDecimal itemTotal = item.getPriceSnapshot().multiply(BigDecimal.valueOf(item.getQuantity()));

            itemsTable.addCell(new Cell().add(new Paragraph(item.getProductNameSnapshot()).setFont(regularFont))
                    .setPadding(8));

            String size = item.getProductVariant() != null
                    ? item.getProductVariant().getSize() + "/" + item.getProductVariant().getColor()
                    : "N/A";
            itemsTable.addCell(new Cell().add(new Paragraph(size).setFont(regularFont))
                    .setPadding(8));

            itemsTable.addCell(new Cell().add(new Paragraph(String.valueOf(item.getQuantity())).setFont(regularFont))
                    .setPadding(8)
                    .setTextAlignment(TextAlignment.CENTER));

            itemsTable.addCell(new Cell().add(new Paragraph("Rs. " + item.getPriceSnapshot().toString()).setFont(regularFont))
                    .setPadding(8)
                    .setTextAlignment(TextAlignment.RIGHT));

            itemsTable.addCell(new Cell().add(new Paragraph("Rs. " + itemTotal.toString()).setFont(regularFont))
                    .setPadding(8)
                    .setTextAlignment(TextAlignment.RIGHT));
        }

        document.add(itemsTable);
        document.add(new Paragraph("\n"));
    }

    private void addTotals(Document document, InvoiceData data, PdfFont boldFont, PdfFont regularFont) {
        Table totalsTable = new Table(UnitValue.createPercentArray(new float[]{3, 1}))
                .useAllAvailableWidth()
                .setHorizontalAlignment(HorizontalAlignment.RIGHT);

        // Subtotal
        totalsTable.addCell(new Cell().add(new Paragraph("Subtotal:").setFont(regularFont))
                .setBorder(Border.NO_BORDER)
                .setTextAlignment(TextAlignment.RIGHT)
                .setPadding(5));
        totalsTable.addCell(new Cell().add(new Paragraph("Rs. " + data.getSubtotal().toString()).setFont(regularFont))
                .setBorder(Border.NO_BORDER)
                .setTextAlignment(TextAlignment.RIGHT)
                .setPadding(5));

        // Shipping
        if (data.getShippingFee().compareTo(BigDecimal.ZERO) > 0) {
            totalsTable.addCell(new Cell().add(new Paragraph("Shipping:").setFont(regularFont))
                    .setBorder(Border.NO_BORDER)
                    .setTextAlignment(TextAlignment.RIGHT)
                    .setPadding(5));
            totalsTable.addCell(new Cell().add(new Paragraph("Rs. " + data.getShippingFee().toString()).setFont(regularFont))
                    .setBorder(Border.NO_BORDER)
                    .setTextAlignment(TextAlignment.RIGHT)
                    .setPadding(5));
        }

        // Discount
        if (data.getDiscount().compareTo(BigDecimal.ZERO) > 0) {
            totalsTable.addCell(new Cell().add(new Paragraph("Discount:").setFont(regularFont))
                    .setBorder(Border.NO_BORDER)
                    .setTextAlignment(TextAlignment.RIGHT)
                    .setPadding(5));
            totalsTable.addCell(new Cell().add(new Paragraph("-Rs. " + data.getDiscount().toString()).setFont(regularFont))
                    .setBorder(Border.NO_BORDER)
                    .setTextAlignment(TextAlignment.RIGHT)
                    .setPadding(5));
        }

        // Tax
        if (data.getTax().compareTo(BigDecimal.ZERO) > 0) {
            totalsTable.addCell(new Cell().add(new Paragraph("Tax:").setFont(regularFont))
                    .setBorder(Border.NO_BORDER)
                    .setTextAlignment(TextAlignment.RIGHT)
                    .setPadding(5));
            totalsTable.addCell(new Cell().add(new Paragraph("Rs. " + data.getTax().toString()).setFont(regularFont))
                    .setBorder(Border.NO_BORDER)
                    .setTextAlignment(TextAlignment.RIGHT)
                    .setPadding(5));
        }

        // Total (bold)
        totalsTable.addCell(new Cell().add(new Paragraph("TOTAL:").setFont(boldFont).setFontSize(14))
                .setBorder(Border.NO_BORDER)
                .setTextAlignment(TextAlignment.RIGHT)
                .setPadding(5)
                .setPaddingTop(10));
        totalsTable.addCell(new Cell().add(new Paragraph("Rs. " + data.getTotal().toString()).setFont(boldFont).setFontSize(14))
                .setBorder(Border.NO_BORDER)
                .setTextAlignment(TextAlignment.RIGHT)
                .setPadding(5)
                .setPaddingTop(10));

        document.add(totalsTable);
        document.add(new Paragraph("\n"));
    }

    private void addPaymentInfo(Document document, InvoiceData data, PdfFont boldFont, PdfFont regularFont) {
        Paragraph paymentInfo = new Paragraph()
                .add(new Text("PAYMENT INFORMATION\n").setFont(boldFont).setFontSize(12))
                .add(new Text("Payment Method: ").setFont(boldFont))
                .add(new Text(data.getPaymentMethod() + "\n").setFont(regularFont))
                .add(new Text("Payment Status: ").setFont(boldFont))
                .add(new Text(data.getPaymentStatus()).setFont(regularFont));

        document.add(new Div()
                .add(paymentInfo)
                .setBackgroundColor(new DeviceRgb(245, 245, 245))
                .setPadding(10));

        document.add(new Paragraph("\n"));
    }

    private void addFooter(Document document, InvoiceData data, PdfFont regularFont) {
        Paragraph footer = new Paragraph()
                .add(new Text("Thank you for your business!\n").setFontSize(12).setBold())
                .add(new Text("For any questions regarding this invoice, please contact us at " + data.getCompanyEmail() + "\n").setFontSize(9))
                .add(new Text(data.getCompanyWebsite()).setFontSize(9))
                .setTextAlignment(TextAlignment.CENTER)
                .setFontColor(new DeviceRgb(100, 100, 100));

        document.add(footer);
    }
}