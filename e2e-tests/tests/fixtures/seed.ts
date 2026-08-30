import { APIRequestContext } from '@playwright/test';

export async function getAdminToken(request: APIRequestContext): Promise<string> {
  const loginRes = await request.post(`${process.env.API_BASE_URL || 'http://localhost:8080/api'}/auth/login`, {
    data: {
      email: process.env.TEST_ADMIN_EMAIL || 'hausofhafsa@gmail.com',
      password: process.env.TEST_ADMIN_PASSWORD || 'password123',
    }
  });

  if (!loginRes.ok()) {
    throw new Error(`Failed to login as admin for seeding: ${await loginRes.text()}`);
  }

  const envelope = await loginRes.json();
  return envelope.data.token;
}

export async function seedTestCategory(request: APIRequestContext, adminToken: string, name: string) {
  const res = await request.post(`${process.env.API_BASE_URL || 'http://localhost:8080/api'}/admin/categories`, {
    headers: { Authorization: `Bearer ${adminToken}` },
    data: { name },
  });

  if (!res.ok()) {
    throw new Error(`Failed to seed test category: ${await res.text()}`);
  }

  const envelope = await res.json();
  return envelope.data;
}

export async function deleteTestCategory(request: APIRequestContext, adminToken: string, id: number) {
  const res = await request.delete(`${process.env.API_BASE_URL || 'http://localhost:8080/api'}/admin/categories/${id}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  return res.ok();
}

export async function seedTestProduct(
  request: APIRequestContext, 
  adminToken: string, 
  name = 'E2E Test Product', 
  categoryId = 1,
  stockQuantity = 50
) {
  const sku = `E2E-TEST-${Date.now()}`;
  const productData = {
    name,
    description: 'Seeded for automated testing of Haus of Hafsah storefront',
    brand: 'Test Brand',
    categoryId,
    isActive: true,
    variants: [
      {
        size: 'M',
        color: 'Black',
        price: 29.99,
        stockQuantity,
        sku,
        publicImageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=600',
        isActive: true,
      }
    ]
  };

  const productRes = await request.post(`${process.env.API_BASE_URL || 'http://localhost:8080/api'}/admin/products`, {
    headers: { Authorization: `Bearer ${adminToken}` },
    multipart: {
      product: {
        name: 'product.json',
        mimeType: 'application/json',
        buffer: Buffer.from(JSON.stringify(productData)),
      }
    }
  });

  if (!productRes.ok()) {
    throw new Error(`Failed to seed test product: ${await productRes.text()}`);
  }

  const envelope = await productRes.json();
  const createdProd = envelope.data;

  // Fetch full details to get variants
  const detailRes = await request.get(`${process.env.API_BASE_URL || 'http://localhost:8080/api'}/products/${createdProd.id}`);
  if (!detailRes.ok()) {
    throw new Error(`Failed to get product details: ${await detailRes.text()}`);
  }
  const detailEnvelope = await detailRes.json();
  return detailEnvelope.data;
}

export async function deleteTestProduct(request: APIRequestContext, adminToken: string, productId: number) {
  const res = await request.delete(`${process.env.API_BASE_URL || 'http://localhost:8080/api'}/admin/products/${productId}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  return res.ok();
}

export async function updateVariantStock(request: APIRequestContext, adminToken: string, variantId: number, quantity: number) {
  const res = await request.patch(`${process.env.API_BASE_URL || 'http://localhost:8080/api'}/admin/products/variants/${variantId}/stock`, {
    headers: { Authorization: `Bearer ${adminToken}` },
    params: { quantity }
  });

  if (!res.ok()) {
    throw new Error(`Failed to update variant stock: ${await res.text()}`);
  }

  const envelope = await res.json();
  return envelope.data;
}

export async function seedTestBlogPost(request: APIRequestContext, adminToken: string, title = 'E2E Blog Post Draft', publish = false) {
  const res = await request.post(`${process.env.API_BASE_URL || 'http://localhost:8080/api'}/admin/blog`, {
    headers: { Authorization: `Bearer ${adminToken}` },
    data: {
      title,
      excerpt: 'Short excerpt describing the seeded blog post',
      contentHtml: '<p>This is dynamic, rich text content seeded by Playwright test</p>',
      authorName: 'E2E Test Runner',
      category: 'Announcements',
    }
  });

  if (!res.ok()) {
    throw new Error(`Failed to seed test blog post: ${await res.text()}`);
  }

  const envelope = await res.json();
  let blogPost = envelope.data;

  if (publish) {
    const publishRes = await request.patch(`${process.env.API_BASE_URL || 'http://localhost:8080/api'}/admin/blog/${blogPost.id}/publish`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (!publishRes.ok()) {
      throw new Error(`Failed to publish blog post: ${await publishRes.text()}`);
    }
    const publishEnvelope = await publishRes.json();
    blogPost = publishEnvelope.data;
  }

  return blogPost;
}

export async function deleteTestBlogPost(request: APIRequestContext, adminToken: string, id: number) {
  const res = await request.delete(`${process.env.API_BASE_URL || 'http://localhost:8080/api'}/admin/blog/${id}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  return res.ok();
}
