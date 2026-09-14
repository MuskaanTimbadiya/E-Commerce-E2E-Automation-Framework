import { expect } from '@playwright/test';
import { loginLocators } from '../pages/login.locators.js';

export class LoginPage {
  /**
   * @param {import('@playwright/test').Page} page
   * @param {string} name
   * @param {string} email
   */
  static async signup(page, name, email) {
    await loginLocators.signupNameInput(page).fill(name);
    await loginLocators.signupEmailInput(page).fill(email);
    await loginLocators.signupButton(page).click();
  }

  static async verifySignupForm(page) {
    await expect(page.getByText('ENTER ACCOUNT INFORMATION')).toBeVisible();
  }
  static async login(page, email, password) {
    await loginLocators.loginEmailInput(page).fill(email);
    await loginLocators.loginPasswordInput(page).fill(password);
    await loginLocators.loginButton(page).click();
  }
}