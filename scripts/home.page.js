import { expect } from '@playwright/test';
import homeLocators from '../pages/home.json' with { type: 'json' };

export class HomePage {
  static async openSignupLogin(page) {
    await page.locator(homeLocators.signupLoginLink).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator(homeLocators.newUserSignupHeader)).toBeVisible();
  }

  static async clickContactUsLink(page) {
    await page.locator(homeLocators.contactUsLink).click();
    await expect(page).toHaveURL(/\/contact_us/);
  }

  static async fillContactUsForm(page, contactData) {
    await page.locator(homeLocators.contactNameInput).fill(contactData.name);
    await page.locator(homeLocators.contactEmailInput).first().fill(contactData.email);
    await page.locator(homeLocators.contactSubjectInput).fill(contactData.subject);
    await page.locator(homeLocators.contactMessageTextarea).fill(contactData.message);
  }

  static async submitContactUsForm(page) {
    await page.locator(homeLocators.contactSubmitButton).click();
    await page.on('dialog', async (dialog) => {
      await dialog.accept();
    });
  }

  static async verifyContactFormSubmission(page) {
    await expect(page.locator(homeLocators.contactSuccessMessage)).toBeVisible();
  }

  static async clickHomeButton(page) {
    await page.locator(homeLocators.homeButton).click();
    await expect(page).toHaveURL(/automationexercise\.com/);
  }

  static async clickTestCasesLink(page) {
    await page.locator(homeLocators.testCasesLink).first().click();
    await expect(page).toHaveURL(/test_cases/);
  }

  static async clickProductsLink(page) {
    await page.locator(homeLocators.productsLink).click();
    await expect(page).toHaveURL(/products/);
  }
  
  static async clickViewProductButton(page) {
    await page.locator(homeLocators.viewProductButton).first().click();
    await expect(page).toHaveURL(/product_details\/1/);
  }

  static async scrollToFooter(page) {
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
  }

  static async verifySubscriptionSection(page) {
    await expect(page.locator(homeLocators.subscriptionSection)).toBeVisible();
  }

  static async subscribeToNewsletter(page, email) {
    await page.locator(homeLocators.subscriptionEmailInput).fill(email);
    await page.locator(homeLocators.subscriptionSubmitButton).click();
    await expect(page.locator(homeLocators.subscriptionSuccessMessage)).toBeVisible();
  }

  static async clickCartButton(page) {
    await page.locator(homeLocators.cartButton).last().click();
    await expect(page).toHaveURL(/view_cart/);
  }

  static async clickCategoryLink(page, categoryName) {
    await page.locator(homeLocators.categoryLink.replace('{categoryName}', categoryName)).click();
  }

  static async verifyCategoryProductsPage(page, categoryName) {
    await expect(page.locator(homeLocators.categoryProductsTitle.replace('{categoryName}', categoryName))).toBeVisible();
  }

  static async clickSubCategoryLink(page, subCategoryName) {
    await page.locator(homeLocators.subCategoryLink.replace('{subCategoryName}', subCategoryName)).first().click();
    await expect(page).toHaveURL(/category_products\/\d+/);
  }

  static async navigateToBrandsSection(page) {
    const brandsEl = page.locator(homeLocators.brandsHeading);
    await brandsEl.scrollIntoViewIfNeeded();
    await expect(brandsEl).toBeVisible();
  }

  static async clickBrandLink(page, brandName) {
    await page.locator(homeLocators.brandLink.replace('{brandName}', brandName)).click();
    await expect(page).toHaveURL(new RegExp(`/brand_products/${brandName}`));
  }

  static async verifyBrandProductsPage(page, brandName) {
    await expect(page.locator(homeLocators.brandProductsTitle.replace('{brandName}', brandName))).toBeVisible();
  }

  static async scrollToRecommendedItemsSection(page) {
    const recEl = page.locator(homeLocators.recommendedItemsSection);
    await recEl.scrollIntoViewIfNeeded();
    await expect(recEl).toBeVisible();
  }

  static async clickRecommendedItemViewProductButton(page) {
    await page.locator(homeLocators.recommendedItemViewProductButton).first().click();
    await expect(page).toHaveURL(/product_details\/\d+/);
  }

  static async clickRecommendedItemAddToCartButton(page) {
    await page.locator(homeLocators.recommendedItemAddToCartButton).first().click();
  }

  static async clickViewCartButtonFromModal(page) {
    const modal = page.locator(homeLocators.cartModal);
    await expect(modal).toBeVisible();
    await page.locator(homeLocators.cartModalViewCartButton).click();
  }

  static async scrollToTopWithArrowButtons(page) {
    await page.evaluate(() => { window.scrollTo(0, document.body.scrollHeight); });
    await expect(page.locator(homeLocators.upwardArrowButton)).toBeVisible();
    await page.locator(homeLocators.upwardArrowButton).click();
  }
}
