import { Actor } from 'apify';

await Actor.init();

const input = await Actor.getInput();
// Por ejemplo, input.afectado, input.identificador, etc.
// (Si quieres parametrizar la búsqueda.)

const browser = await Actor.launchPuppeteer();
const page = await browser.newPage();

await page.goto('https://www.publicidadconcursal.es/consulta-publicidad-concursal-new');

// Aquí iría el código para rellenar el formulario y pulsar “Buscar”
// …
// Esperar a que desaparezca el spinner de “Procesando…”
await page.waitForSelector(
    '#_org_registradores_rpc_concursal_web_ConcursalWebPortlet_dataTable_processing',
    { hidden: true, timeout: 60000 }
);

// Comprueba si no hay resultados
const emptyCell = await page.$('#_org_registradores_rpc_concursal_web_ConcursalWebPortlet_dataTable tbody td.dataTables_empty');
if (emptyCell) {
    await Actor.pushData({ concursal: false });
    await browser.close();
    await Actor.exit();
}

// Extrae todas las filas
const rows = await page.$$('#_org_registradores_rpc_concursal_web_ConcursalWebPortlet_dataTable tbody tr');
for (const row of rows) {
    const cells = await row.$$('td');
    const nombre    = await cells[0].innerText();
    const documento = await cells[1].innerText();
    await Actor.pushData({ concursal: true, nombre, documento });
}

await browser.close();
await Actor.exit();
