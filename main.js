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

        // Espera extra para asegurar carga total del portal
        await page.waitForTimeout(3000);

        const botonAceptarCookies = page.locator('#klaro button[title="Aceptar"]');
        if (await botonAceptarCookies.isVisible({ timeout: 2000 })) {
            await botonAceptarCookies.click();
        }

        await page.waitForSelector('#_org_registradores_rpc_concursal_web_ConcursalWebPortlet_nombre', { timeout: 60000 });
        await page.waitForSelector('#_org_registradores_rpc_concursal_web_ConcursalWebPortlet_documentoIdentificativo', { timeout: 60000 });

        await page.fill('#_org_registradores_rpc_concursal_web_ConcursalWebPortlet_nombre', nombreEmpresa);
        await page.fill('#_org_registradores_rpc_concursal_web_ConcursalWebPortlet_documentoIdentificativo', documentoIdentificativo);

        const botonBuscar = page.locator('#_org_registradores_rpc_concursal_web_ConcursalWebPortlet_search');
        await botonBuscar.scrollIntoViewIfNeeded();
        await botonBuscar.click();

        await page.waitForSelector('.resultado-busqueda, .portlet-msg-info', { timeout: 60000 });

        await Actor.setValue('OUTPUT', {
            ok: true,
            mensaje: 'Consulta realizada correctamente'
        });

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
