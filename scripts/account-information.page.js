// @ts-check

import { accountInformationLocators as locators } from '../pages/account-information.locators.js';

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
    await locators.mrsRadio(page).check();
    await locators.passwordInput(page).fill(user.password);
    await locators.daysSelect(page).selectOption(user.dateOfBirth.day);
    await locators.monthsSelect(page).selectOption(user.dateOfBirth.month);
    await locators.yearsSelect(page).selectOption(user.dateOfBirth.year);
    if (user.newsletter) await locators.newsletterCheckbox(page).check();
    if (user.specialOffers) await locators.specialOffersCheckbox(page).check();
    await locators.firstNameInput(page).fill(user.firstName);
    await locators.lastNameInput(page).fill(user.lastName);
    await locators.companyInput(page).fill(user.company);
    await locators.addressInput(page).fill(user.address);
    await locators.address2Input(page).fill(user.address2);
    await locators.countrySelect(page).selectOption(user.country);
    await locators.stateInput(page).fill(user.state);
    await locators.cityInput(page).fill(user.city);
    await locators.zipcodeInput(page).fill(user.zipcode);
    await locators.mobileInput(page).fill(user.mobile);
    await locators.createAccountButton(page).click();
  }
}