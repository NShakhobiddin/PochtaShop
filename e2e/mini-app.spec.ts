import { test, expect, type Page } from '@playwright/test';

/**
 * Covers the acceptance scenarios end to end against the demo data set.
 * Onboarding is dismissed up front so each test starts on the home screen.
 */
async function skipOnboarding(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('pochtashop.onboarding.completed', 'true');
  });
}

test.describe('PochtaShop Mini App', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page);
  });

  test('1. a Telegram user opens the app and sees the home screen', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByPlaceholder(/Mahsulot nomini yozing/)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Mahsulot topish' })).toBeVisible();
    await expect(page.getByRole('heading', { name: "O'rganish" })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Xarajatni hisoblash' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Bojxona xavfi' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Asosiy navigatsiya' })).toBeVisible();
  });

  test('2-4. searching by name returns three recommendations', async ({ page }) => {
    await page.goto('/');

    await page.getByPlaceholder(/Mahsulot nomini yozing/).fill('quloqchin');
    await page.getByPlaceholder(/Mahsulot nomini yozing/).press('Enter');

    await expect(page).toHaveURL(/\/search\?q=/);
    await expect(page.getByText(/ta tavsiya/)).toBeVisible({ timeout: 20_000 });

    await expect(page.getByText('Eng arzon').first()).toBeVisible();
    await expect(page.getByText('Eng tez').first()).toBeVisible();
    await expect(page.getByText('Eng ishonchli').first()).toBeVisible();

    // Confidence is always shown together with its reason.
    await expect(page.getByText(/ishonchlilik/i).first()).toBeVisible();
  });

  test('5. recommendations can be compared side by side', async ({ page }) => {
    await page.goto('/search?q=quloqchin');
    await expect(page.getByText(/ta tavsiya/)).toBeVisible({ timeout: 20_000 });

    const addButtons = page.getByRole('button', { name: /Taqqoslashga qo/ });
    await addButtons.nth(0).click();
    await addButtons.nth(0).click();

    await page.getByRole('button', { name: /Taqqoslashni ochish/ }).click();
    await expect(page.getByRole('dialog', { name: 'Taqqoslash' })).toBeVisible();
    await expect(page.getByRole('rowheader', { name: 'Bojxona xavfi' })).toBeVisible();
  });

  test('6. couriers can be filtered and compared', async ({ page }) => {
    await page.goto('/couriers');

    await expect(page.getByRole('heading', { name: 'Kuryerlar' })).toBeVisible();
    await page.getByRole('button', { name: 'Eng tez' }).click();

    const addButtons = page.getByRole('button', { name: /Taqqoslashga qo/ });
    await addButtons.nth(0).click();
    await addButtons.nth(1).click();

    await page.getByRole('button', { name: /Kuryerni tanlash/ }).click();
    await expect(page.getByRole('dialog', { name: 'Kuryerlarni taqqoslash' })).toBeVisible();
    await expect(page.getByRole('rowheader', { name: "Hajmiy og'irlik" })).toBeVisible();
  });

  test('7. volumetric weight is calculated on the courier page', async ({ page }) => {
    await page.goto('/couriers/fast-cargo');

    await expect(page.getByRole('heading', { name: "Hajmiy og'irlik kalkulyatori" })).toBeVisible();

    await page.getByLabel('Uzunlik (sm)').fill('60');
    await page.getByLabel('Kenglik (sm)').fill('40');
    await page.getByLabel('Balandlik (sm)').fill('30');
    await page.getByLabel("Haqiqiy og'irlik (kg)").fill('2');

    // 60*40*30/6000 = 12kg, which exceeds the 2kg actual weight.
    await expect(page.getByText('12 kg').first()).toBeVisible();
    await expect(page.getByText(/hajmiy og'irlik kattaroq/i)).toBeVisible();
  });

  test('8. the customs calculator produces a total with a disclaimer', async ({ page }) => {
    await page.goto('/calculator');

    await page.getByLabel('Bir dona qiymati').fill('500');
    await page.getByRole('button', { name: 'Keyingi bosqich' }).click();
    await page.getByRole('button', { name: 'Hisoblash' }).click();

    await expect(page.getByText('Jami taxminiy xarajat')).toBeVisible();
    await expect(page.getByText('Bojxona boji', { exact: true })).toBeVisible();
    await expect(page.getByText(/Hisob-kitob taxminiy/)).toBeVisible();
    await expect(page.getByText(/Huquqiy manba/)).toBeVisible();
  });

  test('9. customs risk is reported as green, yellow or red', async ({ page }) => {
    await page.goto('/customs/risk');

    await page.getByLabel('Tovar nomi').fill('Powerbank 20000 mAh');
    await page.getByRole('button', { name: 'Xavfni tekshirish' }).click();

    await expect(page.getByRole('heading', { name: 'Asosiy sabablar' })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText(/Xavf ballari/)).toBeVisible();
    // The level is conveyed by text, never by colour alone.
    await expect(page.getByText(/Yashil|Sariq|Qizil/).first()).toBeVisible();
  });

  test('10. a lesson explains mistakes and blocks progress until corrected', async ({ page }) => {
    await page.goto('/learn');
    await expect(page.getByRole('heading', { name: 'Platformalar' })).toBeVisible();

    await page.goto('/learn/course_taobao');
    await expect(page.getByText(/Dars 1 \/ 10/)).toBeVisible();

    // Advance to the first simulator step.
    await page.getByRole('button', { name: 'Keyingi bosqich' }).click();
    await page.getByRole('button', { name: 'Keyingi bosqich' }).click();
    await expect(page.getByText('Simulyator', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: /Faqat mahsulot nomini yozaman/ }).click();
    await expect(page.getByText(/Bu variant noto'g'ri/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Keyingi bosqich' })).toBeDisabled();

    await page.getByRole('button', { name: /Qayta urinish/ }).click();
    await page.getByRole('button', { name: /narx oralig/ }).click();
    await expect(page.getByText("To'g'ri", { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Keyingi bosqich' })).toBeEnabled();
  });

  test('11. the seller assistant produces a ready-to-send message', async ({ page }) => {
    await page.goto('/seller-assistant');

    await page.getByRole('button', { name: 'Original mahsulotmi?' }).click();
    await page.getByRole('button', { name: 'Xabarni tayyorlash' }).click();

    await expect(page.getByText('Sotuvchiga yuboriladigan xabar')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/正品/)).toBeVisible();
    await expect(page.getByText(/ma'nosi/)).toBeVisible();
  });

  test('12. a consultation request reaches the admin panel', async ({ page }) => {
    await page.goto('/consultation');

    await page.getByLabel('Xizmat turi').selectOption('customs_issue');
    await page
      .getByLabel('Qisqa tavsif')
      .fill('Yukim bojxonada ushlab qolindi, qanday hujjat kerakligini bilmayman.');
    await page.getByLabel('Telegram username').fill('@e2e_user');
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: "So'rov yuborish" }).click();

    await expect(page.getByText(/So'rovingiz yuborildi/)).toBeVisible({ timeout: 20_000 });

    await page.goto('/admin/consultations');
    await expect(page.getByRole('heading', { name: 'Konsultatsiyalar' })).toBeVisible();
    await expect(page.getByText(/Yukim bojxonada ushlab qolindi/)).toBeVisible({ timeout: 20_000 });
  });

  test('13. items can be saved and removed', async ({ page }) => {
    await page.goto('/product/wireless-headphones-h1i');
    await page.getByRole('button', { name: 'Saqlash' }).click();
    await expect(page.getByRole('button', { name: 'Saqlangan' })).toBeVisible();

    await page.goto('/saved');
    await expect(page.getByText('Baseus Bowie H1i Wireless Headphones')).toBeVisible();

    await page.getByRole('button', { name: /o'chirish/ }).first().click();
    await expect(page.getByText(/Hozircha saqlangan mahsulotlar/)).toBeVisible();
  });

  test('14. the admin dashboard shows operational metrics', async ({ page }) => {
    await page.goto('/admin');

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByText('Eskirgan tariflar')).toBeVisible();
    await expect(page.getByText('Moderatsiya kutayotgan sharhlar')).toBeVisible();
  });

  test('15. the courier cabinet submits a change for approval', async ({ page }) => {
    await page.goto('/courier-panel');

    await expect(page.getByRole('heading', { name: 'Kuryer kabineti' })).toBeVisible({
      timeout: 20_000,
    });

    await page.getByLabel('Yangi qiymat').fill('25000');
    await page.getByRole('button', { name: 'Tasdiqlashga yuborish' }).click();

    await expect(page.getByText(/admin tasdig'ini kutmoqda/)).toBeVisible({ timeout: 20_000 });

    await page.goto('/admin/couriers');
    await expect(
      page.getByRole('heading', { name: /Tasdiq kutayotgan o'zgarishlar \(1\)/ }),
    ).toBeVisible({ timeout: 20_000 });
  });

  test('16. the health endpoint reports service status', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();

    const payload = (await response.json()) as { status: string; ai: string };
    expect(payload.status).toBe('ok');
    expect(payload.ai).toBe('mock');
  });
});
