// @ts-check

/** @type {Record<string, (page: import('@playwright/test').Page) => import('@playwright/test').Locator>} */
export const homeLocators = {
  signupLoginLink: (/** @type {import('@playwright/test').Page} */ page) =>
    page.getByRole('link', { name: /Signup \/ Login/ }),
    contactUsLink: (/** @type {import('@playwright/test').Page} */ page) =>
    page.getByRole('link', { name: /Contact us/ }),
  contactNameInput: (/** @type {import('@playwright/test').Page} */ page) =>
    page.getByPlaceholder('Name'),
  contactEmailInput: (/** @type {import('@playwright/test').Page} */ page) =>
    page.getByPlaceholder('Email').first(),
  contactSubjectInput: (/** @type {import('@playwright/test').Page} */ page) =>
    page.getByPlaceholder('Subject'),
  contactMessageTextarea: (/** @type {import('@playwright/test').Page} */ page) =>
    page.getByPlaceholder('Your Message Here'),
  contactSubmitButton: (/** @type {import('@playwright/test').Page} */ page) =>
    page.getByRole('button', { name: 'Submit' }),
  homeButton: (/** @type {import('@playwright/test').Page} */ page) =>
    page.getByRole('link', { name: 'Home' }),   
  testCasesLink: (/** @type {import('@playwright/test').Page} */ page) =>
    page.getByRole('link', { name: 'Test Cases' }).first(),
  productsLink: (/** @type {import('@playwright/test').Page} */ page) =>
    page.getByRole('link', { name: 'Products' }),
  viewProductButton: (/** @type {import('@playwright/test').Page} */ page) =>
    page.getByRole('link', { name: 'View Product' }).first(),
  subscriptionSection: (/** @type {import('@playwright/test').Page} */ page) =>
    page.locator('#footer .single-widget h2').filter({ hasText: 'Subscription' }),
  subscriptionEmailInput: (/** @type {import('@playwright/test').Page} */ page) =>
    page.getByPlaceholder('Your email address'),
  subscriptionSubmitButton: (/** @type {import('@playwright/test').Page} */ page) =>
    page.locator('#subscribe'),
  subscriptionSuccessMessage: (/** @type {import('@playwright/test').Page} */ page) =>
    page.getByText('You have been successfully subscribed!'),
  cartButton: (/** @type {import('@playwright/test').Page} */ page) =>
    page.getByRole('link', { name: 'Cart' }),
};
