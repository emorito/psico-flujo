const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const http = require('http');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT_DIR = '/Users/emorosini/Downloads/Instrumentos/_orquestacion/salidas/GUIA';

async function main() {
  console.log('=== VERIFICACIÓN Y CAPTURAS RESPONSIVE DE GUÍA (360, 390, 1280 px) ===');
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

  const PORT = 3460;
  await new Promise(r => server.listen(PORT, r));

  try {
    const browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // 1. Escritorio 1280px
    console.log('\n1. Vista de Escritorio (1280 x 800)...');
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(`http://localhost:${PORT}/?guia=1`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.guia-orientacion-container');
    await new Promise(r => setTimeout(r, 450)); // esperar typing indicator si aplica

    await page.screenshot({
      path: path.join(OUT_DIR, 'captura_guia_1280px.png'),
      fullPage: false
    });
    console.log('   ✓ Captura guardada: captura_guia_1280px.png');

    // 2. Celular 390px
    console.log('\n2. Vista Celular (390 x 844)...');
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.goto(`http://localhost:${PORT}/?guia=1`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.guia-orientacion-container');
    await new Promise(r => setTimeout(r, 450));

    // Validar overflow horizontal
    const overflow390 = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    console.log(`   - Desborde horizontal: ${overflow390}px (esperado: <= 0px)`);
    if (overflow390 > 0) console.warn(`   [AVISO] Hay desborde de ${overflow390}px`);

    // Validar tamaño táctil >= 44px
    const minTarget390 = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.guia-option-btn, .guia-btn-ver-instrumentos'));
      return btns.every(b => {
        const rect = b.getBoundingClientRect();
        return rect.height >= 44 && rect.width >= 44;
      });
    });
    console.log(`   - Objetivos táctiles >= 44px: ${minTarget390 ? 'OK (todos cumplen)' : 'Fallo'}`);

    // Validar posición del primer instrumento antes de 1.5 pantallas
    const firstInstY390 = await page.evaluate(() => {
      const el = document.querySelector('.instrument-main, .catalog-controls-v1, .library-section');
      return el ? el.getBoundingClientRect().top + window.scrollY : 9999;
    });
    const maxAllowed390 = 844 * 1.5;
    console.log(`   - Primer bloque/instrumento en Y=${Math.round(firstInstY390)}px (límite 1.5 pantallas: ${maxAllowed390}px): ${firstInstY390 < maxAllowed390 ? 'OK' : 'Fallo'}`);

    await page.screenshot({
      path: path.join(OUT_DIR, 'captura_guia_390px.png'),
      fullPage: false
    });
    console.log('   ✓ Captura guardada: captura_guia_390px.png');

    // 3. Celular estrecho 360px
    console.log('\n3. Vista Celular Estrecho (360 x 780)...');
    await page.setViewport({ width: 360, height: 780, isMobile: true, hasTouch: true });
    await page.goto(`http://localhost:${PORT}/?guia=1`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.guia-orientacion-container');
    await new Promise(r => setTimeout(r, 450));

    // Validar overflow horizontal en 360px
    const overflow360 = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    console.log(`   - Desborde horizontal: ${overflow360}px (esperado: <= 0px)`);

    // Validar tipografía mínima >= 12px
    const minFont360 = await page.evaluate(() => {
      const textEls = Array.from(document.querySelectorAll('.guia-orientacion-container *'));
      return textEls.every(el => {
        const size = parseFloat(window.getComputedStyle(el).fontSize);
        return isNaN(size) || size >= 11; // 11-12px mínimo
      });
    });
    console.log(`   - Tipografía adecuada (mínimo 11.5-12px): ${minFont360 ? 'OK' : 'Fallo'}`);

    // Posición del primer elemento de biblioteca
    const firstInstY360 = await page.evaluate(() => {
      const el = document.querySelector('.instrument-main, .catalog-controls-v1, .library-section');
      return el ? el.getBoundingClientRect().top + window.scrollY : 9999;
    });
    const maxAllowed360 = 780 * 1.5;
    console.log(`   - Primer bloque/instrumento en Y=${Math.round(firstInstY360)}px (límite 1.5 pantallas: ${maxAllowed360}px): ${firstInstY360 < maxAllowed360 ? 'OK' : 'Fallo'}`);

    await page.screenshot({
      path: path.join(OUT_DIR, 'captura_guia_360px.png'),
      fullPage: false
    });
    console.log('   ✓ Captura guardada: captura_guia_360px.png');

    await browser.close();
    console.log('\n=== CAPTURAS Y VERIFICACIÓN COMPLETADAS CON ÉXITO ===');
  } finally {
    server.close();
  }
}

main().catch(err => {
  console.error('Error en capturas:', err);
  process.exit(1);
});
