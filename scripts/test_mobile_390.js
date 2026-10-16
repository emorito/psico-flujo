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

const PORT = 3470;

server.listen(PORT, async () => {
  let browser;
  try {
    console.log(`\n=== PRUEBA DE SELECTOR DE ÁREAS A 390PX VIEWPORT ===\n`);
    browser = await puppeteer.launch({
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0' });

    // 1. Evaluar píldoras y caja delimitadora
    const evaluation = await page.evaluate(() => {
      const pillsRow = document.querySelector('.gateway-pills-row');
      const pills = Array.from(document.querySelectorAll('.gateway-pill'));
      const wrapper = document.querySelector('.gateway-scroll-wrapper');
      
      const pillsInfo = pills.map(p => {
        const rect = p.getBoundingClientRect();
        const nameEl = p.querySelector('.gateway-pill-name');
        const countEl = p.querySelector('.gateway-pill-count');
        const comp = window.getComputedStyle(p);
        return {
          text: p.innerText.replace(/\s+/g, ' ').trim(),
          name: nameEl ? nameEl.innerText : '',
          count: countEl ? countEl.innerText : '',
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          left: Math.round(rect.left),
          flexShrink: comp.flexShrink,
          minWidth: comp.minWidth
        };
      });

      const wrapperComp = window.getComputedStyle(wrapper, '::after');

      return {
        rowScrollWidth: pillsRow.scrollWidth,
        rowClientWidth: pillsRow.clientWidth,
        isScrollable: pillsRow.scrollWidth > pillsRow.clientWidth,
        initialScrollLeft: pillsRow.scrollLeft,
        pills: pillsInfo,
        hasGradientOverlay: !!wrapperComp.content && wrapperComp.backgroundImage.includes('gradient')
      };
    });

    console.log(`- Contenedor deslizable: ${evaluation.isScrollable ? 'SÍ' : 'NO'} (scrollWidth: ${evaluation.rowScrollWidth}px, clientWidth: ${evaluation.rowClientWidth}px)`);
    console.log(`- Señal visual de degradé lateral (::after): ${evaluation.hasGradientOverlay ? 'PRESENTE' : 'AUSENTE'}`);
    console.log(`- Píldoras detectadas (${evaluation.pills.length}):`);
    
    evaluation.pills.forEach((p, idx) => {
      console.log(`   [${idx + 1}] "${p.name}" (Conteo: ${p.count}) -> Ancho: ${p.width}px, Left: ${p.left}px, flexShrink: ${p.flexShrink}, minWidth: ${p.minWidth}`);
    });

    const generalPill = evaluation.pills[0];
    if (generalPill.name !== 'General') {
      throw new Error(`La primera pestaña debería ser 'General', pero fue '${generalPill.name}'`);
    }
    if (generalPill.width < 80) {
      throw new Error(`La pestaña 'General' está colapsada o recortada (ancho: ${generalPill.width}px)`);
    }
    if (generalPill.left < 10) {
      throw new Error(`La pestaña 'General' está desfasada hacia la izquierda (left: ${generalPill.left}px)`);
    }
    console.log(`\n✓ [OK] Criterio 1: 'General' se ve completo sin recortar (ancho ${generalPill.width}px, alineación ${generalPill.left}px).`);

    // 2. Probar desplazamiento horizontal táctil
    console.log('\n- Probando scroll táctil/horizontal...');
    await page.evaluate(() => {
      const pillsRow = document.querySelector('.gateway-pills-row');
      pillsRow.scrollLeft = 120;
    });

    const scrolledLeft = await page.evaluate(() => {
      return document.querySelector('.gateway-pills-row').scrollLeft;
    });
    console.log(`  ScrollLeft tras desplazar: ${scrolledLeft}px`);
    if (scrolledLeft <= 0) {
      throw new Error('La barra no permitió desplazamiento horizontal');
    }
    console.log(`✓ [OK] Criterio 2: La barra permite scroll horizontal táctil fluido.`);

    // Reset scroll to initial for screenshot
    await page.evaluate(() => {
      document.querySelector('.gateway-pills-row').scrollLeft = 0;
    });

    // 3. Capturar pantalla a 390px
    const screenshotDir = '/tmp';
    const screenshotPath = path.join(screenshotDir, 'selector_390px_corregido.png');
    
    // Captura del área del selector + cabecera
    await page.screenshot({
      path: screenshotPath,
      clip: {
        x: 0,
        y: 0,
        width: 390,
        height: 480
      }
    });

    console.log(`✓ Captura guardada en: ${screenshotPath}`);

    // Copiar al artifact dir
    const artifactDir = '/Users/emorosini/.gemini/antigravity/brain/f10508db-9187-4d44-86a3-2fa5339c9911';
    const targetArtifact = path.join(artifactDir, 'selector_390px_corregido.png');
    fs.copyFileSync(screenshotPath, targetArtifact);
    console.log(`✓ Copia guardada en artefactos: ${targetArtifact}`);

    console.log('\n=== TODOS LOS CRITERIOS DE ACEPTACIÓN MÓVIL (390PX) FUERON CUMPLIDOS CON ÉXITO ===\n');

  } catch (err) {
    console.error('Error durante la prueba móvil:', err);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    server.close();
  }
});
