import { expect } from '@playwright/test';
import { homeLocators } from '../pages/home.locators.js';

export class HomePage {
  static async openSignupLogin(page) {
    await homeLocators.signupLoginLink(page).click();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText('New User Signup!')).toBeVisible();
  }

  static async clickContactUsLink(page) {
    await homeLocators.contactUsLink(page).click();
    await expect(page).toHaveURL(/\/contact_us/);
  }

  static async fillContactUsForm(page, contactData) {
    await homeLocators.contactNameInput(page).fill(contactData.name);
    await homeLocators.contactEmailInput(page).fill(contactData.email);
    await homeLocators.contactSubjectInput(page).fill(contactData.subject);
    await homeLocators.contactMessageTextarea(page).fill(contactData.message);
  }

  static async submitContactUsForm(page) {
    await homeLocators.contactSubmitButton(page).click();
    await page.on('dialog', async (dialog) => {
      await dialog.accept();
    });
  }

  static async verifyContactFormSubmission(page) {
    await expect(page.getByText('Success! Your details have been submitted successfully.')).toBeVisible();
  }

  static async clickHomeButton(page) {
    await homeLocators.homeButton(page).click();
    await expect(page).toHaveURL(/automationexercise\.com/);
  }

  static async clickTestCasesLink(page) {
    await homeLocators.testCasesLink(page).click();
    await expect(page).toHaveURL(/test_cases/);
  }
  static async clickProductsLink(page) {
    await homeLocators.productsLink(page).click();
    await expect(page).toHaveURL(/products/);
  }
  
  static async clickViewProductButton(page) {
    await homeLocators.viewProductButton(page).click();
    await expect(page).toHaveURL(/product_details\/1/);
  }

  static async scrollToFooter(page) {
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
  }

  static async verifySubscriptionSection(page) {
    await expect(homeLocators.subscriptionSection(page)).toBeVisible();
  }

  static async subscribeToNewsletter(page, email) {
    await homeLocators.subscriptionEmailInput(page).fill(email);
    await homeLocators.subscriptionSubmitButton(page).click();
    await expect(homeLocators.subscriptionSuccessMessage(page)).toBeVisible();
  }

  static async clickCartButton(page) {
    await homeLocators.cartButton(page).last().click();
    await expect(page).toHaveURL(/view_cart/);
  }

  static async clickCategoryLink(page, categoryName) {
    await page.locator(`.category-products a:text-is("${categoryName}")`).click();
  }
  static async verifyCategoryProductsPage(page, categoryName) {
    await expect(page.getByText(`Category - ${categoryName}`)).toBeVisible();
  }
  static async clickSubCategoryLink(page, subCategoryName) {
    await page.getByRole('link', { name: subCategoryName }).first().click();
    await expect(page).toHaveURL(/category_products\/\d+/);
  }

  static async navigateToBrandsSection(page) {
    await page.locator('.brands_products h2:text-is("Brands")').scrollIntoViewIfNeeded();
    await expect(page.locator('.brands_products h2:text-is("Brands")')).toBeVisible();
  }
  static async clickBrandLink(page, brandName) {
    await page.getByRole('link', { name: brandName }).click();
    await expect(page).toHaveURL(new RegExp(`/brand_products/${brandName}`));
  }
  static async verifyBrandProductsPage(page, brandName) {
    await expect(page.getByText(`Brand - ${brandName}`)).toBeVisible();
  }
  static async scrollToRecommendedItemsSection(page) {
    await page.locator('#recommended-item-carousel').scrollIntoViewIfNeeded();
    await expect(page.locator('#recommended-item-carousel')).toBeVisible();
  }
  static async clickRecommendedItemViewProductButton(page) {
    const recommendedItem = page.locator('#recommended-item-carousel .item').first();
    await recommendedItem.locator('a:has-text("View Product")').click();
    await expect(page).toHaveURL(/product_details\/\d+/);
  }
  static async clickRecommendedItemAddToCartButton(page) {
    const recommendedItem = page.locator('#recommended-item-carousel .item').first();
    await recommendedItem.locator('a:has-text("Add to cart")').click();
    await expect(page).toHaveURL(/view_cart/);
  }
}

