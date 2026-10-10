// @ts-check
import { test, expect } from '@playwright/test';
import { AccountInformationPage } from '../../scripts/account-information.page';
import { AccountPage } from '../../scripts/account.page';
import { HomePage } from '../../scripts/home.page';
import { LoginPage } from '../../scripts/login.page';
import userData from '../../test-data/user.json' with { type: 'json' };
import Products from '../../test-data/products.json' with { type: 'json' };
import { ProductsPage } from '../../scripts/productDetails.page';
import { cartPage } from '../../scripts/cart.page';

test.beforeEach(async ({ page }, testInfo) => {
  await page.goto('https://www.automationexercise.com/');
  await expect(page).toHaveURL(/automationexercise\.com/);
});

test.afterEach(async ({ page }, testInfo) => {
  await page.close();
});

test('user can register and delete an account', async ({ page }) => {
  const user = {
    ...userData,
    email: `${userData.emailPrefix}.${Date.now()}@example.com`,
  };
  await HomePage.openSignupLogin(page);
  await LoginPage.signup(page, user.name, user.email);
  await LoginPage.verifySignupForm(page);
  await AccountInformationPage.completeAccountDetails(page, user);

  await expect(AccountPage.accountCreatedMessage(page)).toBeVisible();
  await AccountPage.continue(page);
  await expect(AccountPage.loggedInAs(page, user.name)).toBeVisible();

  await AccountPage.deleteAccount(page);
  await expect(AccountPage.accountDeletedMessage(page)).toBeVisible();
  await AccountPage.continue(page);
  await expect(page).toHaveURL(/automationexercise\.com/);
});

test('User can login with valid credentials', async ({ page }) => {
  const user = userData.signedin;
  await HomePage.openSignupLogin(page);
  await LoginPage.login(page, user.email, user.password);
  await expect(AccountPage.loggedInAs(page, user.name)).toBeVisible();
  await AccountPage.logout(page);
  await expect(page).toHaveURL(/login/);
});

test('User cannot login with invalid credentials', async ({ page }) => {
  const user = userData.signedin;
  await HomePage.openSignupLogin(page);
  await LoginPage.login(page, user.email, user.wrongPassword);
  await expect(page.getByText('Your email or password is incorrect!')).toBeVisible();
});

test('User cannot create an account with an already registered email', async ({ page }) => {
  const user = userData.signedin;
  await HomePage.openSignupLogin(page);
  await LoginPage.signup(page, user.name, user.email);
  await expect(page.getByText('Email Address already exist!')).toBeVisible();
});

test('Contact US form can be submitted successfully', async ({ page }) => {
   await HomePage.clickContactUsLink(page);
    await expect(page).toHaveURL(/contact_us/);
    await expect(page.getByText('Get In Touch')).toBeVisible();
    await HomePage.fillContactUsForm(page, userData.contactUs);
    await HomePage.submitContactUsForm(page);
    await expect(page.getByText('Success! Your details have been submitted successfully.')).toBeVisible();
    await HomePage.clickHomeButton(page);
    await expect(page).toHaveURL(/automationexercise\.com/);
});

test('Verify testcases page', async ({ page }) => {
  await HomePage.clickTestCasesLink(page);
  await expect(page).toHaveTitle('Automation Practice Website for UI Testing - Test Cases');
});

test('Verify all products and product detail page', async ({ page }) => {
  await HomePage.clickProductsLink(page);
  await expect(page).toHaveURL(/products/);
  await expect(page.getByText('All Products')).toBeVisible();
  await HomePage.clickViewProductButton(page);
  await expect(page).toHaveURL(/product_details\/1/);
  await ProductsPage.verifyProductDetails(page);
});

test('Search product and verify that product detail is visible', async ({ page }) => {
  await HomePage.clickProductsLink(page);
  await expect(page).toHaveURL(/products/);
  await expect(page.getByText('All Products')).toBeVisible();
  await ProductsPage.searchProduct(page, Products.searchProduct.name);
  await ProductsPage.verifySearchedProducts(page, Products.searchProduct.name);
});

test('Verify Subscription in home page', async ({ page }) => {
  await HomePage.scrollToFooter(page);
  await HomePage.verifySubscriptionSection(page);
  await HomePage.subscribeToNewsletter(page, userData.subscription.email);
});

test('Verify Subscription in cart page', async ({ page }) => {
  await HomePage.clickCartButton(page);
  await HomePage.scrollToFooter(page);
  await HomePage.verifySubscriptionSection(page);
  await HomePage.subscribeToNewsletter(page, userData.subscription.email);
});

test('Add products to cart and verify that they are added', async ({ page }) => {
  await HomePage.clickProductsLink(page);
  await expect(page).toHaveURL(/products/);
  await expect(page.getByText('All Products')).toBeVisible();
  await ProductsPage.addProductToCart(page, Products.searchProduct.name);
  await HomePage.clickCartButton(page);
  await expect(page).toHaveURL(/view_cart/);
  await cartPage.verifyCartPage(page);
  await cartPage.verifyProductInCart(page, Products.searchProduct.name);
});

test('Verify product quantity in cart', async ({ page }) => {
  await HomePage.clickProductsLink(page);
  await expect(page).toHaveURL(/products/);
  await expect(page.getByText('All Products')).toBeVisible();
  await HomePage.clickViewProductButton(page);
  await ProductsPage.increaseProductQuantity(page, 4);
  await ProductsPage.clickaddToCart(page);
  await HomePage.clickCartButton(page);
  await expect(page).toHaveURL(/view_cart/);
  await cartPage.verifyCartPage(page);
  await cartPage.verifyProductInCart(page, Products.searchProduct.name);
  await cartPage.verifyProductQuantityInCart(page, Products.searchProduct.name, 4);
});

