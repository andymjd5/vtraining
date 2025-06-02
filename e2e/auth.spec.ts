import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('shows login page for unauthenticated users', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Connexion' })).toBeVisible();
  });

  test('handles failed login attempt', async ({ page }) => {
    await page.goto('/login');
    
    // Select a company
    await page.getByRole('button', { name: 'FONAREV' }).click();
    
    // Fill in invalid credentials
    await page.getByLabel('Adresse email').fill('invalid@example.com');
    await page.getByLabel('Mot de passe').fill('wrongpassword');
    await page.getByRole('button', { name: 'Se connecter' }).click();
    
    // Check for error message
    await expect(page.getByText('Identifiants incorrects')).toBeVisible();
  });

  test('redirects to appropriate dashboard after successful login', async ({ page }) => {
    await page.goto('/login');
    
    // Select a company
    await page.getByRole('button', { name: 'FONAREV' }).click();
    
    // Fill in valid credentials (use test account)
    await page.getByLabel('Adresse email').fill('student.fonarev@visiontraining.cd');
    await page.getByLabel('Mot de passe').fill('FonarevStudent2024!');
    await page.getByRole('button', { name: 'Se connecter' }).click();
    
    // Check redirect to student dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Tableau de bord')).toBeVisible();
  });

  test('handles logout', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByRole('button', { name: 'FONAREV' }).click();
    await page.getByLabel('Adresse email').fill('student.fonarev@visiontraining.cd');
    await page.getByLabel('Mot de passe').fill('FonarevStudent2024!');
    await page.getByRole('button', { name: 'Se connecter' }).click();
    
    // Perform logout
    await page.getByRole('button', { name: 'Déconnexion' }).click();
    
    // Check redirect to home page
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('link', { name: 'Connexion' })).toBeVisible();
  });
});