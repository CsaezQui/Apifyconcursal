const { Actor } = require('apify');
const { chromium } = require('playwright');

Actor.main(async () => {
    const input = await Actor.getInput();
    const nombre = input.nombreEmpresa;
    const docId = input.documentoIdentificativo;

    console.log(`Buscando: nombre="${nombre}", doc="${docId}"`);

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
        // 1) Accede a la página
        await page.goto('https://www.publicidadconcursal.es/consulta-publicidad-concursal-new', {
            waitUntil: 'domcontentloaded',
            timeout: 60000,
        });

        // 2) Aceptar cookies si aparece
        const btnCookies = page.locator('#klaro button[title="Aceptar"]');
        if (await btnCookies.isVisible({ timeout: 2000 })) {
            await btnCookies.click();
        }

        // 3) Rellenar campos de búsqueda
        await page.waitForSelector(
            '#_org_registradores_rpc_concursal_web_ConcursalWebPortlet_afectado',
            { timeout: 15000 }
        );
        await page.fill(
            '#_org_registradores_rpc_concursal_web_ConcursalWebPortlet_afectado',
            nombre
        );
        await page.fill(
            '#_org_registradores_rpc_concursal_web_ConcursalWebPortlet_identificador',
            docId
        );

        // 4) Pulsar “Buscar”
        const btnBuscar = page.locator(
            '#_org_registradores_rpc_concursal_web_ConcursalWebPortlet_search'
        );
        await btnBuscar.scrollIntoViewIfNeeded();
        await btnBuscar.click();

        // 5) Esperar resultado: tabla o mensaje “no datos”
        await page.waitForSelector(
            '.dataTables_wrapper, .portlet-msg-info',
            { timeout: 30000 }
        );

        // 6) Determinar si hay datos
        const textoTabla = await page.textContent(
            'td.dataTables_empty'
        ).catch(() => '');
        let output;
        if (textoTabla && textoTabla.includes('Ningún dato disponible')) {
            output = {
                ok: true,
                resultado: 'no_concursal',
                mensaje: 'La empresa no figura en situación concursal',
            };
        } else {
            output = {
                ok: true,
                resultado: 'concursal',
                mensaje: 'La empresa figura con publicaciones concursales',
            };
        }

        await Actor.setValue('OUTPUT', output);

    } catch (err) {
        console.error(err);
        await Actor.setValue('OUTPUT', {
            ok: false,
            error: err.message,
            stack: err.stack,
        });
    } finally {
        await browser.close();
    }
});
