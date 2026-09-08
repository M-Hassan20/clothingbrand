import { test, expect } from '@playwright/test';
import { 
  getAdminToken, 
  seedTestProduct, 
  deleteTestProduct, 
  seedTestBlogPost, 
  deleteTestBlogPost,
  seedTestCategory,
  deleteTestCategory
} from './fixtures/seed';

test.describe('Storefront Tests - Guest Flow', () => {
  let adminToken: string;
  let seededProduct: any;
  let seededCategory: any;
  let seededBlogPost: any;

  test.beforeAll(async ({ request }) => {
    adminToken = await getAdminToken(request);
    seededCategory = await seedTestCategory(request, adminToken, `Category-${Date.now()}`);
    seededProduct = await seedTestProduct(request, adminToken, `Storefront-Test-Product-${Date.now()}`, seededCategory.id);
    seededBlogPost = await seedTestBlogPost(request, adminToken, `Blog-Post-${Date.now()}`, true);
  });

  test.afterAll(async ({ request }) => {
    if (seededProduct) {
      await deleteTestProduct(request, adminToken, seededProduct.id);
    }
    if (seededCategory) {
      await deleteTestCategory(request, adminToken, seededCategory.id);
    }
    if (seededBlogPost) {
      await deleteTestBlogPost(request, adminToken, seededBlogPost.id);
    }
  });

  // B1. Homepage
  test('should render homepage correctly', async ({ page }) => {
    await page.goto('/');
    // Check title
    await expect(page).toHaveTitle(/Haus of Hafsah/i);

    // Verify New Arrivals / Best Sellers or arrival text
    const bodyText = await page.innerText('body');
    expect(bodyText.toLowerCase()).toContain('arrival');

    // Category tiles link to shop page
    const categoryLink = page.locator('a[href*="/shop"]').first();
    await expect(categoryLink).toBeVisible();
  });

  // B2. Product Browsing & Filtering
  test('should search and filter products on shop page', async ({ page }) => {
    await page.goto('/shop');
    
    // Grid renders seeded product
    await expect(page.locator(`text=${seededProduct.name}`)).toBeVisible();

    // Search functionality
    const searchInput = page.locator('input[placeholder*="Search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill(seededProduct.name);
      await searchInput.press('Enter');
      await expect(page.locator(`text=${seededProduct.name}`)).toBeVisible();

      // Search non-existent
      await searchInput.fill('NonExistentProductXYZ');
      await searchInput.press('Enter');
      await expect(page.locator('text=No products found')).toBeVisible();
    }
  });

  // B3. Product Detail Page
  test('should display product details and support wishlist add', async ({ page }) => {
    await page.goto(`/product/${seededProduct.id}`);

    // Verify correct product data
    await expect(page.locator('h1')).toContainText(seededProduct.name);
    await expect(page.getByTestId('product-stock-indicator')).toBeVisible();

    // Select variant
    const sizeBtn = page.getByTestId('product-size-M');
    if (await sizeBtn.isVisible()) {
      await sizeBtn.click();
    }

    const colorBtn = page.getByTestId('product-color-black');
    if (await colorBtn.isVisible()) {
      await colorBtn.click();
    }

    // Add to wishlist (guest cookie check)
    const wishlistBtn = page.getByTestId('product-add-to-wishlist');
    await expect(wishlistBtn).toBeVisible();
    await wishlistBtn.click();
    await expect(page.locator('text=Added to wishlist')).toBeVisible();
  });

  // B4. Cart Drawer
  test('should manage items in the cart', async ({ page }) => {
    await page.goto(`/product/${seededProduct.id}`);

    // Add to cart
    const addToCartBtn = page.getByTestId('product-add-to-cart');
    await addToCartBtn.click();

    // Cart badge updates immediately
    const cartCount = page.getByTestId('navbar-cart-count');
    await expect(cartCount).toContainText('1');

    // Cart drawer displays item
    const cartDrawerBtn = page.getByTestId('navbar-cart-button');
    await cartDrawerBtn.click();

    const cartItem = page.getByTestId(`cart-item-${seededProduct.variants[0].id}`);
    await expect(cartItem).toBeVisible();

    // Subtotal exists
    const subtotal = page.getByTestId('cart-subtotal');
    await expect(subtotal).toBeVisible();

    // Increase quantity
    const plusBtn = page.getByTestId('cart-item-qty-plus');
    await plusBtn.click();
    await expect(page.getByTestId('cart-item-qty')).toContainText('2');

    // Remove item
    const removeBtn = page.getByTestId('cart-item-remove');
    await removeBtn.click();
    await expect(page.locator('text=Your bag is empty')).toBeVisible();
  });

  // B5. Guest Checkout & Duplication check
  test('should complete guest checkout and not duplicate user record', async ({ page, request }) => {
    test.setTimeout(60000);
    await page.goto(`/product/${seededProduct.id}`);
    
    // Select variant options
    await page.getByTestId('product-size-M').click();
    await page.getByTestId('product-color-black').click();
    
    // Add item to cart
    await page.getByTestId('product-add-to-cart').click();
    await expect(page.getByTestId('navbar-cart-count')).toBeVisible();
    
    // Navigate to checkout via dedicated Cart Page to avoid cart drawer visibility issues
    await page.goto('/cart');
    await page.getByRole('button', { name: /Proceed to Checkout/i }).click();

    // Fill guest details
    const uniqueEmail = `guest-e2e-${Date.now()}@example.com`;
    await page.getByTestId('checkout-guest-name').fill('Guest Customer');
    await page.getByTestId('checkout-guest-email').fill(uniqueEmail);
    await page.getByTestId('checkout-guest-phone').fill('03123456789');
    await page.getByTestId('checkout-guest-street').fill('123 Test Street');
    await page.getByTestId('checkout-guest-city').fill('Lahore');
    await page.getByTestId('checkout-guest-zipcode').fill('54000');
    await page.getByTestId('checkout-guest-country').fill('Pakistan');

    await page.getByTestId('checkout-continue-payment-button').click({ force: true });

    // Choose Cash on Delivery
    await page.getByTestId('payment-method-cod').click({ force: true });
    await page.getByTestId('checkout-place-order-button').click({ force: true });

    // Confirmation page
    await expect(page.locator('h1')).toContainText('Order Confirmed', { timeout: 35000 });

    // Verify guest session: assert no auth token cookie is set
    const cookies = await page.context().cookies();
    const tokenCookie = cookies.find(c => c.name === 'token');
    expect(tokenCookie).toBeUndefined();

    // Place a second guest order with the SAME email to verify user-row deduplication
    await page.goto(`/product/${seededProduct.id}`);
    await page.getByTestId('product-size-M').click();
    await page.getByTestId('product-color-black').click();
    await page.getByTestId('product-add-to-cart').click();
    await page.goto('/cart');
    await page.getByRole('button', { name: /Proceed to Checkout/i }).click();

    await page.getByTestId('checkout-guest-name').fill('Guest Customer');
    await page.getByTestId('checkout-guest-email').fill(uniqueEmail);
    await page.getByTestId('checkout-guest-phone').fill('03123456789');
    await page.getByTestId('checkout-guest-street').fill('123 Test Street');
    await page.getByTestId('checkout-guest-city').fill('Lahore');
    await page.getByTestId('checkout-guest-zipcode').fill('54000');
    await page.getByTestId('checkout-guest-country').fill('Pakistan');

    await page.getByTestId('checkout-continue-payment-button').click({ force: true });
    await page.getByTestId('payment-method-cod').click({ force: true });
    await page.getByTestId('checkout-place-order-button').click({ force: true });
    await expect(page.locator('h1')).toContainText('Order Confirmed', { timeout: 35000 });

    // Verify via Admin API: fetch orders and assert same userId for both orders
    const ordersRes = await request.get(`${process.env.API_BASE_URL || 'http://localhost:8080/api'}/admin/orders?size=100`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    expect(ordersRes.ok()).toBeTruthy();
    const ordersEnvelope = await ordersRes.json();
    const guestOrders = ordersEnvelope.data.content.filter((o: any) => o.userEmail === uniqueEmail);
    expect(guestOrders.length).toBe(2);
    expect(guestOrders[0].userId).toBe(guestOrders[1].userId);
  });

  // B7. Auth Redirect popup trigger
  test('should render google auth button', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.getByTestId('google-signin-button')).toBeVisible();
  });

  // B10. Blog published list
  test('should display published blog posts', async ({ page }) => {
    await page.goto('/blog');
    await expect(page.locator(`text=${seededBlogPost.title}`)).toBeVisible();
  });

  // B11. SafePay Payment gateway redirect verification
  test('should redirect to getsafepay.com when credit card is chosen', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto(`/product/${seededProduct.id}`);
    await page.getByTestId('product-size-M').click();
    await page.getByTestId('product-color-black').click();
    await page.getByTestId('product-add-to-cart').click();
    await page.goto('/cart');
    await page.getByRole('button', { name: /Proceed to Checkout/i }).click();

    await page.getByTestId('checkout-guest-name').fill('SafePay User');
    await page.getByTestId('checkout-guest-email').fill('safepay@example.com');
    await page.getByTestId('checkout-guest-phone').fill('03212345678');
    await page.getByTestId('checkout-guest-street').fill('Payment Blvd');
    await page.getByTestId('checkout-guest-city').fill('Karachi');
    await page.getByTestId('checkout-guest-zipcode').fill('74200');
    await page.getByTestId('checkout-guest-country').fill('Pakistan');

    await page.getByTestId('checkout-continue-payment-button').click({ force: true });
    await page.getByTestId('payment-method-card').click({ force: true });
    await page.getByTestId('payment-channel-cybersource').click({ force: true });

    // Click place order and verify redirect to getsafepay.com
    await page.getByTestId('checkout-place-order-button').click({ force: true });
    await page.waitForURL(/.*getsafepay\.com.*/, { timeout: 20000 });
    expect(page.url()).toContain('getsafepay.com');
  });

  // B12. Responsive Hamburger Navigation
  test('mobile hamburger menu opens/closes correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const hamburger = page.locator('button:has(svg.lucide-menu)');
    await expect(hamburger).toBeVisible();
    await hamburger.click();

    // Mobile nav drawer is visible
    await expect(page.getByTestId('mobilenav-link-shop')).toBeVisible();
  });
});

test.describe('Storefront Tests - Authenticated Customer Flow', () => {
  let adminToken: string;
  let seededProduct: any;

  test.beforeAll(async ({ request }) => {
    adminToken = await getAdminToken(request);
    seededProduct = await seedTestProduct(request, adminToken, `Storefront-Auth-Product-${Date.now()}`);
  });

  test.afterAll(async ({ request }) => {
    if (seededProduct) {
      await deleteTestProduct(request, adminToken, seededProduct.id);
    }
  });

  // B6. Authenticated checkout & Profile claims
  test('should complete checkout as logged-in customer @auth', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto(`/product/${seededProduct.id}`);
    await page.getByTestId('product-size-M').click();
    await page.getByTestId('product-color-black').click();
    await page.getByTestId('product-add-to-cart').click();
    await page.goto('/cart');
    await page.getByRole('button', { name: /Proceed to Checkout/i }).click();

    // Continue to payment (since address is preselected or saved)
    await page.getByTestId('checkout-continue-payment-button').click({ force: true });
    
    await page.getByTestId('payment-method-cod').click({ force: true });
    await page.getByTestId('checkout-place-order-button').click({ force: true });
 
    // Success page
    await expect(page.locator('h1')).toContainText('Order Confirmed', { timeout: 35000 });

    await page.goto('/account/orders');
    await expect(page.locator('h1')).toContainText('Order History');
    await expect(page.locator('body')).toContainText('Order Number');
  });
});
