import { expect } from '@playwright/test';
import { homeLocators } from '../pages/home.locators.js';

export class HomePage {
  /** @param {import('@playwright/test').Page} page */
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
  } 

  static async acceptAlert(page) {
    page.on('dialog', async (dialog) => {
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
}