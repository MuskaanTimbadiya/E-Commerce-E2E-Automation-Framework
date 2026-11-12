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

test('User can place order while registering from checkout page', async ({ page }) => {
  const user = {
    ...userData,
    email: `${userData.emailPrefix}.${Date.now()}@example.com`,
  };
  await HomePage.clickProductsLink(page);
  await expect(page).toHaveURL(/products/);
  await ProductsPage.addProductToCart(page, Products.searchProduct.name);
  await HomePage.clickCartButton(page);
  await expect(page).toHaveURL(/view_cart/);
  await cartPage.verifyCartPage(page);
  await cartPage.verifyProductInCart(page, Products.searchProduct.name);
  await cartPage.proceedToCheckout(page);
  await cartPage.clickRegisterLoginLink(page);
  await LoginPage.signup(page, user.name, user.email);
  await LoginPage.verifySignupForm(page);
  await AccountInformationPage.completeAccountDetails(page, user);

  await expect(AccountPage.accountCreatedMessage(page)).toBeVisible();
  await AccountPage.continue(page);
  await expect(AccountPage.loggedInAs(page, user.name)).toBeVisible();
  await HomePage.clickCartButton(page);
  await cartPage.proceedToCheckout(page);
  await cartPage.placeOrder(page, user);
  await expect(cartPage.orderPlacedMessage(page)).toBeVisible();
  await AccountPage.deleteAccount(page);
  await expect(AccountPage.accountDeletedMessage(page)).toBeVisible();
  await AccountPage.continue(page);
  await expect(page).toHaveURL(/automationexercise\.com/);

});

test('User can place order after registering', async ({ page }) => {
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
    await HomePage.clickProductsLink(page);
    await expect(page).toHaveURL(/products/);
    await ProductsPage.addProductToCart(page, Products.searchProduct.name);
    await HomePage.clickCartButton(page);
    await expect(page).toHaveURL(/view_cart/);
    await cartPage.verifyCartPage(page);
    await cartPage.verifyProductInCart(page, Products.searchProduct.name);
    await cartPage.proceedToCheckout(page);
    await cartPage.placeOrder(page, user);
    await AccountPage.deleteAccount(page);
    await expect(AccountPage.accountDeletedMessage(page)).toBeVisible();
    await AccountPage.continue(page);
    await expect(page).toHaveURL(/automationexercise\.com/);
});

test('User can login before checkout and place order', async ({ page }) => {
    const user = userData.signedin; 
    await HomePage.openSignupLogin(page);
    await LoginPage.login(page, user.email, user.password);
    await expect(AccountPage.loggedInAs(page, user.name)).toBeVisible();
    await HomePage.clickProductsLink(page);
    await expect(page).toHaveURL(/products/);
    await ProductsPage.addProductToCart(page, Products.searchProduct.name);
    await HomePage.clickCartButton(page);
    await expect(page).toHaveURL(/view_cart/);
    await cartPage.verifyCartPage(page);
    await cartPage.verifyProductInCart(page, Products.searchProduct.name);
    await cartPage.proceedToCheckout(page);
    await cartPage.placeOrder(page, user);
    await AccountPage.deleteAccount(page);
    await expect(AccountPage.accountDeletedMessage(page)).toBeVisible();
    await AccountPage.continue(page);
    await expect(page).toHaveURL(/automationexercise\.com/);
});

