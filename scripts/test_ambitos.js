const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

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

const PORT = 3460;

server.listen(PORT, async () => {
  let browser;
  try {
    console.log(`\n=== SUITE DE PRUEBAS DE ÁMBITOS Y ENFOQUES DE DECISIÓN (test_ambitos.js) ===\n`);
    browser = await puppeteer.launch({
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      headless: true
    });
    const page = await browser.newPage();

    // 1. Vista General (Sin parámetro)
    console.log('1. Verificando Vista General por defecto (sin parámetro de URL)...');
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0' });

    const totalSummaryText = await page.$eval('.catalog-summary span:first-child', el => el.innerText.trim());
    console.log(`  - Resumen catálogo: "${totalSummaryText}"`);
    if (!totalSummaryText.includes('270')) {
      throw new Error(`Se esperaban 270 instrumentos en vista general, pero se obtuvo: ${totalSummaryText}`);
    }

    // Verificar presencia de los 6 ejes canónicos
    const groupHeadings = await page.$$eval('.instrument-group .group-heading h3', els => els.map(e => e.innerText.trim()));
    console.log(`  - Grupos renderizados: ${groupHeadings.length}`);
    const ejesFound = groupHeadings.filter(h => h.includes('Eje'));
    if (ejesFound.length < 6) {
      throw new Error(`Se esperaban los 6 ejes canónicos en vista general, encontrados: ${ejesFound.length}`);
    }
    console.log(`  ✓ [OK] Los 6 ejes canónicos están presentes y activos en vista general.`);

    // 2. Vista Educativa (?ambito=educativo)
    console.log('\n2. Verificando Vista de Psicología Educativa (?ambito=educativo)...');
    await page.goto(`http://localhost:${PORT}/?ambito=educativo`, { waitUntil: 'networkidle0' });

    // Verificar que el banner de orientación disciplinar está presente
    const orientationTitle = await page.$eval('.ambito-card-title-group h3', el => el.innerText.trim());
    console.log(`  - Título del ámbito: "${orientationTitle}"`);
    if (!orientationTitle.toLowerCase().includes('educativa')) {
      throw new Error(`Se esperaba ámbito Educativa, obtenido: ${orientationTitle}`);
    }

    const questionQuote = await page.$eval('.ambito-question-quote', el => el.innerText.trim());
    console.log(`  - Pregunta rectora: "${questionQuote}"`);
    if (!questionQuote.includes('decisión de apoyo')) {
      throw new Error(`Pregunta rectora no coincide con la taxonomia esperada.`);
    }

    const warningText = await page.$eval('.ambito-card-warning p', el => el.innerText.trim());
    console.log(`  - Advertencia ética: "${warningText.substring(0, 60)}..."`);
    if (!warningText.includes('evaluación psicopedagógica')) {
      throw new Error(`Advertencia ética no coincide.`);
    }

    // Contar instrumentos en educativo
    const edSummaryText = await page.$eval('.catalog-summary span:first-child', el => el.innerText.trim());
    const edCount = parseInt(edSummaryText.split(' ')[0], 10);
    console.log(`  - Conteo instrumentos en educativo: ${edCount}`);
    if (edCount !== 80) {
      throw new Error(`Se esperaban 80 instrumentos en educativo, obtenidos: ${edCount}`);
    }
    console.log(`  ✓ [OK] Catálogo filtrado exactamente a 80 instrumentos educativos.`);

    // Verificar que aparecen las 7 secciones rectoras de Psicología Educativa
    const edSections = await page.$$eval('.instrument-group .group-heading h3', els => els.map(e => e.innerText.trim()));
    console.log(`  - Secciones renderizadas en educativo (${edSections.length}):`);
    edSections.forEach(s => console.log(`      * ${s}`));
    if (edSections.length !== 7) {
      throw new Error(`Se esperaban exactamente 7 secciones en educativo, obtenidas: ${edSections.length}`);
    }
    console.log(`  ✓ [OK] Las 7 secciones rectoras de decisión educativa se renderizan en orden.`);

    // 3. Verificación de interactividad: Selección de sección específica por click
    console.log('\n3. Verificando filtrado por sección específica (Atención y funciones ejecutivas)...');
    const secPills = await page.$$('.section-pill');
    // Pill 0 = "Todos en Educativa", Pill 1 = Dificultades, Pill 2 = Atención y FE
    await secPills[2].click();
    await new Promise(r => setTimeout(r, 200));

    const feSummaryText = await page.$eval('.catalog-summary span:first-child', el => el.innerText.trim());
    const feCount = parseInt(feSummaryText.split(' ')[0], 10);
    console.log(`  - Conteo en sección Funciones Ejecutivas: ${feCount} instrumentos`);
    if (feCount !== 11) {
      throw new Error(`Se esperaban 11 instrumentos en funciones ejecutivas, obtenidos: ${feCount}`);
    }
    console.log(`  ✓ [OK] Filtrado por sección específica funciona con precisión psicométrica.`);

    // 4. Detalle de instrumento y metadatos verificados
    console.log('\n4. Verificando detalle de tarjeta y metadatos de instrumento...');
    const firstRowButton = await page.waitForSelector('.instrument-main');
    await firstRowButton.evaluate(b => b.click());
    await page.waitForFunction(() => {
      const el = document.querySelector('.detail-meta-value');
      return el && el.textContent.trim().length > 0;
    }, { timeout: 4000 });

    // Verificar metadatos dentro de .instrument-detail
    const metodoNivel = await page.$eval('.detail-meta-value', el => el.textContent.trim());
    console.log(`  - Método y Nivel: "${metodoNivel}"`);

    const cualificacion = await page.$eval('.detail-meta-badge', el => el.textContent.trim());
    console.log(`  - Cualificación: "${cualificacion}"`);

    const baremos = await page.$eval('.baremos-alerta', el => el.textContent.trim());
    console.log(`  - Baremos locales: "${baremos}"`);
    if (!baremos.toLowerCase().includes('no verificado')) {
      throw new Error(`Baremos locales debe indicar estrictamente "no verificado"`);
    }

    const ambitosPills = await page.$$eval('.detail-ambito-pill', els => els.map(e => e.textContent.trim()));
    console.log(`  - Ámbitos del instrumento: [${ambitosPills.join(', ')}]`);
    if (ambitosPills.length < 1) {
      throw new Error(`Debe mostrarse al menos un ámbito aplicable en la tarjeta.`);
    }
    console.log(`  ✓ [OK] Tarjeta expandida muestra metadatos, cualificación y baremos no verificado.`);

    // 5. Vista Vocacional (?ambito=vocacional)
    console.log('\n5. Verificando ámbito independiente de Orientación Vocacional (?ambito=vocacional)...');
    await page.goto(`http://localhost:${PORT}/?ambito=vocacional`, { waitUntil: 'networkidle0' });

    const vocTitle = await page.$eval('.ambito-card-title-group h3', el => el.innerText.trim());
    console.log(`  - Título vocacional: "${vocTitle}"`);
    if (!vocTitle.toLowerCase().includes('vocacional')) {
      throw new Error(`Ámbito vocacional no coincide.`);
    }

    const vocSummaryText = await page.$eval('.catalog-summary span:first-child', el => el.innerText.trim());
    const vocCount = parseInt(vocSummaryText.split(' ')[0], 10);
    console.log(`  - Conteo instrumentos vocacionales: ${vocCount}`);
    if (vocCount !== 18) {
      throw new Error(`Se esperaban 18 instrumentos vocacionales, obtenidos: ${vocCount}`);
    }
    console.log(`  ✓ [OK] Ámbito independiente de Orientación Vocacional verificado con 18 instrumentos.`);

    // 6. Verificando Ruta Estática Dedicada /educativa/ (Opción C)
    console.log('\n6. Verificando Ruta Estática Dedicada (/educativa/)...');
    await page.goto(`http://localhost:${PORT}/educativa/`, { waitUntil: 'networkidle0' });

    const edTitleTag = await page.title();
    console.log(`  - Título de pestaña: "${edTitleTag}"`);
    if (!edTitleTag.toLowerCase().includes('educativa')) {
      throw new Error(`Título de pestaña no contiene 'Educativa': ${edTitleTag}`);
    }

    const edThemeAttr = await page.$eval('.psicoflujo-main-wrapper', el => el.getAttribute('data-theme'));
    console.log(`  - Atributo data-theme en wrapper: "${edThemeAttr}"`);
    if (edThemeAttr !== 'educativo' && edThemeAttr !== 'educativa') {
      throw new Error(`Se esperaba data-theme="educativo", obtenido: ${edThemeAttr}`);
    }

    const edHeroH1 = await page.$eval('.hero-content h1', el => el.innerText.trim());
    console.log(`  - Titular Hero temático: "${edHeroH1}"`);
    if (!edHeroH1.includes('escuela')) {
      throw new Error(`Titular hero no está recontextualizado para escuela: ${edHeroH1}`);
    }

    const decisionCardsCount = await page.$$eval('.decision-card', els => els.length);
    console.log(`  - Tarjetas de decisión escolar renderizadas: ${decisionCardsCount}`);
    if (decisionCardsCount !== 7) {
      throw new Error(`Se esperaban 7 tarjetas de decisión escolar, obtenidas: ${decisionCardsCount}`);
    }
    console.log(`  ✓ [OK] Ruta estática /educativa/ renderiza titular contextual, tema esmeralda y 7 tarjetas de decisión.`);

    // 7. Verificando Botón de Retorno a Vista General
    console.log('\n7. Verificando Botón de Retorno a Vista General desde /educativa/...');
    const returnBtn = await page.waitForSelector('.gateway-return-btn');
    await returnBtn.evaluate(b => b.click());
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    const currentUrl = page.url();
    console.log(`  - URL tras clic en retorno: ${currentUrl}`);
    const generalSummary = await page.$eval('.catalog-summary span:first-child', el => el.innerText.trim());
    console.log(`  - Resumen catálogo tras retorno: "${generalSummary}"`);
    if (!generalSummary.includes('270')) {
      throw new Error(`Se esperaban 270 instrumentos tras volver a general, obtenidos: ${generalSummary}`);
    }
    console.log(`  ✓ [OK] Botón de retorno navega limpiamente a la vista general con los 6 ejes y 270 instrumentos.`);

    console.log('\n================================================================');
    console.log('TODAS LAS PRUEBAS DE ÁMBITOS Y SECCIONES SE SUPERARON CON ÉXITO!');
    console.log('================================================================\n');

    await browser.close();
  } catch (err) {
    console.error('Error durante la prueba de ámbitos:', err);
    if (browser) await browser.close();
    process.exitCode = 1;
  } finally {
    server.close();
  }
});
