// @ts-check

/** @type {Record<string, (page: import('@playwright/test').Page) => import('@playwright/test').Locator>} */
export const loginLocators = {
  signupForm: (/** @type {import('@playwright/test').Page} */ page) =>
    page.locator('form').filter({ hasText: 'Signup' }),
  signupNameInput: (/** @type {import('@playwright/test').Page} */ page) =>
    loginLocators.signupForm(page).getByPlaceholder('Name'),
  signupEmailInput: (/** @type {import('@playwright/test').Page} */ page) =>
    loginLocators.signupForm(page).getByPlaceholder('Email Address'),
  signupButton: (/** @type {import('@playwright/test').Page} */ page) =>
    loginLocators.signupForm(page).getByRole('button', { name: 'Signup' }),
    loginForm: (/** @type {import('@playwright/test').Page} */ page) =>
    page.locator('form').filter({ hasText: 'Login' }),
  loginEmailInput: (/** @type {import('@playwright/test').Page} */ page) =>
    loginLocators.loginForm(page).getByPlaceholder('Email Address'),
  loginPasswordInput: (/** @type {import('@playwright/test').Page} */ page) =>
    loginLocators.loginForm(page).getByPlaceholder('Password'),
  loginButton: (/** @type {import('@playwright/test').Page} */ page) =>
    loginLocators.loginForm(page).getByRole('button', { name: 'Login' }),   
};
