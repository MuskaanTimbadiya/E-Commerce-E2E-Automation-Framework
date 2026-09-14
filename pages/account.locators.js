// @ts-check

export const accountLocators = {
  deleteAccountLink: (/** @type {import('@playwright/test').Page} */ page) =>
    page.getByRole('link', { name: /Delete Account/ }),
  continueLink: (/** @type {import('@playwright/test').Page} */ page) =>
    page.getByRole('link', { name: 'Continue' }),
  logoutLink: (/** @type {import('@playwright/test').Page} */ page) =>
    page.getByRole('link', { name: 'Logout' }),
  accountCreatedMessage: (/** @type {import('@playwright/test').Page} */ page) =>
    page.getByText('Congratulations! Your new'),
  accountDeletedMessage: (/** @type {import('@playwright/test').Page} */ page) =>
    page.getByText('Account Deleted!'),
  loggedInAs: (
    /** @type {import('@playwright/test').Page} */ page,
    /** @type {string} */ name,
  ) => page.getByText(`Logged in as ${name}`),
};
