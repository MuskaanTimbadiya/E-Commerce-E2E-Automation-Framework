// @ts-check

/** @type {Record<string, (page: import('@playwright/test').Page) => import('@playwright/test').Locator>} */
export const accountInformationLocators = {
  mrsRadio: (page) => page.getByRole('radio', { name: 'Mrs.' }),
  passwordInput: (page) => page.getByRole('textbox', { name: 'Password *' }),
  firstNameInput: (page) => page.getByRole('textbox', { name: 'First name *' }),
  lastNameInput: (page) => page.getByRole('textbox', { name: 'Last name *' }),
  companyInput: (page) => page.getByRole('textbox', { name: 'Company', exact: true }),
  addressInput: (page) => page.getByRole('textbox', { name: /Address \* \(Street address/ }),
  address2Input: (page) => page.getByRole('textbox', { name: 'Address 2' }),
  countrySelect: (page) => page.getByLabel('Country *'),
  stateInput: (page) => page.getByRole('textbox', { name: 'State *' }),
  cityInput: (page) => page.getByRole('textbox', { name: /City \* Zipcode \*/ }),
  zipcodeInput: (page) => page.locator('#zipcode'),
  mobileInput: (page) => page.getByRole('textbox', { name: 'Mobile Number *' }),
  daysSelect: (page) => page.locator('#days'),
  monthsSelect: (page) => page.locator('#months'),
  yearsSelect: (page) => page.locator('#years'),
  createAccountButton: (page) => page.getByRole('button', { name: 'Create Account' }),
newsletterCheckbox: (page) => page.getByRole('checkbox', { name: 'Sign up for our newsletter!' }),
specialOffersCheckbox: (page) => page.getByRole('checkbox', { name: 'Receive special offers from our partners!' }),
};
