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
        if (await botonAceptarCookies.isVisible({ timeout: 2000 })) {
            await botonAceptarCookies.click();
        }

        await page.waitForSelector('#_org_registradores_rpc_concursal_web_ConcursalWebPortlet_nombre', { timeout: 30000 });
        await page.waitForSelector('#_org_registradores_rpc_concursal_web_ConcursalWebPortlet_documentoIdentificativo', { timeout: 30000 });

        await page.fill('#_org_registradores_rpc_concursal_web_ConcursalWebPortlet_nombre', nombreEmpresa);
        await page.fill('#_org_registradores_rpc_concursal_web_ConcursalWebPortlet_documentoIdentificativo', documentoIdentificativo);

        const botonBuscar = page.locator('#_org_registradores_rpc_concursal_web_ConcursalWebPortlet_search');
        await botonBuscar.scrollIntoViewIfNeeded();
        await botonBuscar.click();

        // Esperamos a que aparezca el contenedor de resultados
        await page.waitForSelector('div[id*="resultadoBusquedaConcursal"]', { timeout: 30000 });

        // Leemos el contenido visible del contenedor
        const contenidoResultado = await page.textContent('div[id*="resultadoBusquedaConcursal"]');
        const noHayDatos = contenidoResultado.includes('Ningún dato disponible en esta tabla');

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
