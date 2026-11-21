import { expect } from '@playwright/test';
import productDetailsLocators from '../pages/productDetails.json' with { type: 'json' };

export class ProductsPage {
  static async verifyProductDetails(page) {
    await expect(page.locator(productDetailsLocators.productInformation)).toBeVisible();
    await expect(page.locator(productDetailsLocators.categoryText)).toBeVisible();
    await expect(page.locator(productDetailsLocators.productPrice)).toBeVisible();
    await expect(page.locator(productDetailsLocators.availabilityText)).toBeVisible();
    await expect(page.locator(productDetailsLocators.conditionText)).toBeVisible();
    await expect(page.locator(productDetailsLocators.brandText)).toBeVisible();
  }

  static async searchProduct(page, productName) {
    await page.locator(productDetailsLocators.searchInput).fill(productName);
    await page.locator(productDetailsLocators.searchButton).click();
  }
  
  static async verifySearchedProducts(page, productName) {
    await expect(page.locator(productDetailsLocators.searchedProductsTitle)).toBeVisible();
    await expect(page.locator(productDetailsLocators.productInfo)).toContainText(productName);
  }

  static async addProductToCart(page, productName) {
    await this.searchProduct(page, productName);
    await this.verifySearchedProducts(page, productName);
    await this.clickaddToCartButton(page, productName);
  }

  static async clickaddToCartButton(page, productName) {
    const productCard = page.locator(productDetailsLocators.productCard.replace('{productName}', productName));
    await productCard.locator('a').click();
    await expect(page.locator(productDetailsLocators.addedModalMessage)).toBeVisible();
  }

  static async clickaddToCart(page) {
    await page.locator(productDetailsLocators.cartIconAddToCartButton).last().click();
    await expect(page.locator(productDetailsLocators.addedModalMessage)).toBeVisible();
  }

  static async increaseProductQuantity(page, quantity) {
    const quantityInput = page.locator(productDetailsLocators.quantityInput);
    await quantityInput.fill(quantity.toString());
  } 

  static async addReview(page, reviewData) {
    await page.locator(productDetailsLocators.reviewNameInput).fill(reviewData.name);
    await page.locator(productDetailsLocators.reviewEmailInput).first().fill(reviewData.email);
    await page.locator(productDetailsLocators.reviewTextInput).fill(reviewData.review);
    await page.locator(productDetailsLocators.reviewSubmitButton).click();
    await expect(page.locator(productDetailsLocators.reviewSuccessMessage)).toBeVisible();
  }
}
