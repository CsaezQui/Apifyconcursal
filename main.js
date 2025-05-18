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

        // Aceptar cookies si aparece Klaro
        const botonAceptarCookies = page.locator('#klaro button[title="Aceptar"]');
        if (await botonAceptarCookies.isVisible({ timeout: 3000 }).catch(() => false)) {
            await botonAceptarCookies.click().catch(() => {});
        }

        // Esperar el iframe que contiene el formulario
        const allIframes = await page.$$('iframe');
        if (allIframes.length === 0) throw new Error('No se encontraron iframes en la página');

        const formularioFrame = await allIframes[0].contentFrame();
        if (!formularioFrame) throw new Error('No se pudo acceder al iframe del formulario');

        // Esperar y rellenar campos dentro del iframe
        await formularioFrame.waitForSelector('#_org_registradores_rpc_concursal_web_ConcursalWebPortlet_nombre', { timeout: 30000 });
        await formularioFrame.fill('#_org_registradores_rpc_concursal_web_ConcursalWebPortlet_nombre', nombreEmpresa);

        await formularioFrame.waitForSelector('#_org_registradores_rpc_concursal_web_ConcursalWebPortlet_documentoIdentificativo', { timeout: 30000 });
        await formularioFrame.fill('#_org_registradores_rpc_concursal_web_ConcursalWebPortlet_documentoIdentificativo', documentoIdentificativo);

        const botonBuscar = formularioFrame.locator('#_org_registradores_rpc_concursal_web_ConcursalWebPortlet_search');
        await botonBuscar.scrollIntoViewIfNeeded();
        await botonBuscar.click();

        // Esperar a que aparezca el resultado o mensaje
        await formularioFrame.waitForSelector('.resultado-busqueda, .portlet-msg-info', { timeout: 30000 });

        const contenidoHTML = await formularioFrame.content();
        const noHayDatos = contenidoHTML.includes('Ningún dato disponible en esta tabla');

        if (noHayDatos) {
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
