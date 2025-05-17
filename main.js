const { Actor } = require('apify');
const { chromium } = require('playwright'); // Usamos Playwright en lugar de Puppeteer

Actor.main(async () => {
    const input = await Actor.getInput();
    const { nombreEmpresa, cif } = input;

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
        await page.goto('https://www.publicidadconcursal.es/consulta-publicidad-concursal-new', {
            waitUntil: 'domcontentloaded'
        });

        await page.fill('#busquedaNombre', nombreEmpresa);
        await page.fill('#busquedaNif', cif);

        await Promise.all([
            page.click('#btnBuscar'),
            page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
        ]);

        const resultados = await page.$$eval('.tablaResultados tbody tr', filas =>
            filas.map(fila => {
                const celdas = fila.querySelectorAll('td');
                return {
                    nombre: celdas[0]?.innerText.trim(),
                    cif: celdas[1]?.innerText.trim(),
                    juzgado: celdas[2]?.innerText.trim(),
                    procedimiento: celdas[3]?.innerText.trim(),
                    estado: celdas[4]?.innerText.trim(),
                    fecha: celdas[5]?.innerText.trim()
                };
            })
        );

        await Actor.setValue('OUTPUT', {
            encontrado: resultados.length > 0,
            concursos: resultados,
            input
        });

    } catch (err) {
        await Actor.setValue('OUTPUT', {
            ok: false,
            error: err.message,
            stack: err.stack
        });
        throw err;
    } finally {
        await browser.close();
    }
});
