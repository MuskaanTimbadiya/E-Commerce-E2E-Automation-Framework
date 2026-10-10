export const cartLocators = {
    cartButton: (/** @type {import('@playwright/test').Page} */ page) =>
        page.getByRole('link', { name: 'Cart' }),
    cartPageTitle: (/** @type {import('@playwright/test').Page} */ page) =>
        page.getByText('Shopping Cart'),
    cartProductName: (/** @type {import('@playwright/test').Page} */ page, productName) =>
        page.locator('.cart_info').filter({ hasText: productName }),
    cartProductQuantity: (/** @type {import('@playwright/test').Page} */ page, productName) =>
        page.locator('#product-1').locator('.cart_price p'),
    cartProductPrice: (/** @type {import('@playwright/test').Page} */ page, productName) =>
        page.locator('.cart_info').filter({ hasText: productName }).locator('td').nth(3),
};  