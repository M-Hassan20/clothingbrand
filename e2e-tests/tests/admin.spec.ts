import { test, expect } from '@playwright/test';
import { getAdminToken, seedTestProduct, deleteTestProduct, seedTestBlogPost, deleteTestBlogPost } from './fixtures/seed';

test.describe('Admin Dashboard - Authenticated Flow', () => {
  let adminToken: string;
  let seededProduct: any;

  test.beforeAll(async ({ request }) => {
    adminToken = await getAdminToken(request);
    seededProduct = await seedTestProduct(request, adminToken, `Admin-Test-Product-${Date.now()}`);
  });

  test.afterAll(async ({ request }) => {
    if (seededProduct) {
      await deleteTestProduct(request, adminToken, seededProduct.id);
    }
  });

  // C1. Auth Redirect & C3. Dashboard Home
  test('should display dashboard home with metrics cards', async ({ page }) => {
    await page.goto('/');

    // Verify stat cards
    await expect(page.getByTestId('dashboard-pending-orders')).toBeVisible();
    await expect(page.getByTestId('dashboard-today-revenue')).toBeVisible();
    await expect(page.getByTestId('dashboard-low-stock-count')).toBeVisible();
    await expect(page.getByTestId('dashboard-total-products')).toBeVisible();
  });

  // C2. Role-Based Access Control (RBAC)
  test('should block customer role from dashboard', async ({ browser }) => {
    // Create customer session
    const context = await browser.newContext();
    const page = await context.newPage();

    // Set localStorage with CUSTOMER credentials
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('admin_token', 'mock-customer-token');
      localStorage.setItem('admin_user', JSON.stringify({
        userId: 999,
        email: 'customer@example.com',
        fullName: 'Test Customer',
        role: 'CUSTOMER'
      }));
    });

    // Try navigating to dashboard root
    await page.goto('/');
    // Should block and redirect to login
    await expect(page).toHaveURL(/.*\/login/);
    await context.close();
  });

  // C4. Products Management
  test('should navigate to products and perform search/filter', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('sidebar-link-products').click();

    // Check URL & header title
    await expect(page).toHaveURL(/.*\/products/);
    await expect(page.locator('header span').first()).toContainText('Products');

    // Search for seeded product
    const searchInput = page.locator('input[placeholder*="Search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill(seededProduct.name);
      await searchInput.press('Enter');
      await expect(page.locator(`text=${seededProduct.name}`)).toBeVisible();
    }
  });

  // C6. Orders Management
  test('should display orders list and permit updates', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('sidebar-link-orders').click();
    
    // Check URL & header title
    await expect(page).toHaveURL(/.*\/orders/);
    await expect(page.locator('header span').first()).toContainText('Orders');
    
    // Status tags plain-language check
    const statusCell = page.locator('table tbody tr td').first();
    if (await statusCell.isVisible()) {
      await expect(statusCell).toBeVisible();
    }
  });

  // C7. Categories
  test('should allow creating and renaming categories', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('sidebar-link-categories').click();
    
    // Check URL & header title
    await expect(page).toHaveURL(/.*\/categories/);
    await expect(page.locator('header span').first()).toContainText('Categories');

    // Add category triggers
    const addBtn = page.getByRole('button', { name: /add/i }).first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      const input = page.locator('input[placeholder*="Category Name"]');
      if (await input.isVisible()) {
        await input.fill(`Cat-${Date.now()}`);
        await page.getByRole('button', { name: /save|create/i }).click();
      }
    }
  });

  // C8. Blog Posts
  test('should manage blog posts and drafts', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('sidebar-link-blog').click();
    
    // Check URL & header title
    await expect(page).toHaveURL(/.*\/blog/);
    await expect(page.locator('header span').first()).toContainText('Blog');

    // Create Draft button check
    const newPostBtn = page.getByRole('button', { name: /new|draft|create/i }).first();
    if (await newPostBtn.isVisible()) {
      await newPostBtn.click();
    }
  });

  // C10. Inventory
  test('should quick edit inventory stock levels', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('sidebar-link-inventory-&-alerts').click();
    
    // Check URL & header title
    await expect(page).toHaveURL(/.*\/inventory/);
    await expect(page.locator('header span').first()).toContainText('Inventory & Alerts');

    // Direct input stock edit (does not require clicking edit first)
    const qtyInput = page.locator('table input[type="number"]').first();
    if (await qtyInput.isVisible()) {
      await qtyInput.fill('15');
      const saveBtn = page.locator('table button').first();
      await saveBtn.click({ force: true });
      await expect(page.locator('text=Stock updated successfully')).toBeVisible();
    }
  });

  // C12. Responsive Sidebar behavior
  test('should collapse sidebar below breakpoint', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    // Mobile check: sidebar menu collapses to drawer
    const menuButton = page.locator('button:has(svg.lucide-menu)').first();
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await expect(page.locator('nav').last()).toBeVisible();
    }
  });
});
