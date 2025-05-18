import { chromium } from 'playwright';
import { Actor } from 'apify';

await Actor.init();

const input = await Actor.getInput();
const { nombreEmpresa, cif } = input;

console.log(`Buscando datos para empresa: ${nombreEmpresa}, CIF: ${cif}`);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.goto('https://www.publicidadconcursal.es/consulta-publicidad-concursal-new', { timeout: 60000 });

// Aceptamos el aviso de cookies si está visible
const cookiesButton = page.locator('#klaro button[class*="accept"]');
if (await cookiesButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await cookiesButton.click();
    await page.waitForTimeout(1000); // Tiempo para que se cierre la capa
}

// Rellenamos el formulario
await page.getByPlaceholder('introduzca nombre').fill(nombreEmpresa);
if (cif) {
    await page.getByPlaceholder('introduzca NIF').fill(cif);
}

// Hacemos clic en el botón correcto
await page.locator('#_org_registradores_rpc_concursal_web_ConcursalWebPortlet_search').click();

// Esperamos resultados (máximo 30 segundos)
await page.waitForSelector('.search-results', { timeout: 30000 }).catch(() => {
    console.error('No se encontraron resultados o no cargaron a tiempo');
});

// Aquí podrías extraer resultados si hiciera falta
await Actor.setValue('OUTPUT', {
    ok: true,
    mensaje: 'Búsqueda completada (revisa si hay resultados en la web manualmente)'
});

await browser.close();
await Actor.exit();
