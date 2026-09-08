import { test, expect } from '@playwright/test';
import { 
  getAdminToken, 
  seedTestProduct, 
  deleteTestProduct, 
  updateVariantStock,
  seedTestBlogPost, 
  deleteTestBlogPost 
} from './fixtures/seed';

test.describe('Cross-App Integration Tests', () => {
  let adminToken: string;

  test.beforeAll(async ({ request }) => {
    adminToken = await getAdminToken(request);
  });

  // D1. Publish a new blog post in the admin -> storefront blog list updates
  test('should display newly published blog post from admin instantly', async ({ page, request }) => {
    // 1. Create a draft blog post
    const title = `Cross-App Blog-${Date.now()}`;
    const blogPost = await seedTestBlogPost(request, adminToken, title, false);

    // 2. Load storefront blog list and verify draft is NOT present
    await page.goto('/blog');
    await expect(page.locator(`text=${title}`)).not.toBeVisible();

    // 3. Publish the blog post via admin API
    const publishRes = await request.patch(`${process.env.API_BASE_URL || 'http://localhost:8080/api'}/admin/blog/${blogPost.id}/publish`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    expect(publishRes.ok()).toBeTruthy();

    // 4. Load storefront blog list in fresh context and verify post appears
    await page.goto('/blog');
    await expect(page.locator(`text=${title}`)).toBeVisible();

    // Clean up
    await deleteTestBlogPost(request, adminToken, blogPost.id);
  });

  // D2. Update a product's stock to 0 in the admin -> storefront reflects out-of-stock
  test('should reflect out-of-stock instantly when stock is zeroed in admin', async ({ page, request }) => {
    // 1. Seed a product with stock = 5
    const seededProduct = await seedTestProduct(request, adminToken, `Stock-Test-${Date.now()}`, 1, 5);
    const variantId = seededProduct.variants[0].id;

    // 2. Load storefront product detail and verify "In Stock" status
    await page.goto(`/product/${seededProduct.id}`);
    await expect(page.getByTestId('product-stock-indicator')).toContainText(/In Stock/i);
    await expect(page.getByTestId('product-add-to-cart')).not.toHaveAttribute('disabled', '');

    // 3. Set stock to 0 via admin API
    await updateVariantStock(request, adminToken, variantId, 0);

    // 4. Reload storefront and verify "Out of Stock" and button is disabled
    await page.reload();
    await expect(page.getByTestId('product-stock-indicator')).toContainText(/Out of Stock/i);
    await expect(page.getByTestId('product-add-to-cart')).toContainText(/Out of Stock/i);

    // Clean up
    await deleteTestProduct(request, adminToken, seededProduct.id);
  });

  // D3. Publish homepage config changes in admin -> storefront homepage updates
  test('should display published homepage title updates instantly', async ({ page, request }) => {
    // 1. Get current homepage config draft
    const draftRes = await request.get(`${process.env.API_BASE_URL || 'http://localhost:8080/api'}/admin/homepage`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    expect(draftRes.ok()).toBeTruthy();
    const draftEnvelope = await draftRes.json();
    const currentDraft = draftEnvelope.data;

    // 2. Update homepage draft config title
    const newHeroTitle = `E2E New Era - ${Date.now()}`;
    const updateRes = await request.put(`${process.env.API_BASE_URL || 'http://localhost:8080/api'}/admin/homepage`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        heroTitle: newHeroTitle,
        heroSubtitle: currentDraft.heroSubtitle || 'Default Subtitle',
        heroImageUrl: currentDraft.heroImageUrl || '',
        ctaText: currentDraft.ctaText || 'Shop Now',
        ctaLink: currentDraft.ctaLink || '/shop',
        featuredProductIds: currentDraft.featuredProductIds || []
      }
    });
    expect(updateRes.ok()).toBeTruthy();

    // 3. Publish config changes
    const publishRes = await request.patch(`${process.env.API_BASE_URL || 'http://localhost:8080/api'}/admin/homepage/publish`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    expect(publishRes.ok()).toBeTruthy();

    // 4. Load storefront homepage and check new title is reflected
    await page.goto('/');
    await expect(page.locator(`text=${newHeroTitle}`)).toBeVisible();
  });
});
