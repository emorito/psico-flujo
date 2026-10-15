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
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  let filePath = path.join(outDir, reqPath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  } else if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
    filePath = filePath + '.html';
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
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

    // 1. Vista General (Canónica: barra superior, hero y 6 ejes)
    console.log('1. Capturando Vista General (Canónica con Gateway Superior)...');
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({
      path: path.join(OUT_DIR, '1_vista_general_canonica.png'),
      fullPage: false
    });
    console.log('   ✓ Guardada: 1_vista_general_canonica.png');

    // 2. Ruta Dedicada /educativa/ (Atmósfera Esmeralda, Titular Contextual y Botón de Retorno)
    console.log('\n2. Capturando Portal Dedicado /educativa/ (Metamorfosis Verde Esmeralda)...');
    await page.goto(`http://localhost:${PORT}/educativa/`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({
      path: path.join(OUT_DIR, '2_vista_educativo_7secciones.png'),
      fullPage: false
    });
    console.log('   ✓ Guardada: 2_vista_educativo_7secciones.png (Home Educativo)');

    // 3. Tarjetas de Decisión Escolar (DecisionCards)
    console.log('\n3. Capturando Tarjetas de Decisión Escolar...');
    await page.evaluate(() => {
      const el = document.querySelector('.decision-cards-section');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await new Promise(r => setTimeout(r, 350));
    await page.screenshot({
      path: path.join(OUT_DIR, '3_vista_educativo_seccion_fe.png'),
      fullPage: false
    });
    console.log('   ✓ Guardada: 3_vista_educativo_seccion_fe.png (DecisionCards)');

    // 4. Detalle de instrumento expandido (con metadatos y baremos no verificado)
    console.log('\n4. Capturando Detalle de Instrumento Expandido...');
    await page.evaluate(() => {
      const el = document.getElementById('biblioteca');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await new Promise(r => setTimeout(r, 300));
    const firstRowBtn = await page.waitForSelector('.instrument-main');
    await firstRowBtn.evaluate(b => b.click());
    await new Promise(r => setTimeout(r, 400));
    await page.evaluate(() => {
      const detail = document.querySelector('.instrument-detail');
      if (detail) {
        detail.scrollIntoView({ behavior: 'instant', block: 'center' });
      }
    });
    await new Promise(r => setTimeout(r, 300));
    await page.screenshot({
      path: path.join(OUT_DIR, '4_detalle_instrumento_metadatos.png'),
      fullPage: false
    });
    console.log('   ✓ Guardada: 4_detalle_instrumento_metadatos.png');

    // 5. Portal Dedicado /vocacional/ (Atmósfera Ámbar y Proyecto de Vida)
    console.log('\n5. Capturando Portal Dedicado /vocacional/ (Metamorfosis Ámbar)...');
    await page.goto(`http://localhost:${PORT}/vocacional/`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({
      path: path.join(OUT_DIR, '5_vista_orientacion_vocacional.png'),
      fullPage: false
    });
    console.log('   ✓ Guardada: 5_vista_orientacion_vocacional.png');

    // 6. Catálogo Especializado Limpio en /educativa/ (Filtros de dimensión, sin nube clínica)
    console.log('\n6. Capturando Biblioteca Limpia en /educativa/ (Catálogo Especializado)...');
    await page.goto(`http://localhost:${PORT}/educativa/`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 400));
    await page.evaluate(() => {
      const el = document.getElementById('biblioteca');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await new Promise(r => setTimeout(r, 350));
    await page.screenshot({
      path: path.join(OUT_DIR, '6_biblioteca_limpia_educativa.png'),
      fullPage: false
    });
    console.log('   ✓ Guardada: 6_biblioteca_limpia_educativa.png');

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
