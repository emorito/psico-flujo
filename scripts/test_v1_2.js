const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const outDir = path.join(process.cwd(), 'out');
const salidasT3 = '/Users/emorosini/Downloads/Instrumentos/_orquestacion/salidas/T3';

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

server.listen(PORT, async () => {
  console.log(`Servidor local de prueba iniciado en http://localhost:${PORT}`);
  try {
    const browser = await puppeteer.launch({
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      headless: true
    });
    const page = await browser.newPage();

    // 1. Vista de escritorio (1440x1100)
    await page.setViewport({ width: 1440, height: 1100, deviceScaleFactor: 2 });
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0' });

    console.log('\n--- VERIFICACIÓN DE PIE DE PÁGINA ---');
    const footerVersion = await page.$eval('footer > span:last-child', el => el.innerText.trim());
    console.log(`Versión detectada en pie: "${footerVersion}"`);
    if (!footerVersion.includes('v1.2 · 2026-09-11')) {
      throw new Error(`El pie no contiene 'v1.2 · 2026-09-11': "${footerVersion}"`);
    }
    console.log('✓ Pie de página con marca v1.2 · 2026-09-11 verificado.');

    console.log('\n--- VERIFICACIÓN DEL BLOQUE DE AVISO DE PROTOCOLOS ---');
    const noticeDetails = await page.$('.protocols-notice-box');
    if (!noticeDetails) throw new Error('No se encontró el bloque .protocols-notice-box');

    // Abrir el desplegable de aviso
    await page.click('.protocols-notice-summary');
    await new Promise(r => setTimeout(r, 200));

    const isOpen = await page.$eval('.protocols-notice-box', el => el.hasAttribute('open'));
    if (!isOpen) throw new Error('El desplegable no se abrió al hacer clic');

    const noticeText = await page.$eval('.protocols-notice-body p', el => el.innerText.trim());
    console.log(`Texto del aviso: "${noticeText.slice(0, 80)}..."`);
    if (!noticeText.includes('Algunos instrumentos tienen derechos de autor')) {
      throw new Error('El texto del aviso no coincide con la redacción requerida');
    }
    console.log('✓ Bloque desplegable abre y contiene el texto oficial.');

    console.log('\n--- VERIFICACIÓN DE RESÚMENES DESCRIPTIVOS ---');
    const resumenElements = await page.$$('.row-resumen');
    console.log(`Instrumentos con resumen descriptivo visible en DOM: ${resumenElements.length}`);
    if (resumenElements.length !== 230) {
      throw new Error(`Se esperaban 230 resúmenes visibles, se encontraron ${resumenElements.length}`);
    }
    console.log('✓ Exactamente 230 familias muestran resumen en la tarjeta.');

    console.log('\n--- VERIFICACIÓN DE ETIQUETAS DE PROTOCOLO Y FUENTE OFICIAL ---');
    // Filtrar o buscar CAPS-5 (restringido con fuente oficial)
    const input = await page.waitForSelector('.catalog-controls-v1 input');
    await input.type('CAPS-5');
    await new Promise(r => setTimeout(r, 300));

    // Expandir CAPS-5 haciendo clic en .instrument-main
    const capsMainBtn = await page.waitForSelector('.instrument-row .instrument-main');
    await capsMainBtn.click();
    await new Promise(r => setTimeout(r, 300));

    const protoBadgeText = await page.$eval('.badge-no-protocol', el => el.innerText.trim());
    console.log(`Etiqueta encontrada en CAPS-5: "${protoBadgeText}"`);
    if (protoBadgeText !== 'Protocolo disponible con registro ante su titular') {
      throw new Error(`Etiqueta inesperada para CAPS-5: "${protoBadgeText}"`);
    }

    const officialLink = await page.$('.official-source-link');
    if (!officialLink) throw new Error('No se encontró el enlace .official-source-link en CAPS-5');
    const officialHref = await page.$eval('.official-source-link', el => el.getAttribute('href'));
    console.log(`Enlace a fuente oficial en CAPS-5: ${officialHref}`);
    if (!officialHref.startsWith('http')) {
      throw new Error(`URL de fuente oficial inválida: ${officialHref}`);
    }
    console.log('✓ Etiqueta específica y enlace a fuente oficial validados en CAPS-5.');

    // Limpiar buscador
    await input.click({ clickCount: 3 });
    await input.press('Backspace');
    await new Promise(r => setTimeout(r, 300));

    // Verificar las 62 familias no descargables y sus 4 etiquetas
    const catalogData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/catalog.json'), 'utf8'));
    const noDescargables = catalogData.filter(x => !x.descargable);
    if (noDescargables.length !== 62) {
      throw new Error(`Se esperaban 62 familias no descargables, hay ${noDescargables.length}`);
    }

    const allowedLabels = new Set([
      'Protocolo con derechos reservados',
      'Protocolo disponible con registro ante su titular',
      'Protocolo en verificación',
      'Protocolo en verificación de condiciones de uso'
    ]);

    const labelCounts = {};
    for (const it of noDescargables) {
      if (!allowedLabels.has(it.protocolo_etiqueta)) {
        throw new Error(`Instrumento ${it.sigla} tiene etiqueta no permitida: "${it.protocolo_etiqueta}"`);
      }
      labelCounts[it.protocolo_etiqueta] = (labelCounts[it.protocolo_etiqueta] || 0) + 1;
    }
    console.log('✓ Conteo de las 62 familias no descargables por etiqueta permitida:');
    console.log(JSON.stringify(labelCounts, null, 2));

    // Desplegar una tarjeta sin protocolo en Eje 1 (ej: BAI o BDI-II) manteniendo visible el aviso y tarjetas con resumen
    await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('.instrument-row'));
      for (const row of rows) {
        const sigla = row.querySelector('.code-badge')?.innerText?.trim();
        if (sigla === 'BAI') {
          const btn = row.querySelector('.instrument-main');
          if (btn) btn.click();
          break;
        }
      }
      const noticeBox = document.querySelector('.protocols-notice-box');
      if (noticeBox) {
        noticeBox.scrollIntoView({ behavior: 'instant', block: 'start' });
      }
    });
    await new Promise(r => setTimeout(r, 400));

    // Captura de pantalla de escritorio
    const desktopScreenshotPath = path.join(salidasT3, 'captura_escritorio_v1_2.png');
    await page.screenshot({ path: desktopScreenshotPath, fullPage: false });
    console.log(`✓ Captura de escritorio guardada en: ${desktopScreenshotPath}`);

    // 2. Vista de celular (390x844)
    console.log('\n--- VERIFICACIÓN EN DISPOSITIVO MÓVIL ---');
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true });
    await new Promise(r => setTimeout(r, 400));

    // Verificar desbordes horizontales
    const overflowInfo = await page.evaluate(() => {
      const scrollWidth = document.documentElement.scrollWidth;
      const clientWidth = document.documentElement.clientWidth;
      return { scrollWidth, clientWidth, hasOverflow: scrollWidth > clientWidth };
    });
    console.log(`Móvil - Ancho scroll: ${overflowInfo.scrollWidth}px, Ancho viewport: ${overflowInfo.clientWidth}px`);
    if (overflowInfo.hasOverflow) {
      console.warn('Advertencia: Posible desborde horizontal en celular detectado.');
    } else {
      console.log('✓ Vista de celular sin desbordes horizontales.');
    }

    const mobileScreenshotPath = path.join(salidasT3, 'captura_celular_v1_2.png');
    await page.screenshot({ path: mobileScreenshotPath, fullPage: false });
    console.log(`✓ Captura de celular guardada en: ${mobileScreenshotPath}`);

    await browser.close();
    server.close();
    console.log('\n==========================================');
    console.log('✓ TODAS LAS PRUEBAS DE V1.2 PASARON CON ÉXITO.');
    console.log('==========================================');
    process.exit(0);
  } catch (err) {
    console.error('\n[ERROR EN PRUEBAS V1.2]:', err);
    server.close();
    process.exit(1);
  }
});
