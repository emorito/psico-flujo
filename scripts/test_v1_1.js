const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const outDir = path.join(process.cwd(), 'out');
const salidasT2 = '/Users/emorosini/Downloads/Instrumentos/_orquestacion/salidas/T2';

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

const PORT = 3459;

server.listen(PORT, async () => {
  console.log(`Servidor local iniciado en http://localhost:${PORT}`);
  try {
    const browser = await puppeteer.launch({
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      headless: true
    });
    const page = await browser.newPage();

    // 1. Vista de escritorio
    await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 2 });
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0' });

    await page.evaluate(() => {
      const el = document.querySelector('.theme-section');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await new Promise(r => setTimeout(r, 400));

    // Captura de escritorio
    const themeSectionDesktop = await page.$('.theme-section');
    const desktopScreenshotPath = path.join(salidasT2, 'captura_escritorio_temas.png');
    await themeSectionDesktop.screenshot({ path: desktopScreenshotPath });
    console.log(`✓ Captura de escritorio guardada en: ${desktopScreenshotPath}`);

    // 2. Vista de celular
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true });
    await page.evaluate(() => {
      const el = document.querySelector('.theme-section');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await new Promise(r => setTimeout(r, 400));

    // Captura de celular (12 temas visibles + toggle)
    const themeSectionMobile = await page.$('.theme-section');
    const mobileScreenshotPath = path.join(salidasT2, 'captura_celular_temas.png');
    await themeSectionMobile.screenshot({ path: mobileScreenshotPath });
    console.log(`✓ Captura de celular guardada en: ${mobileScreenshotPath}`);

    // Volver a viewport de escritorio para pruebas de interacción
    await page.setViewport({ width: 1440, height: 900 });

    async function setQuery(q) {
      const input = await page.waitForSelector('.catalog-controls-v1 input');
      await input.click({ clickCount: 3 });
      await input.press('Backspace');
      if (q) {
        await input.type(q);
      }
      await new Promise(r => setTimeout(r, 200));
      const summary = await page.$eval('.catalog-summary span:first-child', el => el.innerText.trim());
      return parseInt(summary.split(' ')[0], 10);
    }

    // 3. Pruebas de búsqueda: TOC, TEPT, depresion, depresión
    console.log('\n--- VERIFICACIÓN DE BÚSQUEDA ---');
    const c_toc = await setQuery('TOC');
    console.log(`Búsqueda 'TOC': ${c_toc} familias encontradas`);
    if (c_toc < 1) throw new Error("Búsqueda 'TOC' devolvió 0 resultados");

    const c_tept = await setQuery('TEPT');
    console.log(`Búsqueda 'TEPT': ${c_tept} familias encontradas`);
    if (c_tept < 1) throw new Error("Búsqueda 'TEPT' devolvió 0 resultados");

    const c_dep = await setQuery('depresion');
    const c_dept = await setQuery('depresión');
    console.log(`Búsqueda 'depresion': ${c_dep} | 'depresión': ${c_dept}`);
    if (c_dep !== c_dept) throw new Error("'depresion' y 'depresión' tienen conteos distintos");
    if (c_dep < 1) throw new Error("'depresion' devolvió 0 resultados");

    // Limpiar búsqueda
    await setQuery('');

    // 4. Verificación de los 38 temas
    console.log('\n--- VERIFICACIÓN DE TEMAS CLÍNICOS ---');
    const themeButtons = await page.$$('.theme-cloud .theme-tag:not(:first-child)');
    console.log(`Botones de temas encontrados en UI: ${themeButtons.length}`);
    if (themeButtons.length !== 38) {
      throw new Error(`Se esperaban 38 botones de tema, se encontraron ${themeButtons.length}`);
    }

    let sumFamilies = 0;
    for (let i = 0; i < themeButtons.length; i++) {
      // Re-query to avoid stale element reference
      const buttons = await page.$$('.theme-cloud .theme-tag:not(:first-child)');
      const btn = buttons[i];
      const text = await page.evaluate(el => el.querySelector('span').innerText.trim(), btn);
      const badgeCount = await page.evaluate(el => parseInt(el.querySelector('small').innerText.trim(), 10), btn);

      // Clic para filtrar
      await btn.click();
      await new Promise(r => setTimeout(r, 100));

      const summary = await page.$eval('.catalog-summary span:first-child', el => el.innerText.trim());
      const filteredCount = parseInt(summary.split(' ')[0], 10);

      if (filteredCount !== badgeCount) {
        throw new Error(`Tema "${text}": el badge indica ${badgeCount} pero filtra ${filteredCount}`);
      }
      if (filteredCount < 1) {
        throw new Error(`Tema "${text}" filtra 0 familias`);
      }
      sumFamilies += filteredCount;

      // Desmarcar
      await btn.click();
      await new Promise(r => setTimeout(r, 50));
    }
    console.log(`✓ Los 38 temas filtran al menos 1 familia.`);
    console.log(`✓ Suma total de familias por tema: ${sumFamilies} (cubre exactamente las 231 familias).`);
    if (sumFamilies !== 231) {
      throw new Error(`La suma de familias (${sumFamilies}) no coincide con 231`);
    }

    // 5. Verificación de banner para Mayores (65+)
    console.log('\n--- VERIFICACIÓN DE FRANJA MAYORES ---');
    const franjaButtons = await page.$$('.filter-tags button');
    // Button for mayores is in the second filter-row
    const mayoresBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('.filter-tags button'));
      return btns.find(b => b.innerText.includes('Mayores'));
    });
    await mayoresBtn.click();
    await new Promise(r => setTimeout(r, 200));

    const bannerExists = await page.$('.clinical-warning-banner');
    if (!bannerExists) throw new Error("No se mostró el banner clínico para personas mayores");
    const bannerText = await page.$eval('.clinical-warning-banner p', el => el.innerText.trim());
    console.log(`✓ Banner clínico visible para Mayores: "${bannerText.slice(0, 70)}..."`);

    // 6. Verificación de marca de versión en el pie
    console.log('\n--- VERIFICACIÓN DE PIE DE PÁGINA ---');
    const footerVersion = await page.$eval('footer > span:last-child', el => el.innerText.trim());
    console.log(`Versión en pie de página: "${footerVersion}"`);
    if (!footerVersion.includes('v1.1')) {
      throw new Error(`El pie no contiene 'v1.1': "${footerVersion}"`);
    }

    await browser.close();
    server.close();
    console.log('\n==========================================');
    console.log('✓ TODAS LAS PRUEBAS DE V1.1 PASARON EXITOSAMENTE.');
    console.log('==========================================');
    process.exit(0);
  } catch (err) {
    console.error('\n[ERROR EN PRUEBAS V1.1]:', err);
    server.close();
    process.exit(1);
  }
});
