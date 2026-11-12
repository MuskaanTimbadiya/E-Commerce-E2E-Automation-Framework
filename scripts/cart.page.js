import { expect } from '@playwright/test';
import { cartLocators } from '../pages/cart.locators.js';

export class cartPage {
    static async verifyCartPage(page) {
        await expect(page).toHaveURL(/view_cart/);
        await expect(cartLocators.cartPageTitle(page)).toBeVisible();
    }
    static async verifyProductInCart(page, productName) {
        const productCard = cartLocators.cartProductName(page, productName);
        await expect(productCard).toBeVisible();
    }
    static async verifyProductQuantityInCart(page, productName, expectedQuantity) {
        const quantityElement = cartLocators.cartProductQuantity(page, productName);
        const actualQuantity = await quantityElement.textContent();
        expect(actualQuantity.trim()).toBe(expectedQuantity.toString());
    }
    static async proceedToCheckout(page) {
        await cartLocators.proceedToCheckoutButton(page).click();
    }
    static async clickRegisterLoginLink(page) {
        await cartLocators.registerLoginLink(page).click();
    }
    static async placeOrder(page,user) {
        await cartLocators.placeOrderButton(page).click();
        await cartLocators.nameInput(page).fill(user.name);
        await cartLocators.cardNumberInput(page).fill(user.cardNumber);
        await cartLocators.cvvInput(page).fill(user.cvv);
        await cartLocators.expirationDateInput(page).fill(user.expirationMonth);
        await cartLocators.expirationYearInput(page).fill(user.expirationYear);
        await cartLocators.submitOrderButton(page).click();
    }
    static async orderPlacedMessage(page) {
        return page.getByText('Congratulations! Your order has been confirmed!').first();
    }
    static async removeProductFromCart(page, productName) {
        const deleteButton = cartLocators.removeProductButton(page, productName);
        await Promise.all([
        page.waitForResponse(response => response.url().includes('/delete_cart/') && response.status() === 200),
        deleteButton.click()
        ]);
        const productRow = cartLocators.cartProductName(page, productName);
        await expect(productRow).not.toBeVisible();
    }

}   