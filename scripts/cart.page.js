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
}   