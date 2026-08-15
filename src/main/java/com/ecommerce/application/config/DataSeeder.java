package com.ecommerce.application.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        System.out.println("Checking if database needs mock data seeding...");

        // Check if categories are already populated
        Integer categoryCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM categories", Integer.class);
        if (categoryCount != null && categoryCount > 0) {
            System.out.println("Database already contains data. Skipping mock data seeding.");
            return;
        }

        System.out.println("Seeding mock categories, products, and variants...");

        // 1. Seed Categories
        jdbcTemplate.execute("INSERT INTO categories (id, name, created_at, updated_at) VALUES " +
                "(1, 'New Arrivals', NOW(), NOW()), " +
                "(2, 'Knitwear', NOW(), NOW()), " +
                "(3, 'Outerwear', NOW(), NOW()), " +
                "(4, 'Essentials', NOW(), NOW())");

        // 2. Seed Products
        jdbcTemplate.execute("INSERT INTO products (id, name, description, brand, category_id, thumbnail_image, is_active, created_at, updated_at) VALUES " +
                "(101, 'Ribbed Knit Midi Dress', 'An elegant ribbed midi dress crafted from a soft wool-cashmere blend. Features a high mock neck, long sleeves, and a subtle side slit for ease of movement. The warm neutral tone complements any minimal autumn-winter styling.', 'Haus of Hafsah', 2, 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=600', true, NOW(), NOW()), " +
                "(102, 'Classic Belted Trench Coat', 'A timeless, double-breasted trench coat designed for effortless seasonal layering. Crafted from a structured cotton blend, it features storm flaps, epaulettes, adjustable wrist cuffs, and a matching fabric belt to cinch the waist.', 'Haus of Hafsah', 3, 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=600', true, NOW(), NOW()), " +
                "(103, 'Oversized Silk Button-Down', 'A luxurious silk button-down shirt designed with a relaxed, oversized drape. Featuring a pointed collar, buttoned cuffs, and a chest patch pocket, this versatile piece transitions seamlessly from casual lounging to tailored occasion-wear.', 'Haus of Hafsah', 4, 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=600', true, NOW(), NOW()), " +
                "(104, 'Cashmere Mock-Neck Sweater', 'Luxuriously soft mock-neck sweater knitted from 100% fine Mongolian cashmere. Tailored for a slightly relaxed, slouchy fit with ribbed edges, drop shoulders, and a clean modern hemline.', 'Haus of Hafsah', 2, 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=600', true, NOW(), NOW()), " +
                "(105, 'Tailored Linen Trousers', 'An elegant pair of wide-leg trousers cut from premium heavy-weight European flax linen. Designed with a high-rise waist, pleated front, belt loops, and hidden closures to offer a structured yet airy summery look.', 'Haus of Hafsah', 4, 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=600', true, NOW(), NOW()), " +
                "(106, 'Minimalist Wrap Wool Coat', 'A luxurious wrap coat styled in double-faced brushed virgin wool. Made with a relaxed silhouette, dropped shoulders, notched lapels, two patch front pockets, and an optional matching sash belt.', 'Haus of Hafsah', 3, 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=600', true, NOW(), NOW())");

        // 3. Seed Product Variants
        // Product 101 variants (Ribbed Knit Midi Dress)
        jdbcTemplate.execute("INSERT INTO product_variants (id, product_id, size, color, price, stock_quantity, public_image_url, sku, is_active, created_at, updated_at) VALUES " +
                "(1001, 101, 'XS', 'Beige', 120.00, 5, 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=600', 'HOH-RKD-BE-XS', true, NOW(), NOW()), " +
                "(1002, 101, 'S', 'Beige', 120.00, 8, 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=600', 'HOH-RKD-BE-S', true, NOW(), NOW()), " +
                "(1003, 101, 'M', 'Beige', 120.00, 12, 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=600', 'HOH-RKD-BE-M', true, NOW(), NOW()), " +
                "(1004, 101, 'L', 'Beige', 120.00, 0, 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=600', 'HOH-RKD-BE-L', true, NOW(), NOW()), " +
                "(1005, 101, 'S', 'Ivory', 130.00, 3, 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=600', 'HOH-RKD-IV-S', true, NOW(), NOW()), " +
                "(1006, 101, 'M', 'Ivory', 130.00, 6, 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=600', 'HOH-RKD-IV-M', true, NOW(), NOW()), " +
                "(1007, 101, 'L', 'Ivory', 130.00, 0, 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=600', 'HOH-RKD-IV-L', true, NOW(), NOW()), " +
                "(1008, 101, 'S', 'Charcoal', 145.00, 4, 'https://images.unsplash.com/photo-1574164904299-3a102b110380?q=80&w=600', 'HOH-RKD-CH-S', true, NOW(), NOW()), " +
                "(1009, 101, 'M', 'Charcoal', 145.00, 10, 'https://images.unsplash.com/photo-1574164904299-3a102b110380?q=80&w=600', 'HOH-RKD-CH-M', true, NOW(), NOW()), " +
                "(1010, 101, 'L', 'Charcoal', 145.00, 2, 'https://images.unsplash.com/photo-1574164904299-3a102b110380?q=80&w=600', 'HOH-RKD-CH-L', true, NOW(), NOW())");

        // Product 102 variants (Classic Belted Trench Coat)
        jdbcTemplate.execute("INSERT INTO product_variants (id, product_id, size, color, price, stock_quantity, public_image_url, sku, is_active, created_at, updated_at) VALUES " +
                "(2001, 102, 'S', 'Camel', 190.00, 4, 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=600', 'HOH-CTC-CA-S', true, NOW(), NOW()), " +
                "(2002, 102, 'M', 'Camel', 190.00, 2, 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=600', 'HOH-CTC-CA-M', true, NOW(), NOW()), " +
                "(2003, 102, 'L', 'Camel', 190.00, 6, 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=600', 'HOH-CTC-CA-L', true, NOW(), NOW()), " +
                "(2004, 102, 'XL', 'Camel', 190.00, 0, 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=600', 'HOH-CTC-CA-XL', true, NOW(), NOW()), " +
                "(2005, 102, 'S', 'Charcoal', 190.00, 5, 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=600', 'HOH-CTC-CH-S', true, NOW(), NOW()), " +
                "(2006, 102, 'M', 'Charcoal', 190.00, 7, 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=600', 'HOH-CTC-CH-M', true, NOW(), NOW()), " +
                "(2007, 102, 'L', 'Charcoal', 190.00, 3, 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=600', 'HOH-CTC-CH-L', true, NOW(), NOW())");

        // Product 103 variants (Oversized Silk Button-Down)
        jdbcTemplate.execute("INSERT INTO product_variants (id, product_id, size, color, price, stock_quantity, public_image_url, sku, is_active, created_at, updated_at) VALUES " +
                "(3001, 103, 'XS', 'Ivory', 95.00, 8, 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=600', 'HOH-OSB-IV-XS', true, NOW(), NOW()), " +
                "(3002, 103, 'S', 'Ivory', 95.00, 10, 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=600', 'HOH-OSB-IV-S', true, NOW(), NOW()), " +
                "(3003, 103, 'M', 'Ivory', 95.00, 12, 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=600', 'HOH-OSB-IV-M', true, NOW(), NOW()), " +
                "(3004, 103, 'L', 'Ivory', 95.00, 4, 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=600', 'HOH-OSB-IV-L', true, NOW(), NOW()), " +
                "(3005, 103, 'S', 'Blush', 110.00, 2, 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=600', 'HOH-OSB-BL-S', true, NOW(), NOW()), " +
                "(3006, 103, 'M', 'Blush', 110.00, 0, 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=600', 'HOH-OSB-BL-M', true, NOW(), NOW()), " +
                "(3007, 103, 'S', 'Beige', 95.00, 4, 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=600', 'HOH-OSB-BE-S', true, NOW(), NOW()), " +
                "(3008, 103, 'M', 'Beige', 95.00, 8, 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=600', 'HOH-OSB-BE-M', true, NOW(), NOW())");

        // Product 104 variants (Cashmere Mock-Neck Sweater)
        jdbcTemplate.execute("INSERT INTO product_variants (id, product_id, size, color, price, stock_quantity, public_image_url, sku, is_active, created_at, updated_at) VALUES " +
                "(4001, 104, 'XS', 'Beige', 165.00, 3, 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=600', 'HOH-CMS-BE-XS', true, NOW(), NOW()), " +
                "(4002, 104, 'S', 'Beige', 165.00, 9, 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=600', 'HOH-CMS-BE-S', true, NOW(), NOW()), " +
                "(4003, 104, 'M', 'Beige', 165.00, 0, 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=600', 'HOH-CMS-BE-M', true, NOW(), NOW()), " +
                "(4004, 104, 'L', 'Beige', 165.00, 4, 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=600', 'HOH-CMS-BE-L', true, NOW(), NOW()), " +
                "(4005, 104, 'S', 'Ivory', 165.00, 11, 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=600', 'HOH-CMS-IV-S', true, NOW(), NOW()), " +
                "(4006, 104, 'M', 'Ivory', 165.00, 5, 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=600', 'HOH-CMS-IV-M', true, NOW(), NOW()), " +
                "(4007, 104, 'S', 'Camel', 165.00, 3, 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=600', 'HOH-CMS-CA-S', true, NOW(), NOW()), " +
                "(4008, 104, 'M', 'Camel', 165.00, 2, 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=600', 'HOH-CMS-CA-M', true, NOW(), NOW())");

        // Product 105 variants (Tailored Linen Trousers)
        jdbcTemplate.execute("INSERT INTO product_variants (id, product_id, size, color, price, stock_quantity, public_image_url, sku, is_active, created_at, updated_at) VALUES " +
                "(5001, 105, 'XS', 'Beige', 85.00, 4, 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=600', 'HOH-TLT-BE-XS', true, NOW(), NOW()), " +
                "(5002, 105, 'S', 'Beige', 85.00, 6, 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=600', 'HOH-TLT-BE-S', true, NOW(), NOW()), " +
                "(5003, 105, 'M', 'Beige', 85.00, 9, 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=600', 'HOH-TLT-BE-M', true, NOW(), NOW()), " +
                "(5004, 105, 'L', 'Beige', 85.00, 2, 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=600', 'HOH-TLT-BE-L', true, NOW(), NOW()), " +
                "(5005, 105, 'S', 'Charcoal', 95.00, 2, 'https://images.unsplash.com/photo-1574164904299-3a102b110380?q=80&w=600', 'HOH-TLT-CH-S', true, NOW(), NOW()), " +
                "(5006, 105, 'M', 'Charcoal', 95.00, 0, 'https://images.unsplash.com/photo-1574164904299-3a102b110380?q=80&w=600', 'HOH-TLT-CH-M', true, NOW(), NOW())");

        // Product 106 variants (Minimalist Wrap Wool Coat)
        jdbcTemplate.execute("INSERT INTO product_variants (id, product_id, size, color, price, stock_quantity, public_image_url, sku, is_active, created_at, updated_at) VALUES " +
                "(6001, 106, 'S', 'Camel', 220.00, 3, 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=600', 'HOH-WWC-CA-S', true, NOW(), NOW()), " +
                "(6002, 106, 'M', 'Camel', 220.00, 5, 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=600', 'HOH-WWC-CA-M', true, NOW(), NOW()), " +
                "(6003, 106, 'L', 'Camel', 220.00, 0, 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=600', 'HOH-WWC-CA-L', true, NOW(), NOW()), " +
                "(6004, 106, 'S', 'Charcoal', 240.00, 2, 'https://images.unsplash.com/photo-1574164904299-3a102b110380?q=80&w=600', 'HOH-WWC-CH-S', true, NOW(), NOW()), " +
                "(6005, 106, 'M', 'Charcoal', 240.00, 4, 'https://images.unsplash.com/photo-1574164904299-3a102b110380?q=80&w=600', 'HOH-WWC-CH-M', true, NOW(), NOW())");

        System.out.println("Mock database data successfully seeded!");
    }
}
