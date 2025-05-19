const { Actor } = require('apify');
const { chromium } = require('playwright');

Actor.main(async () => {
    const input = await Actor.getInput();
    const nombreEmpresa = input.nombreEmpresa;
    const documentoIdentificativo = input.documentoIdentificativo;

    console.log(`Buscando datos para empresa: ${nombreEmpresa}, CIF: ${documentoIdentificativo}`);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        await page.goto('https://www.publicidadconcursal.es/consulta-publicidad-concursal-new', {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });

        const botonAceptarCookies = page.locator('#klaro button[title="Aceptar"]');
        if (await botonAceptarCookies.isVisible({ timeout: 3000 })) {
            await botonAceptarCookies.click();
        }

        // Rellenamos los campos
        await page.fill('input[id*="nombre"]', nombreEmpresa);
        await page.fill('input[id*="documentoIdentificativo"]', documentoIdentificativo);

        // Hacemos clic en el botón Buscar
        const botonBuscar = page.locator('button[id*="search"]');
        await botonBuscar.scrollIntoViewIfNeeded();
        await botonBuscar.click();

        // Esperamos a que aparezca algún resultado o el mensaje de tabla vacía
        await page.waitForSelector('.resultado-busqueda, .dataTables_empty, .portlet-msg-info', { timeout: 60000 });

        const sinDatos = await page.locator('td.dataTables_empty').isVisible().catch(() => false);

        if (sinDatos) {
            await Actor.setValue('OUTPUT', {
                ok: true,
                resultado: 'no_concursal',
                mensaje: 'La empresa no figura en situación concursal'
            });
        } else {
            await Actor.setValue('OUTPUT', {
                ok: true,
                resultado: 'concursal',
                mensaje: 'La empresa figura con publicaciones concursales'
            });
        }

    } catch (error) {
        await Actor.setValue('OUTPUT', {
            ok: false,
            error: error.message,
            stack: error.stack
        });
    } finally {
        await browser.close();
    }
});
