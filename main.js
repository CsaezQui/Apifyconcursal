import { Actor } from 'apify';
import { chromium } from 'playwright';

await Actor.init();

try {
    console.log('Lanzando navegador...');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto('https://www.publicidadconcursal.es/consulta-publicidad-concursal-new', { waitUntil: 'networkidle' });

    await Actor.setValue('OUTPUT', {
        ok: true,
        mensaje: 'Página cargada correctamente'
    });

    await browser.close();
} catch (error) {
    console.error('Error detectado:', error);
    await Actor.setValue('OUTPUT', {
        ok: false,
        error: error.message || error.toString(),
        stack: error.stack || 'No stack trace'
    });
} finally {
    await Actor.exit();
}
