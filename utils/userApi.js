import { request as playwrightRequest } from '@playwright/test';
import userData from '../test-data/user.json' with { type: 'json' };

/**
 * Creates a unique user account via the Automation Exercise createAccount API.
 * @param {import('@playwright/test').APIRequestContext} [apiContext] - Playwright request context
 * @param {Record<string, any>} [overrides] - Optional overrides for user properties
 * @returns {Promise<{
 *   name: string,
 *   email: string,
 *   password: string,
 *   wrongPassword: string,
 *   cardNumber: string,
 *   cvv: string,
 *   expirationMonth: string,
 *   expirationYear: string,
 *   address: string,
 *   address2: string,
 *   country: string,
 *   state: string,
 *   city: string,
 *   zipcode: string,
 *   mobile: string,
 *   [key: string]: any
 * }>}
 */
export async function createAccountViaApi(apiContext, overrides = {}) {
  const uniqueId = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  const email = overrides.email || `${userData.emailPrefix || 'user'}.${uniqueId}@example.com`;

  const user = {
    ...userData,
    ...userData.signedin,
    email,
    name: overrides.name || userData.signedin?.name || 'Admin',
    password: overrides.password || userData.signedin?.password || 'Test123',
    wrongPassword: overrides.wrongPassword || userData.signedin?.wrongPassword || 'WrongPassword123',
    ...overrides,
  };

  const formPayload = {
    name: user.name,
    email: user.email,
    password: user.password,
    title: user.title || 'Mrs',
    birth_date: user.dateOfBirth?.day || '6',
    birth_month: user.dateOfBirth?.month || 'March',
    birth_year: user.dateOfBirth?.year || '2000',
    firstname: user.firstName || user.name || 'Admin',
    lastname: user.lastName || 'User',
    company: user.company || 'E-Commerce Test Company',
    address1: user.address || '680 Folsom St',
    address2: user.address2 || '10',
    country: user.country || 'United States',
    zipcode: user.zipcode || '94107',
    state: user.state || 'California',
    city: user.city || 'San Francisco',
    mobile_number: user.mobile || '7456787653',
  };

  const shouldDispose = !apiContext;
  const context = apiContext || await playwrightRequest.newContext({
    baseURL: 'https://automationexercise.com/api/',
  });

  try {
    const response = await context.post('https://automationexercise.com/api/createAccount', {
      form: formPayload,
    });

    const status = response.status();
    const bodyText = await response.text();
    let data;
    try {
      data = JSON.parse(bodyText);
    } catch {
      throw new Error(`createAccount API returned invalid JSON (status: ${status}): ${bodyText}`);
    }

    if (data.responseCode !== 201) {
      throw new Error(`Failed to create account via API: ${bodyText}`);
    }

    return user;
  } finally {
    if (shouldDispose) {
      await context.dispose();
    }
  }
}

/**
 * Deletes a user account via the Automation Exercise deleteAccount API.
 * @param {import('@playwright/test').APIRequestContext} [apiContext]
 * @param {string} email
 * @param {string} password
 */
export async function deleteAccountViaApi(apiContext, email, password) {
  const shouldDispose = !apiContext;
  const context = apiContext || await playwrightRequest.newContext({
    baseURL: 'https://automationexercise.com/api/',
  });

  try {
    const response = await context.delete('https://automationexercise.com/api/deleteAccount', {
      form: { email, password },
    });
    return await response.json();
  } finally {
    if (shouldDispose) {
      await context.dispose();
    }
  }
}

