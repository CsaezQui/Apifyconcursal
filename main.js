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
        await page.goto('https://www.publicidadconcursal.es/consulta-publicidad-concursal-new', {
            waitUntil: 'domcontentloaded',
            timeout: 60000,
        });

        // Aceptar cookies si aparece
        const cookieBtn = page.locator('#klaro button[title="Aceptar"]');
        if (await cookieBtn.isVisible({ timeout: 2000 })) {
            await cookieBtn.click();
        }

        // Rellenar formulario
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

        // Pulsar Buscar
        const buscarBtn = page.locator(
            '#_org_registradores_rpc_concursal_web_ConcursalWebPortlet_search'
        );
        await buscarBtn.scrollIntoViewIfNeeded();
        await buscarBtn.click();

        // Esperar resultado o mensaje de tabla vacía
        await page.waitForSelector('.dataTables_wrapper, .portlet-msg-info', {
            timeout: 30000,
        });

        // Comprobar si hay datos
        const emptyText = await page
            .textContent('td.dataTables_empty')
            .catch(() => '');
        let resultado;
        if (emptyText && emptyText.includes('Ningún dato disponible')) {
            resultado = {
                ok: true,
                resultado: 'no_concursal',
                mensaje: 'La empresa no figura en situación concursal',
            };
        } else {
            resultado = {
                ok: true,
                resultado: 'concursal',
                mensaje: 'La empresa figura con publicaciones concursales',
            };
        }
        await Actor.setValue('OUTPUT', resultado);

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
