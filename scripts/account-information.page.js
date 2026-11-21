// @ts-check

import locators from '../pages/account-information.json' with { type: 'json' };

export class AccountInformationPage {
  /**
   * @param {import('@playwright/test').Page} page
   * @param {{
   *   password: string,
   *   dateOfBirth: { day: string, month: string, year: string },
   *   newsletter: boolean,
   *   specialOffers: boolean,
   *   firstName: string,
   *   lastName: string,
   *   company: string,
   *   address: string,
   *   address2: string,
   *   country: string,
   *   state: string,
   *   city: string,
   *   zipcode: string,
   *   mobile: string
   * }} user
   */
  static async completeAccountDetails(page, user) {
    await page.locator(locators.mrsRadio).check();
    await page.locator(locators.passwordInput).fill(user.password);
    await page.locator(locators.daysSelect).selectOption(user.dateOfBirth.day);
    await page.locator(locators.monthsSelect).selectOption(user.dateOfBirth.month);
    await page.locator(locators.yearsSelect).selectOption(user.dateOfBirth.year);
    if (user.newsletter) await page.locator(locators.newsletterCheckbox).check();
    if (user.specialOffers) await page.locator(locators.specialOffersCheckbox).check();
    await page.locator(locators.firstNameInput).fill(user.firstName);
    await page.locator(locators.lastNameInput).fill(user.lastName);
    await page.locator(locators.companyInput).fill(user.company);
    await page.locator(locators.addressInput).fill(user.address);
    await page.locator(locators.address2Input).fill(user.address2);
    await page.locator(locators.countrySelect).selectOption(user.country);
    await page.locator(locators.stateInput).fill(user.state);
    await page.locator(locators.cityInput).fill(user.city);
    await page.locator(locators.zipcodeInput).fill(user.zipcode);
    await page.locator(locators.mobileInput).fill(user.mobile);
    await page.locator(locators.createAccountButton).click();
  }
}
