const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const http = require('http');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT_DIR = '/Users/emorosini/Downloads/Instrumentos/_orquestacion/salidas/AMBITOS_UI';

async function main() {
  console.log('=== GENERANDO CAPTURAS VISUALES DE ÁMBITOS Y ENFOQUES DE DECISIÓN ===');
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const outDir = path.join(process.cwd(), 'out');
  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/') reqPath = '/index.html';
    const filePath = path.join(outDir, reqPath);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      res.writeHead(200);
      fs.createReadStream(filePath).pipe(res);
    } else if (fs.existsSync(filePath + '.html')) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      fs.createReadStream(filePath + '.html').pipe(res);
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  const PORT = 3462;
  await new Promise(r => server.listen(PORT, r));

  try {
    const browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    // 1. Vista General (Sin parámetro)
    console.log('1. Capturando Vista General (Canónica por 6 Ejes)...');
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
      const el = document.getElementById('biblioteca');
      if (el) el.scrollIntoView();
    });
    await new Promise(r => setTimeout(r, 300));
    await page.screenshot({
      path: path.join(OUT_DIR, '1_vista_general_canonica.png'),
      fullPage: false
    });
    console.log('   ✓ Guardada: 1_vista_general_canonica.png');

    // 2. Vista Educativa
    console.log('\n2. Capturando Psicología Educativa (?ambito=educativo)...');
    await page.goto(`http://localhost:${PORT}/?ambito=educativo`, { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
      const el = document.getElementById('biblioteca');
      if (el) el.scrollIntoView();
    });
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({
      path: path.join(OUT_DIR, '2_vista_educativo_7secciones.png'),
      fullPage: false
    });
    console.log('   ✓ Guardada: 2_vista_educativo_7secciones.png');

    // 3. Vista Educativa filtrada por sección (Atención y funciones ejecutivas)
    console.log('\n3. Capturando Sección Específica (Atención y FE)...');
    const secPills = await page.$$('.section-pill');
    if (secPills.length > 2) {
      await secPills[2].evaluate(b => b.click());
      await new Promise(r => setTimeout(r, 350));
      await page.screenshot({
        path: path.join(OUT_DIR, '3_vista_educativo_seccion_fe.png'),
        fullPage: false
      });
      console.log('   ✓ Guardada: 3_vista_educativo_seccion_fe.png');
    }

    // 4. Detalle de instrumento expandido (con metadatos y baremos no verificado)
    console.log('\n4. Capturando Detalle de Instrumento Expandido...');
    const firstRowBtn = await page.waitForSelector('.instrument-main');
    await firstRowBtn.evaluate(b => b.click());
    await new Promise(r => setTimeout(r, 350));
    await page.screenshot({
      path: path.join(OUT_DIR, '4_detalle_instrumento_metadatos.png'),
      fullPage: false
    });
    console.log('   ✓ Guardada: 4_detalle_instrumento_metadatos.png');

    // 5. Vista Vocacional
    console.log('\n5. Capturando Orientación Vocacional (?ambito=vocacional)...');
    await page.goto(`http://localhost:${PORT}/?ambito=vocacional`, { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
      const el = document.getElementById('biblioteca');
      if (el) el.scrollIntoView();
    });
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({
      path: path.join(OUT_DIR, '5_vista_orientacion_vocacional.png'),
      fullPage: false
    });
    console.log('   ✓ Guardada: 5_vista_orientacion_vocacional.png');

    console.log(`\nTodas las capturas se guardaron exitosamente en:\n${OUT_DIR}\n`);
    await browser.close();
  } catch (err) {
    console.error('Error al capturar:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

main();
