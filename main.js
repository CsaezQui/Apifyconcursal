const { chromium } = require('playwright');

console.log('INICIO DEL ACTOR');

(async () => {
    try {
        console.log('Lanzando navegador...');
        const browser = await chromium.launch({ headless: true });
        const context = await browser.newContext();
        const page = await context.newPage();

        console.log('Navegando a la web...');
        await page.goto('https://www.publicidadconcursal.es/consulta-publicidad-concursal-new', { timeout: 20000 });

        console.log('Esperando a que cargue el campo de nombre...');
        await page.waitForSelector('input[name="nombre"]', { timeout: 10000 });

        console.log('La página se ha cargado correctamente.');
        console.log('Realizando búsqueda simulada...');

        // Rellenamos el campo de nombre con texto simulado
        await page.fill('input[name="nombre"]', 'MERCADONA');
        await page.click('button[type="submit"]');

        console.log('Esperando resultados...');
        await page.waitForSelector('.dataTables_wrapper', { timeout: 15000 });

        console.log('¡Resultados localizados!');

        // Aquí podrías seguir extrayendo datos si quieres
        // const content = await page.content();
        // console.log(content);

        await browser.close();
        console.log('Finalizado correctamente.');
    } catch (error) {
        console.error('ERROR DURANTE LA EJECUCIÓN:', error);
    }
})();
