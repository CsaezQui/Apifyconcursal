import { Actor } from 'apify';
import { chromium } from 'playwright';

await Actor.init();

const input = await Actor.getInput();
const nombreEmpresa = input.nombreEmpresa;
const cifEmpresa = input.cifEmpresa;

console.log(`Buscando datos para empresa: ${nombreEmpresa}, CIF: ${cifEmpresa}`);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

try {
    await page.goto('https://www.publicidadconcursal.es/consulta-publicidad-concursal-new', { timeout: 60000 });
    console.log('Página cargada correctamente');

    await page.waitForSelector('input[placeholder="Introduzca nombre"]', { timeout: 60000 });
    await page.waitForSelector('input[placeholder="Introduzca nif / cif / nie /pasaporte"]', { timeout: 60000 });

    await page.fill('input[placeholder="Introduzca nombre"]', nombreEmpresa);
    await page.fill('input[placeholder="Introduzca nif / cif / nie /pasaporte"]', cifEmpresa);

    await page.click('button:has-text("Buscar")');

    await page.waitForTimeout(5000);
    const html = await page.content();

    await Actor.setValue('OUTPUT', {
        ok: true,
        mensaje: 'Consulta enviada. Revisa el HTML si quieres comprobar resultados.',
        html: html
    });

} catch (error) {
    console.error('Error detectado:', error);
    await Actor.setValue('OUTPUT', {
        ok: false,
        error: error.message,
        stack: error.stack
    });
}

await browser.close();
await Actor.exit();
