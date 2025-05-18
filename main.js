import { Actor } from 'apify';
import { chromium } from 'playwright';

await Actor.init();

const input = await Actor.getInput();
const { nombreEmpresa, cif } = input;

console.log(`Buscando datos para empresa: ${nombreEmpresa}, CIF: ${cif}`);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.goto('https://www.publicidadconcursal.es/consulta-publicidad-concursal-new', { waitUntil: 'networkidle' });

await page.waitForSelector('#nombre', { timeout: 60000 });
await page.fill('#nombre', nombreEmpresa);

if (cif) {
    await page.fill('#cif', cif);
}

await page.click('#btnBuscar');
await page.waitForSelector('#tablaResultados tbody tr', { timeout: 60000 });

const resultado = await page.evaluate(() => {
    const fila = document.querySelector('#tablaResultados tbody tr');
    if (!fila) return { estado: 'Sin resultados' };
    const columnas = fila.querySelectorAll('td');
    return {
        nombre: columnas[0]?.textContent?.trim(),
        cif: columnas[1]?.textContent?.trim(),
        estado: columnas[4]?.textContent?.trim(),
    };
});

await Actor.setValue('OUTPUT', {
    ok: true,
    resultado,
});

await browser.close();
await Actor.exit();
