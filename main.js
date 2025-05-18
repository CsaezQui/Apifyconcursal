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

        // Esperar a que cargue el iframe
        const iframeElement = await page.waitForSelector('iframe[title="Contenido"]', { timeout: 10000 });
        const frame = await iframeElement.contentFrame();

        if (!frame) throw new Error('No se pudo acceder al iframe de contenido');

        // Esperar y rellenar campos dentro del iframe
        await frame.waitForSelector('#_org_registradores_rpc_concursal_web_ConcursalWebPortlet_nombre', { timeout: 30000 });
        await frame.fill('#_org_registradores_rpc_concursal_web_ConcursalWebPortlet_nombre', nombreEmpresa);

        await frame.waitForSelector('#_org_registradores_rpc_concursal_web_ConcursalWebPortlet_documentoIdentificativo', { timeout: 30000 });
        await frame.fill('#_org_registradores_rpc_concursal_web_ConcursalWebPortlet_documentoIdentificativo', documentoIdentificativo);

        const botonBuscar = frame.locator('#_org_registradores_rpc_concursal_web_ConcursalWebPortlet_search');
        await botonBuscar.scrollIntoViewIfNeeded();
        await botonBuscar.click();

        // Esperar a que aparezcan resultados o mensaje
        await frame.waitForSelector('.resultado-busqueda, .portlet-msg-info', { timeout: 30000 });

        const contenidoHTML = await frame.content();
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
