// @ts-check
import { test, expect } from '@playwright/test';
import { AccountInformationPage } from '../../scripts/account-information.page';
import { AccountPage } from '../../scripts/account.page';
import { HomePage } from '../../scripts/home.page';
import { LoginPage } from '../../scripts/login.page';
import userData from '../../test-data/user.json' with { type: 'json' };

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
    await HomePage.acceptAlert(page);
    await expect(page.getByText('Success! Your details have been submitted successfully.')).toBeVisible();
    await HomePage.clickHomeButton(page);
    await expect(page).toHaveURL(/automationexercise\.com/);
});


