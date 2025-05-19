const { chromium } = require('playwright');
const Apify = require('apify');

Apify.main(async () => {
    const input = await Apify.getInput();
    const { nombre, cif } = input;

    console.log('INICIO DEL ACTOR');
    console.log('Lanzando navegador...');

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
        console.log('Navegando a la web...');
        await page.goto('https://www.publicidadconcursal.es/consulta-publicidad-concursal-new', { waitUntil: 'domcontentloaded' });

        console.log('Esperando a que cargue el campo de nombre...');
        await page.waitForSelector('#_org_registradores_rpc_concursal_web_ConcursalWebPortlet_afectado', { timeout: 10000 });

        if (nombre) {
            await page.fill('#_org_registradores_rpc_concursal_web_ConcursalWebPortlet_afectado', nombre);
        }
        if (cif) {
            await page.fill('#_org_registradores_rpc_concursal_web_ConcursalWebPortlet_identificador', cif);
        }

        console.log('Haciendo clic en el botón de buscar...');
        await page.click('span.lfr-btn-label:text("Buscar")');

        console.log('Esperando resultados...');
        await page.waitForSelector('td.dt-center', { timeout: 10000 });

        const resultado = await page.textContent('td.dt-center');
        console.log(`Resultado encontrado: ${resultado}`);

        await Apify.pushData({ resultado });

    } catch (error) {
        console.error('ERROR DURANTE LA EJECUCIÓN:', error.message);
        await Apify.pushData({ error: error.message });
    } finally {
        await browser.close();
    }
});
