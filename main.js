const { Actor } = require('apify');
const { chromium } = require('playwright');

Actor.main(async () => {
    // Leemos input
    const input = await Actor.getInput();
    const nombreEmpresa = input.nombreEmpresa;
    const documentoIdentificativo = input.documentoIdentificativo;

    console.log(`Buscando datos para empresa: ${nombreEmpresa}, CIF: ${documentoIdentificativo}`);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        // Navegamos a la página
        await page.goto('https://www.publicidadconcursal.es/consulta-publicidad-concursal-new', {
            waitUntil: 'domcontentloaded',
            timeout: 60000,
        });

        // Aceptar cookies si aparece el banner
        const botonCookies = page.locator('#klaro button[title="Aceptar"]');
        if (await botonCookies.isVisible({ timeout: 3000 })) {
            await botonCookies.click();
        }

        // Esperamos los campos de búsqueda
        await page.waitForSelector('#_org_registradores_rpc_concursal_web_ConcursalWebPortlet_afectado', { timeout: 60000 });
        await page.waitForSelector('#_org_registradores_rpc_concursal_web_ConcursalWebPortlet_identificador', { timeout: 60000 });

        // Rellenamos nombre/CIF
        await page.fill('#_org_registradores_rpc_concursal_web_ConcursalWebPortlet_afectado', nombreEmpresa || '');
        await page.fill('#_org_registradores_rpc_concursal_web_ConcursalWebPortlet_identificador', documentoIdentificativo || '');

        // Hacemos scroll y clic en Buscar
        const botonBuscar = page.locator('#_org_registradores_rpc_concursal_web_ConcursalWebPortlet_search');
        await botonBuscar.scrollIntoViewIfNeeded();
        await botonBuscar.click();

        // Esperamos que cargue el resultado (tabla o mensaje de “no hay datos”)
        await page.waitForSelector('.dataTables_wrapper, .portlet-msg-info', { timeout: 30000 });

        // Comprobamos si hay tabla vacía
        const hayTablaVacia = await page.locator('td.dataTables_empty').count() > 0;

        if (hayTablaVacia) {
            // No hay resultados
            await Actor.setValue('OUTPUT', {
                ok: true,
                resultado: 'no_concursal',
                mensaje: 'La empresa no figura en situación concursal',
            });
        } else {
            // Hay resultados (concursal)
            await Actor.setValue('OUTPUT', {
                ok: true,
                resultado: 'concursal',
                mensaje: 'La empresa figura con publicaciones concursales',
            });
        }

    } catch (error) {
        console.error('Error durante la ejecución:', error);
        await Actor.setValue('OUTPUT', {
            ok: false,
            error: error.message,
            stack: error.stack,
        });
    } finally {
        await browser.close();
    }
});
