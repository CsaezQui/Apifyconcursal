const { Actor } = require('apify');
const { chromium } = require('playwright');

Actor.main(async () => {
    console.log('Lanzando navegador...');
    try {
        const input = await Actor.getInput();
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();

        await page.goto('https://www.publicidadconcursal.es/consulta-publicidad-concursal-new', {
            waitUntil: 'networkidle',
        });

        // Aquí puedes añadir scraping o interacción con la página si lo deseas

        await browser.close();

        await Actor.setValue('OUTPUT', {
            ok: true,
            mensaje: 'Página cargada correctamente',
            empresaConsultada: input?.nombreEmpresa || null
        });

    } catch (error) {
        await Actor.setValue('OUTPUT', {
            ok: false,
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
});