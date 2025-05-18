import { chromium } from 'playwright';
import { Actor } from 'apify';

await Actor.init();

const input = await Actor.getInput();
const nombreEmpresa = input.nombreEmpresa;
const cif = input.cif;

console.log(`Buscando datos para empresa: ${nombreEmpresa}, CIF: ${cif}`);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

try {
    await page.goto('https://www.publicidadconcursal.es/consulta-publicidad-concursal-new', { timeout: 60000 });

    // Aceptar cookies si el banner está presente
    const aceptarCookies = page.locator('button[data-testid="Klaro__acceptAll"]');
    if (await aceptarCookies.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log("Aceptando cookies...");
        await aceptarCookies.click();
        await page.waitForTimeout(500);
    }

    // Esperar y rellenar el campo del nombre del deudor
    await page.waitForSelector('#_org_registradores_rpc_concursal_web_ConcursalWebPortlet_nombre', { timeout: 30000 });
    await page.fill('#_org_registradores_rpc_concursal_web_ConcursalWebPortlet_nombre', nombreEmpresa);

    // Esperar y rellenar el campo del CIF
    await page.waitForSelector('#_org_registradores_rpc_concursal_web_ConcursalWebPortlet_documento', { timeout: 30000 });
    await page.fill('#_org_registradores_rpc_concursal_web_ConcursalWebPortlet_documento', cif);

    // Pulsar el botón de búsqueda
    await page.waitForSelector('#_org_registradores_rpc_concursal_web_ConcursalWebPortlet_search', { timeout: 30000 });
    await page.click('#_org_registradores_rpc_concursal_web_ConcursalWebPortlet_search');

    // Esperar resultados
    await page.waitForTimeout(5000); // puedes afinarlo con un waitForSelector si conoces el resultado

    // Aquí puedes recoger resultados si lo necesitas, por ejemplo:
    const resultados = await page.content();

    await Actor.setValue('OUTPUT', {
        ok: true,
        mensaje: 'Búsqueda realizada correctamente',
        resultadosExtraidos: resultados
    });

} catch (error) {
    console.error('Error detectado:', error);
    await Actor.setValue('OUTPUT', {
        ok: false,
        error: error.message,
        stack: error.stack
    });
} finally {
    await browser.close();
    await Actor.exit();
}
