const { Actor } = require('apify');
const puppeteer = require('puppeteer');

Actor.main(async () => {
    try {
        const input = await Actor.getInput();
        const { nombreEmpresa, cif } = input;

        console.log('Lanzando navegador...');
        const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome-stable',
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--window-size=1200,800'
    ]
});

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

        console.log('Navegando a la web...');
        await page.goto('https://www.publicidadconcursal.es/consulta-publicidad-concursal-new', {
            waitUntil: 'networkidle0',
        });

        console.log('Esperando selector...');
        await page.waitForSelector('#busquedaNombre', { timeout: 10000 });

        console.log('Rellenando formulario...');
        await page.type('#busquedaNombre', nombreEmpresa);
        await page.type('#busquedaNif', cif);

        console.log('Haciendo clic en Buscar...');
        await Promise.all([
            page.click('#btnBuscar'),
            page.waitForNavigation({ waitUntil: 'networkidle0' }),
        ]);

        console.log('Extrayendo resultados...');
        const resultados = await page.$$eval('.tablaResultados tbody tr', filas => {
            return filas.map(fila => {
                const celdas = fila.querySelectorAll('td');
                return {
                    nombre: celdas[0]?.innerText.trim(),
                    cif: celdas[1]?.innerText.trim(),
                    juzgado: celdas[2]?.innerText.trim(),
                    procedimiento: celdas[3]?.innerText.trim(),
                    estado: celdas[4]?.innerText.trim(),
                    fecha: celdas[5]?.innerText.trim()
                };
            });
        });

        await browser.close();

        console.log('Guardando output...');
        await Actor.setValue('OUTPUT', {
            encontrado: resultados.length > 0,
            concursos: resultados,
            input
        });

    } catch (error) {
        console.error('Error detectado:', error);
        await Actor.setValue('OUTPUT', {
            ok: false,
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
});
