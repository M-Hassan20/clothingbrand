import { test as setup } from '@playwright/test';
import path from 'path';

const ADMIN_AUTH_FILE = path.resolve(__dirname, '../../.auth/admin.json');

setup('authenticate as admin', async ({ page }) => {
  await page.goto('/login');
  await page.getByTestId('login-email-input').fill(process.env.TEST_ADMIN_EMAIL!);
  await page.getByTestId('login-password-input').fill(process.env.TEST_ADMIN_PASSWORD!);
  await page.getByTestId('login-submit-button').click();
  await page.waitForURL('/'); // dashboard home
  await page.context().storageState({ path: ADMIN_AUTH_FILE });
});
