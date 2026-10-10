import { expect } from '@playwright/test';

export class ProductsPage {
  static async verifyProductDetails(page) {
    await expect(page.locator('.product-information')).toBeVisible();
    await expect(page.getByText('Category:')).toBeVisible();
    await expect(page.locator('.product-information span span')).toBeVisible();
    await expect(page.getByText('Availability:')).toBeVisible();
    await expect(page.getByText('Condition:')).toBeVisible();
    await expect(page.getByText('Brand:')).toBeVisible();
  }
  static async searchProduct(page, productName) {
    await page.fill('#search_product', productName);
    await page.click('#submit_search');
  }
  
  static async verifySearchedProducts(page, productName) {
    await expect(page.getByText('Searched Products')).toBeVisible();
    await expect(page.locator('.productinfo')).toContainText(productName);
  }

  static async addProductToCart(page, productName) {
    await this.searchProduct(page, productName);
    await this.verifySearchedProducts(page, productName);
    await this.clickaddToCartButton(page, productName);
  }

  static async clickaddToCartButton(page, productName) {
    const productCard = page.locator('.productinfo').filter({ hasText: productName });
    await productCard.locator('a').click();
    await expect(page.getByText('Added!')).toBeVisible();
  }

  static async clickaddToCart(page) {
    await page.locator('.fa.fa-shopping-cart').last().click();
    await expect(page.getByText('Added!')).toBeVisible();
  }

  static async increaseProductQuantity(page, quantity) {
    const quantityInput = page.locator('#quantity');
    await quantityInput.fill(quantity.toString());
  } 
}   