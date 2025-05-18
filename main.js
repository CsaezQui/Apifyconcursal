import { Actor } from 'apify';
import { chromium } from 'playwright';

await Actor.init();

const input = await Actor.getInput();
const { nombreEmpresa, cif } = input;

console.log(`Buscando datos para empresa: ${nombreEmpresa}, CIF: ${cif}`);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

try {
    await page.goto('https://www.publicidadconcursal.es/consulta-publicidad-concursal-new', {
        waitUntil: 'load',
        timeout: 60000,
    });

    // Aceptar cookies si aparece el aviso
    const btnAceptarCookies = await page.locator('#klaro button[aria-label="Aceptar todas las cookies"]');
    if (await btnAceptarCookies.isVisible()) {
        await btnAceptarCookies.click();
        await page.waitForTimeout(1000);
    }

    // Esperar y rellenar el campo de nombre
    await page.waitForSelector('input[placeholder*="nombre"]', { timeout: 60000 });
    await page.fill('input[placeholder*="nombre"]', nombreEmpresa);

    // Rellenar el campo de CIF si se ha proporcionado
    if (cif) {
        await page.fill('input[placeholder*="NIF"]', cif);
    }

    // Hacer clic en el botón de búsqueda
    await page.locator('button:has-text("Buscar")').click();

    // Esperar a los resultados
    await page.waitForSelector('.resultado-bloque', { timeout: 60000 });

    const resultados = await page.$$eval('.resultado-bloque', bloques =>
        bloques.map(b => b.innerText.trim())
    );

    await Actor.setValue('OUTPUT', {
        ok: true,
        mensaje: `Se encontraron ${resultados.length} resultados`,
        resultados,
    });

} catch (error) {
    console.error('Error detectado:', error);
    await Actor.setValue('OUTPUT', {
        ok: false,
        error: error.message,
        stack: error.stack,
    });
} finally {
    await browser.close();
    await Actor.exit();
}
