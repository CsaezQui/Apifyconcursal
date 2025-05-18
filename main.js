const { Actor } = require('apify');
const playwright = require('playwright');

Actor.main(async () => {
    console.log('Lanzando navegador...');
    try {
        const browser = await playwright.chromium.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto('https://www.publicidadconcursal.es/consulta-publicidad-concursal-new', {
            waitUntil: 'networkidle',
        });

        await Actor.setValue('OUTPUT', {
            mensaje: 'Página cargada correctamente'
        });

        await browser.close();
    } catch (error) {
        console.error('Error detectado:', error);
        await Actor.setValue('OUTPUT', {
            error: error.message,
            stack: error.stack
        });
        process.exit(1);
    }
});
