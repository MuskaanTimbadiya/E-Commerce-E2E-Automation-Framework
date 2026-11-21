import { expect } from '@playwright/test';
import loginLocators from '../pages/login.json' with { type: 'json' };

export class LoginPage {
  /**
   * @param {import('@playwright/test').Page} page
   * @param {string} name
   * @param {string} email
   */
  static async signup(page, name, email) {
    await page.locator(loginLocators.signupNameInput).fill(name);
    await page.locator(loginLocators.signupEmailInput).fill(email);
    await page.locator(loginLocators.signupButton).click();
  }

  static async verifySignupForm(page) {
    await expect(page.locator(loginLocators.signupFormTitle)).toBeVisible();
  }

  static async login(page, email, password) {
    await page.locator(loginLocators.loginEmailInput).fill(email);
    await page.locator(loginLocators.loginPasswordInput).fill(password);
    await page.locator(loginLocators.loginButton).click();
  }
}
