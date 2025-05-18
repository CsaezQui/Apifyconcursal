import { Actor } from 'apify';
import playwright from 'playwright';

await Actor.main(async () => {
    const input = await Actor.getInput();
    const { nombreEmpresa, cif } = input;
    const browser = await playwright.chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    console.log(`Buscando datos para empresa: ${nombreEmpresa}, CIF: ${cif}`);

    try {
        await page.goto('https://www.publicidadconcursal.es/consulta-publicidad-concursal-new', {
            waitUntil: 'networkidle',
            timeout: 60000,
        });

        // Rellenar campos
        await page.fill('input[placeholder*="nombre"]', nombreEmpresa);
        await page.fill('input[placeholder*="NIF"]', cif);

        // Pulsar botón Buscar
        await Promise.all([
            page.click('button:has-text("Buscar")'),
            page.waitForResponse(resp => resp.url().includes('buscarConcursos') && resp.status() === 200, { timeout: 60000 }),
        ]);

        // Extraer resultados
        const rows = await page.$$('.tablaResultados tbody tr');
        if (rows.length === 0) {
            await Actor.setValue('OUTPUT', { ok: false, mensaje: 'No hay situación concursal' });
        } else {
            const datos = await page.$$eval('.tablaResultados tbody tr', trs =>
                trs.map(tr => {
                    const cells = Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim());
                    return {
                        nombre: cells[0],
                        cif: cells[1],
                        juzgado: cells[2],
                        procedimiento: cells[3],
                        estado: cells[4],
                        fecha: cells[5],
                    };
                })
            );
            await Actor.setValue('OUTPUT', { ok: true, concursos: datos });
        }
    } catch (err) {
        console.error('Error detectado:', err);
        await Actor.setValue('OUTPUT', { ok: false, error: err.message });
    } finally {
        await browser.close();
    }
});
