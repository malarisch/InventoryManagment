import { test as base } from '@playwright/test';

export type TestOptions = {
  testEmail: string;
    testPassword: string;
    companyName: string;
};
const testEmail = process.env.playwright_mail || `test@test.test`;
const testPassword = process.env.playwright_password || `password`;
const companyName = process.env.playwright_company ||  `Playwright Test Co`;


export const test = base.extend<TestOptions>({
  // Define an option and provide a default value.
  // We can later override it in the config.
  testEmail,
  testPassword,
  companyName,
});

