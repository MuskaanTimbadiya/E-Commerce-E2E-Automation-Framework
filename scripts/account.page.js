// @ts-check

import { accountLocators as locators } from '../pages/account.locators.js';

export class AccountPage {
  /**
     * @param {import('@playwright/test').Page} page
     * @param {string} name
     * @returns {import('@playwright/test').Locator}
     */
  static loggedInAs(page, name) {
    return locators.loggedInAs(page, name);
  }

  /** @param {import('@playwright/test').Page} page */
  static accountCreatedMessage(page) {
    return locators.accountCreatedMessage(page);
  }

  /** @param {import('@playwright/test').Page} page */
  static accountDeletedMessage(page) {
    return locators.accountDeletedMessage(page);
  }

  /** @param {import('@playwright/test').Page} page */
  static async deleteAccount(page) {
    await locators.deleteAccountLink(page).click();
  }

  /** @param {import('@playwright/test').Page} page */
  static async continue(page) {
    await locators.continueLink(page).click();
  }

  /** @param {import('@playwright/test').Page} page */
  static async logout(page) {
    await locators.logoutLink(page).click();
  }
  /** @param {import('@playwright/test').Page} page */
  static async downloadInvoice(page) {
    await locators.downloadInvoiceButton(page).click();
  }
}