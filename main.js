const { Actor } = require('apify');
const { chromium } = require('playwright');

Actor.main(async () => {
    try {
        console.log('Lanzando navegador...');
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();

        const input = await Actor.getInput();
        const nombreEmpresa = input.nombreEmpresa;

        await page.goto('https://www.publicidadconcursal.es/consulta-publicidad-concursal-new');

        await page.fill('#nombreRazonSocial', nombreEmpresa);
        await page.click('button[type="submit"]');

        await page.waitForTimeout(5000); // espera estática, se puede ajustar

        const resultados = await page.content();
        await Actor.setValue('OUTPUT', { html: resultados });

        await browser.close();
    } catch (error) {
        console.error('Error detectado:', error);
        await Actor.setValue('OUTPUT', {
            ok: false,
            error: error.message,
            stack: error.stack
        });
    }
});
