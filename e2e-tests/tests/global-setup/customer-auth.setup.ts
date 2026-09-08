import { test as setup } from '@playwright/test';
import path from 'path';

const CUSTOMER_AUTH_FILE = path.resolve(__dirname, '../../.auth/customer.json');

setup('authenticate as customer', async ({ page }) => {
  await page.goto('/auth/login');
  await page.getByTestId('login-email-input').fill(process.env.TEST_CUSTOMER_EMAIL!);
  await page.getByTestId('login-password-input').fill(process.env.TEST_CUSTOMER_PASSWORD!);
  await page.getByTestId('login-submit-button').click();
  await page.waitForURL('/shop');
  await page.context().storageState({ path: CUSTOMER_AUTH_FILE });
});
