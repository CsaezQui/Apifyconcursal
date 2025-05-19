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

        // Esperamos al iframe principal
        const iframeLocator = page.frameLocator('iframe[title="Contenido"]');
        await page.waitForSelector('iframe[title="Contenido"]', { timeout: 10000 });

        // Rellenamos los campos dentro del iframe
        await iframeLocator.locator('input[id$="nombre"]').fill(nombreEmpresa, { timeout: 10000 });
        await iframeLocator.locator('input[id$="documentoIdentificativo"]').fill(documentoIdentificativo, { timeout: 10000 });

        // Clic en el botón de búsqueda
        const botonBuscar = iframeLocator.locator('button[id$="search"]');
        await botonBuscar.scrollIntoViewIfNeeded();
        await botonBuscar.click();

        // Esperamos resultados o mensaje de tabla vacía
        await iframeLocator.locator('.resultado-busqueda, .dataTables_empty, .portlet-msg-info').waitFor({ timeout: 30000 });

        const hayMensajeSinDatos = await iframeLocator.locator('td.dataTables_empty').isVisible().catch(() => false);

        if (hayMensajeSinDatos) {
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
