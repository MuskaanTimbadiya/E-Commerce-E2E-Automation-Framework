import { expect } from '@playwright/test';
import cartLocators from '../pages/cart.json' with { type: 'json' };

export class cartPage {
    static async verifyCartPage(page) {
        await expect(page).toHaveURL(/view_cart/);
        await expect(page.locator(cartLocators.cartPageTitle)).toBeVisible();
    }
    static async verifyProductInCart(page, productName) {
        const selector = productName 
            ? cartLocators.cartProductName.replace('{productName}', productName)
            : cartLocators.cartTable;
        const productCard = page.locator(selector);
        await expect(productCard).toBeVisible();
    }
    static async verifyProductQuantityInCart(page, productName, expectedQuantity) {
        const quantityElement = page.locator(cartLocators.cartProductQuantity);
        const actualQuantity = await quantityElement.textContent();
        expect(actualQuantity.trim()).toBe(expectedQuantity.toString());
    }
    static async proceedToCheckout(page) {
        await page.locator(cartLocators.proceedToCheckoutButton).click();
    }
    static async clickRegisterLoginLink(page) {
        await page.locator(cartLocators.registerLoginLink).click();
    }
    static async placeOrder(page, user) {
        await page.locator(cartLocators.placeOrderButton).click();
        await page.locator(cartLocators.nameInput).fill(user.name);
        await page.locator(cartLocators.cardNumberInput).fill(user.cardNumber);
        await page.locator(cartLocators.cvvInput).fill(user.cvv);
        await page.locator(cartLocators.expirationDateInput).fill(user.expirationMonth);
        await page.locator(cartLocators.expirationYearInput).fill(user.expirationYear);
        await page.locator(cartLocators.submitOrderButton).click();
    }
    static async orderPlacedMessage(page) {
        return page.locator(cartLocators.orderPlacedMessage).first();
    }
    static async removeProductFromCart(page, productName) {
        const deleteButton = page.locator(cartLocators.removeProductButton.replace('{productName}', productName));
        await Promise.all([
            page.waitForResponse(response => response.url().includes('/delete_cart/') && response.status() === 200),
            deleteButton.click()
        ]);
        const productRow = page.locator(cartLocators.cartProductName.replace('{productName}', productName));
        await expect(productRow).not.toBeVisible();
    }
    static async verifyAddressDetailsInCheckout(page, user) {
        const addressEl = page.locator(cartLocators.addressDetails).first();
        await expect(addressEl).toContainText(user.address);
        await expect(addressEl).toContainText(user.city);
        await expect(addressEl).toContainText(user.state);
        await expect(addressEl).toContainText(user.zipcode);
    }
}
