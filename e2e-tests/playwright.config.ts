import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.test') });

const ADMIN_AUTH_FILE = path.resolve(__dirname, '.auth/admin.json');
const CUSTOMER_AUTH_FILE = path.resolve(__dirname, '.auth/customer.json');

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'setup-admin',
      testMatch: /.*admin-auth\.setup\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.ADMIN_BASE_URL || 'http://localhost:3001',
      },
    },
    {
      name: 'setup-customer',
      testMatch: /.*customer-auth\.setup\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.STOREFRONT_BASE_URL || 'http://localhost:3000',
      },
    },
    {
      name: 'admin-authenticated',
      testMatch: /.*admin\.spec\.ts/,
      dependencies: ['setup-admin'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.ADMIN_BASE_URL || 'http://localhost:3001',
        storageState: ADMIN_AUTH_FILE,
      },
    },
    {
      name: 'storefront-authenticated',
      testMatch: /.*storefront\.spec\.ts/,
      grep: /@auth/,
      dependencies: ['setup-customer'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.STOREFRONT_BASE_URL || 'http://localhost:3000',
        storageState: CUSTOMER_AUTH_FILE,
      },
    },
    {
      name: 'storefront-guest',
      testMatch: /.*storefront\.spec\.ts/,
      grepInvert: /@auth/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.STOREFRONT_BASE_URL || 'http://localhost:3000',
      },
    },
  ],
});

