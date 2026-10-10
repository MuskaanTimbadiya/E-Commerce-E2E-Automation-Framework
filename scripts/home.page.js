import { expect } from '@playwright/test';
import { homeLocators } from '../pages/home.locators.js';

export class HomePage {
  static async openSignupLogin(page) {
    await homeLocators.signupLoginLink(page).click();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText('New User Signup!')).toBeVisible();
  }

  static async clickContactUsLink(page) {
    await homeLocators.contactUsLink(page).click();
    await expect(page).toHaveURL(/\/contact_us/);
  }

  static async fillContactUsForm(page, contactData) {
    await homeLocators.contactNameInput(page).fill(contactData.name);
    await homeLocators.contactEmailInput(page).fill(contactData.email);
    await homeLocators.contactSubjectInput(page).fill(contactData.subject);
    await homeLocators.contactMessageTextarea(page).fill(contactData.message);
  }

  static async submitContactUsForm(page) {
    await homeLocators.contactSubmitButton(page).click();
    await page.on('dialog', async (dialog) => {
      await dialog.accept();
    });
  }

  static async verifyContactFormSubmission(page) {
    await expect(page.getByText('Success! Your details have been submitted successfully.')).toBeVisible();
  }

  static async clickHomeButton(page) {
    await homeLocators.homeButton(page).click();
    await expect(page).toHaveURL(/automationexercise\.com/);
  }

  static async clickTestCasesLink(page) {
    await homeLocators.testCasesLink(page).click();
    await expect(page).toHaveURL(/test_cases/);
  }
  static async clickProductsLink(page) {
    await homeLocators.productsLink(page).click();
    await expect(page).toHaveURL(/products/);
  }
  
  static async clickViewProductButton(page) {
    await homeLocators.viewProductButton(page).click();
    await expect(page).toHaveURL(/product_details\/1/);
  }

  static async scrollToFooter(page) {
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
  }

  static async verifySubscriptionSection(page) {
    await expect(homeLocators.subscriptionSection(page)).toBeVisible();
  }

  static async subscribeToNewsletter(page, email) {
    await homeLocators.subscriptionEmailInput(page).fill(email);
    await homeLocators.subscriptionSubmitButton(page).click();
    await expect(homeLocators.subscriptionSuccessMessage(page)).toBeVisible();
  }

  static async clickCartButton(page) {
    await homeLocators.cartButton(page).last().click();
    await expect(page).toHaveURL(/view_cart/);
  }
}