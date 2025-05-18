import { chromium } from 'playwright';
import { Actor } from 'apify';

await Actor.init();

const input = await Actor.getInput();
const { nombreEmpresa, cifEmpresa } = input;

console.log(`Buscando datos para empresa: ${nombreEmpresa}, CIF: ${cifEmpresa}`);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

try {
    await page.goto('https://www.publicidadconcursal.es/', { timeout: 60000 });

    await page.waitForSelector('#nombre', { timeout: 60000 });
    await page.fill('#nombre', nombreEmpresa);

    if (cifEmpresa) {
        await page.fill('#cif', cifEmpresa);
    }

    await page.click('#botonBuscar');

    await page.waitForLoadState('networkidle');

    const resultado = await page.content();

    await Actor.setValue('OUTPUT', { ok: true, mensaje: 'Página cargada correctamente', html: resultado });

} catch (error) {
    console.error('Error detectado:', error);
    await Actor.setValue('OUTPUT', { ok: false, error: error.message });
} finally {
    await browser.close();
    await Actor.exit();
}
