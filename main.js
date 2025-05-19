import { chromium } from 'playwright';

const BASE_URL = 'https://www.publicidadconcursal.es/consulta-publicidad-concursal-new';

export const main = async () => {
    const input = await Actor.getInput();
    const { nombre, cif } = input;

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

    if (nombre) await page.fill('input[placeholder*="nombre"]', nombre);
    if (cif) await page.fill('input[placeholder*="NIF"]', cif);

    await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
        page.click('button:has-text("Buscar")')
    ]);

    // Espera a que aparezca el mensaje de sin resultados o la tabla
    await page.waitForFunction(() => {
        return document.body.innerText.includes('No se han encontrado resultados') ||
               document.querySelector('.dataTables_wrapper');
    }, { timeout: 10000 });

    const salida = {
        nombreBuscado: nombre || null,
        cifBuscado: cif || null,
    };

    if (await page.isVisible('text="No se han encontrado resultados"')) {
        salida.estado = 'sin_resultados';
    } else {
        salida.estado = 'con_resultados';
        salida.htmlTabla = await page.innerHTML('.dataTables_wrapper');

        const enlace = await page.$('a[href*="portal/layout"]');
        if (enlace) {
            await Promise.all([
                page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
                enlace.click(),
            ]);
            salida.htmlDetalle = await page.content();
        }
    }

    await browser.close();
    await Actor.pushData(salida);
};
