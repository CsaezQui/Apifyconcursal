
import { chromium } from 'playwright';
import { Actor } from 'apify';

await Actor.init();

const input = await Actor.getInput();
const { nombreEmpresa, cif } = input;

console.log(`Buscando datos para empresa: ${nombreEmpresa}, CIF: ${cif}`);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.goto('https://www.publicidadconcursal.es/consulta-publicidad-concursal-new', { waitUntil: 'domcontentloaded' });

// Aceptar cookies si aparece el aviso
const aceptarCookies = page.locator('button[title="Aceptar todas las cookies"]');
if (await aceptarCookies.isVisible()) {
    console.log("Aceptando cookies...");
    await aceptarCookies.click();
    await page.waitForTimeout(1000); // Esperar a que se cierre la capa
}

// Rellenar el nombre del deudor
await page.waitForSelector('input[placeholder*="nombre"]', { timeout: 60000 });
await page.fill('input[placeholder*="nombre"]', nombreEmpresa);

// Rellenar el CIF
await page.fill('input[placeholder*="NIF"]', cif);

// Hacer clic en el botÃ³n Buscar
const botonBuscar = page.locator('#_org_registradores_rpc_concursal_web_ConcursalWebPortlet_search');
await botonBuscar.click({ timeout: 30000 });

await page.waitForLoadState('domcontentloaded');
console.log('BÃºsqueda ejecutada');

await Actor.pushData({ ok: true, mensaje: 'Consulta ejecutada correctamente' });

await browser.close();
await Actor.exit();
