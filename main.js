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
            waitUntil: 'load',
            timeout: 60000
        });

        const botonAceptarCookies = page.locator('#klaro button[title="Aceptar"]');
        try {
            if (await botonAceptarCookies.isVisible({ timeout: 3000 })) {
                await botonAceptarCookies.click();
                console.log('Cookies aceptadas');
            }
        } catch (e) {
            console.log('No se mostró el aviso de cookies');
        }

        // Esperar al iframe principal visible
        const iframeLocator = page.locator('iframe[title="Contenido"]');
        await iframeLocator.waitFor({ timeout: 60000 });

        const iframeElement = await iframeLocator.elementHandle();
        if (!iframeElement) throw new Error('No se encontró el iframe con título "Contenido"');

        const iframe = await iframeElement.contentFrame();
        if (!iframe) throw new Error('No se pudo acceder al contenido del iframe');

        // Esperar y rellenar los campos
        await iframe.waitForSelector('#_org_registradores_rpc_concursal_web_ConcursalWebPortlet_nombre', { timeout: 30000 });
        await iframe.waitForSelector('#_org_registradores_rpc_concursal_web_ConcursalWebPortlet_documentoIdentificativo', { timeout: 30000 });

        await iframe.fill('#_org_registradores_rpc_concursal_web_ConcursalWebPortlet_nombre', nombreEmpresa);
        await iframe.fill('#_org_registradores_rpc_concursal_web_ConcursalWebPortlet_documentoIdentificativo', documentoIdentificativo);

        const botonBuscar = iframe.locator('#_org_registradores_rpc_concursal_web_ConcursalWebPortlet_search');
        await botonBuscar.scrollIntoViewIfNeeded();
        await botonBuscar.click();

        // Esperar resultado
        await iframe.waitForSelector('.resultado-busqueda, .portlet-msg-info', { timeout: 30000 });

        const contenido = await iframe.content();
        const hayResultado = !contenido.includes('Ningún dato disponible en esta tabla');

        await Actor.setValue('OUTPUT', {
            ok: true,
            resultado: hayResultado ? 'concursal' : 'no_concursal',
            mensaje: hayResultado
                ? 'La empresa figura con publicaciones concursales'
                : 'La empresa no figura en situación concursal'
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
