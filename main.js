import { Actor } from 'apify';
import { chromium } from 'playwright';

await Actor.init();

const input = await Actor.getInput();
// Puedes pasar los datos desde el INPUT del actor en Apify
const nombre = input.nombre || 'SERVICIOS INTEGRALES MUGRAFA';
const cif = input.cif || 'B45857430';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

try {
    await page.goto('https://www.publicidadconcursal.es/consulta-publicidad-concursal-new', {
        waitUntil: 'domcontentloaded',
    });

    // Marcar la Sección I (obligatoria)
    const seccionCheckbox = '#_org_registradores_rpc_concursal_web_ConcursalWebPortlet_section1';
    await page.waitForSelector(seccionCheckbox, { timeout: 10000 });
    await page.check(seccionCheckbox);

    // Rellenar nombre
    const nombreSelector = '#_org_registradores_rpc_concursal_web_ConcursalWebPortlet_afectado';
    await page.fill(nombreSelector, nombre);

    // Rellenar CIF
    const cifSelector = '#_org_registradores_rpc_concursal_web_ConcursalWebPortlet_identificador';
    await page.fill(cifSelector, cif);

    // Pulsar buscar
    const botonBuscar = '#_org_registradores_rpc_concursal_web_ConcursalWebPortlet_search';
    await page.click(botonBuscar);

    // Esperar resultados
    await page.waitForSelector('.dataTables_wrapper', { timeout: 10000 });

    // Comprobar si hay resultados o mensaje de vacío
    const sinResultados = await page.locator('.dataTables_empty').isVisible();

    if (sinResultados) {
        console.log('No hay resultados para la empresa.');
        await Actor.pushData({ resultado: 'Sin resultados', nombre, cif });
    } else {
        const filas = await page.$$eval('.dataTable tbody tr', rows =>
            rows.map(row => {
                const columnas = row.querySelectorAll('td');
                return {
                    fecha: columnas[0]?.innerText.trim(),
                    juzgado: columnas[1]?.innerText.trim(),
                    tipo: columnas[2]?.innerText.trim(),
                };
            })
        );

        console.log(`Resultados encontrados: ${filas.length}`);
        await Actor.pushData(filas);
    }

} catch (error) {
    console.error('Error durante la ejecución:', error.message);
    await Actor.pushData({ error: error.message, nombre, cif });
}

await browser.close();
await Actor.exit();
