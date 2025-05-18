import { Actor } from 'apify';
import { chromium } from 'playwright';

Actor.main(async () => {
    const input = await Actor.getInput();
    const { nombreEmpresa, cifEmpresa } = input;

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
        await page.goto('https://www.publicidadconcursal.es/consulta-publicidad-concursal-new', { waitUntil: 'domcontentloaded' });

        await page.fill('#denominacion', nombreEmpresa);
        await page.fill('#cif', cifEmpresa);

        await page.click('button:has-text("Buscar")');
        await page.waitForSelector('table', { timeout: 10000 });

        const resultados = await page.$$eval('table tbody tr', rows =>
            rows.map(row => {
                const cells = Array.from(row.querySelectorAll('td'));
                return cells.map(cell => cell.textContent.trim());
            })
        );

        await Actor.setValue('OUTPUT', {
            ok: true,
            resultados,
        });

    } catch (error) {
        await Actor.setValue('OUTPUT', {
            ok: false,
            error: error.message,
        });
    } finally {
        await browser.close();
    }
});
