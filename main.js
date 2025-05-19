import { Actor } from 'apify';
import { chromium } from 'playwright'; // Usa 'firefox' o 'webkit' si lo prefieres

await Actor.init();

const input = await Actor.getInput();
const { nombre, cif } = input;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

try {
    await page.goto('https://www.publicidadconcursal.es/consulta-publicidad-concursal-new', { waitUntil: 'load', timeout: 60000 });

    await page.fill('#nombre', nombre);
    await page.fill('#documentoIdentificativo', cif);

    await page.click('#botonBuscar');

    // Espera a que se cargue el contenedor de resultados sin exigir visibilidad completa
    await page.waitForSelector('.dataTables_wrapper', { state: 'attached', timeout: 20000 });
    console.log("Tabla localizada correctamente");

    const rows = await page.$$('.dataTables_wrapper table tbody tr');

    let resultados = [];

    for (const row of rows) {
        const columnas = await row.$$('td');
        const datos = await Promise.all(columnas.map(async col => (await col.textContent())?.trim()));
        resultados.push(datos);
    }

    await Actor.pushData({
        nombre,
        cif,
        resultados
    });

} catch (error) {
    console.error("Error durante la ejecución:", error);
    throw error;

} finally {
    await browser.close();
    await Actor.exit();
}
