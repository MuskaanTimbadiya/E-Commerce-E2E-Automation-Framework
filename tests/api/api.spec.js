import { test, expect, request } from '@playwright/test';

test.describe.serial('API Tests', () => {
  let apiContext;
  const email = `testuser_${Date.now()}@example.com`;
  const password = 'password123';

  test.beforeAll(async () => {
    apiContext = await request.newContext({
      baseURL: 'https://automationexercise.com/api/',
    });
  });

  test.afterAll(async () => {
    if (apiContext) {
      await apiContext.dispose();
    }
  });

  test('GET all products list', async () => {
    const response = await apiContext.get('productsList');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.responseCode).toBe(200);
    expect(Array.isArray(data.products)).toBe(true);
    expect(data.products.length).toBeGreaterThan(0);
  });

  test('Post all products list', async () => {
    const response = await apiContext.post('productsList');
    expect(response.status()).toBe(200);
    expect(await response.text()).toContain('This request method is not supported.');
  });

  test('GET all brands list', async () => {
    const response = await apiContext.get('brandsList');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.responseCode).toBe(200);
    expect(Array.isArray(data.brands)).toBe(true);
    expect(data.brands.length).toBeGreaterThan(0);
  });

  test('Put all brands list', async () => {
    const response = await apiContext.put('brandsList');
    expect(response.status()).toBe(200);
    expect(await response.text()).toContain('This request method is not supported.');
  });

  test('Post to search products', async () => {
    const response = await apiContext.post('searchProduct', {
      form: {
        search_product: 'top',
      },
    });
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.responseCode).toBe(200);
    expect(Array.isArray(data.products)).toBe(true);
    expect(data.products.length).toBeGreaterThan(0);
  });

  test('Post to search products without search term', async () => {
    const response = await apiContext.post('searchProduct');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.responseCode).toBe(400);
    expect(data.message).toBe('Bad request, search_product parameter is missing in POST request.');
  });

  test('Post to create account API with valid credentials', async () => {
    const response = await apiContext.post('createAccount', {
      form: {
        name: 'Test User',
        email: email,
        password: password,
        title: 'Mr',
        birth_date: '15',
        birth_month: 'June',
        birth_year: '1990',
        firstname: 'Test',
        lastname: 'User',
        company: 'Example Inc',
        address1: '123 Main St',
        address2: 'Apt 4B',
        country: 'United States',
        zipcode: '90210',
        state: 'California',
        city: 'Los Angeles',
        mobile_number: '+11234567890',
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.responseCode).toBe(201);
    expect(data.message).toBe('User created!');
  });

  test('Verify login API with valid credentials', async () => {
    const response = await apiContext.post('verifyLogin', {
      form: {
        email: email,
        password: password,
      },
    });
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.responseCode).toBe(200);
    expect(data.message).toBe('User exists!');
  });

  test('Verify login API without Password', async () => {
    const response = await apiContext.post('verifyLogin', {
      form: {
        email: email,
      },
    });
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.responseCode).toBe(400);
    expect(data.message).toBe('Bad request, email or password parameter is missing in POST request.');
  });

  test('Delete to verify login API', async () => {
    const response = await apiContext.delete('verifyLogin');
    expect(response.status()).toBe(200);
    expect(await response.text()).toContain('This request method is not supported.');
  });

  test('Post to verify login API with invalid credentials', async () => {
    const response = await apiContext.post('verifyLogin', {
      form: {
        email: `invalid_${Date.now()}@example.com`,
        password: 'WrongPassword123',
      },
    });
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.responseCode).toBe(404);
    expect(data.message).toBe('User not found!');
  });

  test('Get User details by email', async () => {
    const response = await apiContext.get('getUserDetailByEmail', {
      params: {
        email: email,
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.responseCode).toBe(200);
    expect(data.user).toBeDefined();
    expect(data.user.email.toLowerCase()).toBe(email.toLowerCase());
  });

  test('Put to update user account', async () => {
    const response = await apiContext.put('updateAccount', {
      form: {
        name: 'Updated Test User',
        email: email,
        password: password,
        title: 'Mr',
        birth_date: '15',
        birth_month: 'June',
        birth_year: '1990',
        firstname: 'Updated',
        lastname: 'User',
        company: 'Example Inc',
        address1: '456 New St',
        address2: 'Apt 2B',
        country: 'United States',
        zipcode: '90210',
        state: 'California',
        city: 'Los Angeles',
        mobile_number: '+11234567890',
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.responseCode).toBe(200);
    expect(data.message).toBe('User updated!');
  });

  test('Delete an account with valid credentials', async () => {
    const response = await apiContext.delete('deleteAccount', {
      form: {
        email: email,
        password: password,
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.responseCode).toBe(200);
    expect(data.message).toBe('Account deleted!');
  });
});
