// @ts-check

import locators from '../pages/account.json' with { type: 'json' };

export class AccountPage {
  /**
   * @param {import('@playwright/test').Page} page
   * @param {string} name
   * @returns {import('@playwright/test').Locator}
   */
  static loggedInAs(page, name) {
    return page.locator(locators.loggedInAs.replace('{name}', name));
  }

  /** @param {import('@playwright/test').Page} page */
  static accountCreatedMessage(page) {
    return page.locator(locators.accountCreatedMessage);
  }

  /** @param {import('@playwright/test').Page} page */
  static accountDeletedMessage(page) {
    return page.locator(locators.accountDeletedMessage);
  }

  /** @param {import('@playwright/test').Page} page */
  static async deleteAccount(page) {
    await page.locator(locators.deleteAccountLink).click();
  }

  /** @param {import('@playwright/test').Page} page */
  static async continue(page) {
    await page.locator(locators.continueLink).click();
  }

  /** @param {import('@playwright/test').Page} page */
  static async logout(page) {
    await page.locator(locators.logoutLink).click();
  }

  /** @param {import('@playwright/test').Page} page */
  static async downloadInvoice(page) {
    await page.locator(locators.downloadInvoiceButton).click();
  }
}
