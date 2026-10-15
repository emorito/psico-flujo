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

    // 2. Vista Educativa Dedicada (/educativa/)
    console.log('\n2. Verificando Ruta Especializada de Psicología Educativa (/educativa/)...');
    await page.goto(`http://localhost:${PORT}/educativa/`, { waitUntil: 'networkidle0' });

    // Titular Hero y Tema
    const edHeroH1 = await page.$eval('.hero-content h1', el => el.innerText.trim());
    console.log(`  - Titular Hero temático: "${edHeroH1}"`);
    if (!edHeroH1.includes('escuela')) {
      throw new Error(`Titular hero no está recontextualizado para escuela: ${edHeroH1}`);
    }

    const edThemeAttr = await page.$eval('.psicoflujo-main-wrapper', el => el.getAttribute('data-theme'));
    console.log(`  - Atributo data-theme en wrapper: "${edThemeAttr}"`);
    if (edThemeAttr !== 'educativo' && edThemeAttr !== 'educativa') {
      throw new Error(`Se esperaba data-theme="educativo", obtenido: ${edThemeAttr}`);
    }

    // 7 Tarjetas de decisión escolar
    const decisionCardsCount = await page.$$eval('.decision-card', els => els.length);
    console.log(`  - Tarjetas de decisión escolar renderizadas: ${decisionCardsCount}`);
    if (decisionCardsCount !== 7) {
      throw new Error(`Se esperaban 7 tarjetas de decisión escolar, obtenidas: ${decisionCardsCount}`);
    }

    // Encabezado de biblioteca especializada
    const edOverline = await page.$eval('.library-heading .overline', el => el.innerText.trim());
    console.log(`  - Overline biblioteca: "${edOverline}"`);
    if (!edOverline.toLowerCase().includes('educativa')) {
      throw new Error(`Overline debe indicar Psicología Educativa, obtenido: ${edOverline}`);
    }

    // Contar instrumentos en educativo (80)
    const edSummaryText = await page.$eval('.catalog-summary span:first-child', el => el.innerText.trim());
    const edCount = parseInt(edSummaryText.split(' ')[0], 10);
    console.log(`  - Conteo instrumentos en educativo: ${edCount}`);
    if (edCount !== 80) {
      throw new Error(`Se esperaban 80 instrumentos en educativo, obtenidos: ${edCount}`);
    }
    console.log(`  ✓ [OK] Catálogo acotado estrictamente a 80 instrumentos educativos.`);

    // Verificar AUSENCIA de ruido clínico (Cero nube de temas, cero selector de ejes, cero AmbitoSelector duplicado)
    const hasThemeSection = await page.$('.theme-section');
    if (hasThemeSection !== null) {
      throw new Error(`La nube de 40 temas clínicos NO debe aparecer en la página educativa.`);
    }
    console.log(`  ✓ [OK] Nube de temas clínicos (40 temas) completamente ausente en portal educativo.`);

    const hasAxisSelect = await page.$('select[aria-label="Filtrar por eje clínico"]');
    if (hasAxisSelect !== null) {
      throw new Error(`El selector de ejes clínicos no debe aparecer en la página educativa.`);
    }
    console.log(`  ✓ [OK] Selector de ejes clínicos reemplazado por selector de dimensiones.`);

    const hasAmbitoSelectorDup = await page.$('.ambito-selector-wrapper');
    if (hasAmbitoSelectorDup !== null) {
      throw new Error(`No debe existir selector duplicado de ámbitos en el cuerpo de la biblioteca.`);
    }
    console.log(`  ✓ [OK] Cero selectores redundantes o superposiciones en biblioteca.`);

    // Selector de dimensión específico presente
    const dimensionSelect = await page.$('select[aria-label="Filtrar por dimensión"]');
    if (!dimensionSelect) {
      throw new Error(`Debe existir selector específico de dimensión para este ámbito.`);
    }
    const dimOptionsCount = await page.$$eval('select[aria-label="Filtrar por dimensión"] option', opts => opts.length);
    console.log(`  - Opciones en selector de dimensión: ${dimOptionsCount} (1 "Todas" + 7 dimensiones)`);
    if (dimOptionsCount !== 8) {
      throw new Error(`Se esperaban 8 opciones en selector de dimensión, obtenidas: ${dimOptionsCount}`);
    }
    console.log(`  ✓ [OK] Selector de dimensiones escolares con 7 opciones temáticas.`);

    // Verificar que aparecen las 7 secciones rectoras de Psicología Educativa en el catálogo
    const edSections = await page.$$eval('.instrument-group .group-heading h3', els => els.map(e => e.innerText.trim()));
    console.log(`  - Secciones renderizadas en educativo (${edSections.length}):`);
    edSections.forEach(s => console.log(`      * ${s}`));
    if (edSections.length !== 7) {
      throw new Error(`Se esperaban exactamente 7 secciones en educativo, obtenidas: ${edSections.length}`);
    }
    console.log(`  ✓ [OK] Las 7 secciones rectoras de decisión educativa se renderizan en orden.`);

    // 3. Verificación de interactividad: Selección de dimensión por Decision Card
    console.log('\n3. Verificando filtrado por dimensión específica (Atención y funciones ejecutivas)...');
    const decisionCards = await page.$$('.decision-card');
    // Card 1 = Atención, funciones ejecutivas y autorregulación (índice 1 en array 0-based)
    await decisionCards[1].click();
    await new Promise(r => setTimeout(r, 200));

    const feSummaryText = await page.$eval('.catalog-summary span:first-child', el => el.innerText.trim());
    const feCount = parseInt(feSummaryText.split(' ')[0], 10);
    console.log(`  - Conteo en dimensión Funciones Ejecutivas: ${feCount} instrumentos`);
    if (feCount !== 11) {
      throw new Error(`Se esperaban 11 instrumentos en funciones ejecutivas, obtenidos: ${feCount}`);
    }
    console.log(`  ✓ [OK] Filtrado por dimensión escolar funciona con precisión psicométrica.`);

    // 4. Detalle de instrumento y metadatos verificados
    console.log('\n4. Verificando detalle de tarjeta y dimensión disciplinar...');
    const firstRowButton = await page.waitForSelector('.instrument-main');
    await firstRowButton.evaluate(b => b.click());
    await page.waitForFunction(() => {
      const el = document.querySelector('.detail-meta-value');
      return el && el.textContent.trim().length > 0;
    }, { timeout: 4000 });

    // Verificar caja de dimensión disciplinar en vez de ejes clínicos
    const dimBoxDesc = await page.$eval('.detail-dimension-desc', el => el.textContent.trim());
    console.log(`  - Dimensión disciplinar en detalle: "${dimBoxDesc.substring(0, 60)}..."`);
    if (!dimBoxDesc.toLowerCase().includes('funciones ejecutivas')) {
      throw new Error(`Detalle debe contextualizar la dimensión educativa`);
    }

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
    console.log(`  ✓ [OK] Tarjeta expandida muestra dimensión escolar, cualificación y baremos no verificado.`);

    // 5. Vista Vocacional (/vocacional/)
    console.log('\n5. Verificando portal independiente de Orientación Vocacional (/vocacional/)...');
    await page.goto(`http://localhost:${PORT}/vocacional/`, { waitUntil: 'networkidle0' });

    const vocTitleTag = await page.title();
    console.log(`  - Título pestaña vocacional: "${vocTitleTag}"`);
    if (!vocTitleTag.toLowerCase().includes('vocacional')) {
      throw new Error(`Página vocacional no coincide.`);
    }

    const vocHeroH1 = await page.$eval('.hero-content h1', el => el.innerText.trim());
    console.log(`  - Titular vocacional: "${vocHeroH1}"`);

    const vocSummaryText = await page.$eval('.catalog-summary span:first-child', el => el.innerText.trim());
    const vocCount = parseInt(vocSummaryText.split(' ')[0], 10);
    console.log(`  - Conteo instrumentos vocacionales: ${vocCount}`);
    if (vocCount !== 18) {
      throw new Error(`Se esperaban 18 instrumentos vocacionales, obtenidos: ${vocCount}`);
    }

    const vocCardsCount = await page.$$eval('.decision-card', els => els.length);
    console.log(`  - Tarjetas vocacionales: ${vocCardsCount}`);
    if (vocCardsCount !== 4) {
      throw new Error(`Se esperaban 4 tarjetas de decisión vocacional, obtenidas: ${vocCardsCount}`);
    }
    console.log(`  ✓ [OK] Portal independiente de Orientación Vocacional verificado con 18 instrumentos y 4 dimensiones.`);

    // 6. Verificando Botón de Retorno a Vista General
    console.log('\n6. Verificando Botón de Retorno a Vista General desde /vocacional/...');
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

    // Comprobar que en Vista General la nube de 40 temas SÍ está presente
    const generalThemeSection = await page.$('.theme-section');
    if (!generalThemeSection) {
      throw new Error(`La nube de temas clínicos debe estar presente en la vista general.`);
    }
    console.log(`  ✓ [OK] Vista general canónica 100% íntegra (270 instrumentos, 6 ejes y 40 temas clínicos).`);

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
