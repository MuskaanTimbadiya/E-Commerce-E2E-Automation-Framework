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
};
