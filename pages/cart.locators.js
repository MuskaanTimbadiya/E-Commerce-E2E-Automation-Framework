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
    proceedToCheckoutButton: (/** @type {import('@playwright/test').Page} */ page) =>
        page.locator('.btn.btn-default.check_out').filter({ hasText: 'Proceed To Checkout' }),
    registerLoginLink: (/** @type {import('@playwright/test').Page} */ page) =>
        page.getByRole('link', { name: 'Register / Login' }),
    placeOrderButton: (/** @type {import('@playwright/test').Page} */ page) =>
        page.locator('.btn.btn-default.check_out').filter({ hasText: 'Place Order' }),
    nameInput: (/** @type {import('@playwright/test').Page} */ page) =>
        page.locator('input[name="name_on_card"]'),
    cardNumberInput: (/** @type {import('@playwright/test').Page} */ page) =>
        page.locator('input[name="card_number"]'),
    cvvInput: (/** @type {import('@playwright/test').Page} */ page) =>
        page.locator('input[name="cvc"]'),
    expirationDateInput: (/** @type {import('@playwright/test').Page} */ page) =>
        page.locator('input[name="expiry_month"]'),
    expirationYearInput: (/** @type {import('@playwright/test').Page} */ page) =>
        page.locator('input[name="expiry_year"]'),
    submitOrderButton: (/** @type {import('@playwright/test').Page} */ page) =>
        page.getByRole('button', { name: 'Pay and Confirm Order' }),
    removeProductButton: (/** @type {import('@playwright/test').Page} */ page, productName) =>
        page.locator('tr').filter({ hasText: productName }).locator('a.cart_quantity_delete'),  
};  