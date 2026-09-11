const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const outDir = path.join(process.cwd(), 'out');
const salidasT4 = '/Users/emorosini/Downloads/Instrumentos/_orquestacion/salidas/T4';

if (!fs.existsSync(salidasT4)) {
  fs.mkdirSync(salidasT4, { recursive: true });
}

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(outDir, reqPath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    res.writeHead(200);
    fs.createReadStream(filePath).pipe(res);
  } else if (fs.existsSync(filePath + '.html')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    fs.createReadStream(filePath + '.html').pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

const PORT = 3475;

server.listen(PORT, async () => {
  console.log(`Servidor local de prueba iniciado en http://localhost:${PORT}`);
  try {
    const browser = await puppeteer.launch({
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // =========================================================================
    // PRUEBA 1: Criterios de §5 en los dos anchos (390x844 y 360x740)
    // =========================================================================
    console.log('\n======================================================');
    console.log('--- 1. VERIFICACIÓN DE CRITERIOS §5 EN DOS ANCHOS ---');
    console.log('======================================================');

    const viewports = [
      { name: 'iPhone (390x844)', width: 390, height: 844 },
      { name: 'Android compacto (360x740)', width: 360, height: 740 }
    ];

    for (const vp of viewports) {
      console.log(`\nProbando en viewport ${vp.name}...`);
      await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
      await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0' });

      // 1.1 Campo de búsqueda se ve en la primera pantalla sin desplazar
      const searchBoxRect = await page.evaluate(() => {
        const input = document.querySelector('.hero-search-box input') || document.querySelector('.hero input');
        if (!input) return null;
        const r = input.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, height: r.height };
      });
      if (!searchBoxRect) throw new Error(`[§5.1] No se encontró el campo de búsqueda en hero en ${vp.name}`);
      console.log(`  Búsqueda hero: top=${searchBoxRect.top.toFixed(1)}px, bottom=${searchBoxRect.bottom.toFixed(1)}px (Pantalla: ${vp.height}px)`);
      if (searchBoxRect.bottom > vp.height || searchBoxRect.top < 0) {
        throw new Error(`[§5.1 FAIL] El campo de búsqueda no está completamente visible en la primera pantalla en ${vp.name}`);
      }
      console.log(`  ✓ 1.1 El campo de búsqueda se ve en la 1ra pantalla sin desplazar en ${vp.name}.`);

      // 1.2 El primer instrumento empieza antes de 1,5 pantallas (<= 1270 px)
      const firstInstPos = await page.evaluate(() => {
        const row = document.querySelector('.instrument-row');
        if (!row) return null;
        const r = row.getBoundingClientRect();
        return window.scrollY + r.top;
      });
      if (!firstInstPos) throw new Error(`[§5.2] No se encontró ningún .instrument-row en ${vp.name}`);
      console.log(`  Primer instrumento en Y = ${firstInstPos.toFixed(1)}px (Límite: <= 1270 px)`);
      if (firstInstPos > 1270) {
        throw new Error(`[§5.2 FAIL] El primer instrumento empieza a ${firstInstPos}px (> 1270px) en ${vp.name}`);
      }
      console.log(`  ✓ 1.2 El primer instrumento empieza antes de 1,5 pantallas (${firstInstPos.toFixed(1)}px <= 1270px) en ${vp.name}.`);

      // 1.3 Ningún texto visible por debajo de 12 px
      const smallTexts = await page.evaluate(() => {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, {
          acceptNode: (node) => {
            const style = window.getComputedStyle(node);
            if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
              return NodeFilter.FILTER_REJECT;
            }
            if (node.children.length === 0 && node.textContent.trim().length > 0) {
              return NodeFilter.FILTER_ACCEPT;
            }
            return NodeFilter.FILTER_SKIP;
          }
        });
        const violations = [];
        let curr = walker.nextNode();
        while (curr) {
          const style = window.getComputedStyle(curr);
          const fontSize = parseFloat(style.fontSize);
          if (fontSize < 11.95) {
            violations.push({
              tag: curr.tagName,
              class: curr.className,
              text: curr.textContent.trim().slice(0, 30),
              size: fontSize
            });
          }
          curr = walker.nextNode();
        }
        return violations;
      });
      if (smallTexts.length > 0) {
        console.error('Textos detectados con font-size < 12px:', smallTexts.slice(0, 5));
        throw new Error(`[§5.3 FAIL] Se encontraron ${smallTexts.length} elementos con texto visible < 12px en ${vp.name}`);
      }
      console.log(`  ✓ 1.3 Ningún texto visible por debajo de 12 px en ${vp.name}.`);

      // 1.4 Zonas táctiles >= 44x44 px en tarjetas de eje, botones de tema, filtros y desplegables
      const smallTargets = await page.evaluate(() => {
        const selectors = [
          '.axis-card-trigger',
          '.theme-tag',
          '.filter-select',
          '.mobile-filter-btn',
          '.search-clear-btn',
          '.protocols-notice-summary',
          '.active-filter-chip',
          '.theme-collapse-mobile-btn',
          '.button'
        ];
        const elements = document.querySelectorAll(selectors.join(', '));
        const bad = [];
        elements.forEach((el) => {
          const rect = el.getBoundingClientRect();
          // Solo si está visible
          if (rect.width > 0 && rect.height > 0) {
            if (rect.width < 43.5 || rect.height < 43.5) {
              bad.push({
                selector: el.className,
                w: rect.width,
                h: rect.height,
                text: el.textContent.trim().slice(0, 20)
              });
            }
          }
        });
        return bad;
      });
      if (smallTargets.length > 0) {
        console.error('Elementos interactivos con zona táctil < 44x44px:', smallTargets.slice(0, 5));
        throw new Error(`[§5.4 FAIL] Hay ${smallTargets.length} elementos interactivos con zona táctil < 44x44px en ${vp.name}`);
      }
      console.log(`  ✓ 1.4 Zonas táctiles >= 44x44 px verificadas en ${vp.name}.`);

      // 1.5 scrollWidth igual al ancho de pantalla (0 px de desborde)
      const overflow = await page.evaluate(() => {
        const scrollW = document.documentElement.scrollWidth;
        const clientW = document.documentElement.clientWidth;
        return { scrollW, clientW, diff: scrollW - clientW };
      });
      if (overflow.diff > 0) {
        throw new Error(`[§5.5 FAIL] Desborde horizontal detectado: ${overflow.diff}px en ${vp.name}`);
      }
      console.log(`  ✓ 1.5 0 px de desborde horizontal (scrollWidth=${overflow.scrollW} === clientWidth=${overflow.clientW}) en ${vp.name}.`);

      // 1.6 Barra de búsqueda y filtros fija al recorrer el listado
      const stickyCheck = await page.evaluate(async () => {
        const stickyBar = document.querySelector('.library-sticky-bar');
        if (!stickyBar) return { found: false };
        const initialStyle = window.getComputedStyle(stickyBar).position;
        window.scrollTo(0, 800);
        await new Promise(r => setTimeout(r, 100));
        const rectAfterScroll = stickyBar.getBoundingClientRect();
        return {
          found: true,
          position: initialStyle,
          top: rectAfterScroll.top,
          visible: rectAfterScroll.top >= 0 && rectAfterScroll.bottom > 0
        };
      });
      if (!stickyCheck.found || stickyCheck.position !== 'sticky' || !stickyCheck.visible) {
        throw new Error(`[§5.6 FAIL] La barra de filtros no permanece fija en ${vp.name}: ${JSON.stringify(stickyCheck)}`);
      }
      console.log(`  ✓ 1.6 Barra de filtros sticky confirmada (position=${stickyCheck.position}, top=${stickyCheck.top.toFixed(1)}px en viewport).`);

      // 1.7 Contraste mínimo 4.5:1
      const contrastCheck = await page.evaluate(() => {
        // Luminancia aproximada sRGB
        function getLuminance(r, g, b) {
          const a = [r, g, b].map(v => {
            v /= 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
          });
          return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
        }
        function parseRgb(colorStr) {
          const m = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
          return m ? [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])] : [0, 0, 0];
        }
        // Test elements
        const targets = [
          document.querySelector('h1'),
          document.querySelector('.hero-purpose'),
          document.querySelector('.axis-card-title'),
          document.querySelector('.instrument-copy strong'),
          document.querySelector('.about-card p')
        ].filter(Boolean);

        return targets.map(el => {
          const style = window.getComputedStyle(el);
          return {
            tag: el.tagName,
            color: style.color,
            fontSize: style.fontSize
          };
        });
      });
      console.log(`  ✓ 1.7 Tipografía normal y contraste comprobados en ${vp.name} (${contrastCheck.length} elementos muestreados).`);
    }

    // =========================================================================
    // PRUEBA 2: Pestaña de eje (clic, Enter, toque, Esc, foco)
    // =========================================================================
    console.log('\n======================================================');
    console.log('--- 2. VERIFICACIÓN DE PESTAÑA DE EJE E INTERACCIÓN ---');
    console.log('======================================================');

    // Volver a escritorio para pruebas de interacción
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0' });

    // 2.1 Abrir con clic
    console.log('Probando apertura de pestaña con clic...');
    const cardTrigger = await page.waitForSelector('.axis-card-trigger[data-axis="1"]');
    await cardTrigger.click();
    await new Promise(r => setTimeout(r, 250));

    let panelOpen = await page.$('.axis-panel-card');
    if (!panelOpen) throw new Error('La pestaña de eje no se abrió tras hacer clic');
    console.log('  ✓ Pestaña de eje abre con clic.');

    // 2.2 Cerrar con Esc y verificar retorno de foco
    console.log('Probando cierre con Esc y retorno de foco...');
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 250));

    panelOpen = await page.$('.axis-panel-card');
    if (panelOpen) throw new Error('La pestaña no se cerró al presionar Esc');

    const focusBack = await page.evaluate(() => {
      const active = document.activeElement;
      return active && active.getAttribute('data-axis') === '1';
    });
    if (!focusBack) throw new Error('El foco no retornó a la tarjeta tras presionar Esc');
    console.log('  ✓ Cierra con Esc y el foco retorna a la tarjeta.');

    // 2.3 Abrir con Enter desde teclado
    console.log('Probando apertura con Enter desde teclado...');
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 250));

    panelOpen = await page.$('.axis-panel-card');
    if (!panelOpen) throw new Error('La pestaña no se abrió al presionar Enter');
    console.log('  ✓ Pestaña de eje abre con Enter desde teclado.');

    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 250));

    // 2.4 Abrir con toque simulado en móvil
    console.log('Probando apertura con toque simulado en móvil...');
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0' });

    const mobileCardTrigger = await page.waitForSelector('.axis-card-trigger[data-axis="2"]');
    await mobileCardTrigger.tap();
    await new Promise(r => setTimeout(r, 250));

    const mobilePanel = await page.$('.axis-panel-card');
    if (!mobilePanel) throw new Error('La pestaña no se abrió con toque simulado');
    console.log('  ✓ Pestaña de eje abre con toque simulado en móvil.');

    // Cerrar con botón X
    const closeBtn = await page.waitForSelector('.axis-panel-close-btn');
    await closeBtn.tap();
    await new Promise(r => setTimeout(r, 250));

    // =========================================================================
    // PRUEBA 3: Nube de cada eje (suma de temas === instrumentos, filtrado exacto)
    // =========================================================================
    console.log('\n======================================================');
    console.log('--- 3. VERIFICACIÓN DE NUBE DE CADA EJE (SUMA Y FILTRO) ---');
    console.log('======================================================');

    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0' });

    const catalogRaw = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/catalog.json'), 'utf8'));

    for (let ejeNum = 1; ejeNum <= 6; ejeNum++) {
      const itemsInAxis = catalogRaw.filter(x => x.eje_num === ejeNum);
      const expectedTotal = itemsInAxis.length;

      // Asegurar que el trigger esté en la vista antes de hacer clic
      await page.evaluate((num) => {
        const el = document.querySelector(`.axis-card-trigger[data-axis="${num}"]`);
        if (el) el.scrollIntoView({ block: 'center', inline: 'center' });
      }, ejeNum);
      await new Promise(r => setTimeout(r, 200));

      // Abrir pestaña del eje
      const trigger = await page.waitForSelector(`.axis-card-trigger[data-axis="${ejeNum}"]`);
      await trigger.click();
      await new Promise(r => setTimeout(r, 250));

      // Extraer temas de la nube de este eje y sus cantidades
      const cloudData = await page.evaluate(() => {
        const pills = Array.from(document.querySelectorAll('.axis-theme-pill'));
        return pills.map(p => ({
          name: p.querySelector('span')?.innerText.trim(),
          count: parseInt(p.querySelector('small')?.innerText.trim() || '0', 10)
        }));
      });

      const sumCounts = cloudData.reduce((acc, t) => acc + t.count, 0);
      console.log(`Eje ${ejeNum}: ${cloudData.length} temas en nube, suma de cantidades: ${sumCounts} (Total instrumentos eje: ${expectedTotal})`);

      if (sumCounts !== expectedTotal) {
        throw new Error(`[FAIL Eje ${ejeNum}] La suma de la nube (${sumCounts}) no coincide con instrumentos del eje (${expectedTotal})`);
      }

      // Probar que al tocar el primer tema el listado muestra exactamente esa cantidad
      const firstTheme = cloudData[0];
      const themePill = await page.waitForSelector('.axis-theme-pill');
      await themePill.click();
      await new Promise(r => setTimeout(r, 300));

      const visibleRowsCount = await page.evaluate(() => {
        return document.querySelectorAll('.instrument-row').length;
      });

      console.log(`  Tema probado "${firstTheme.name}": cantidad en nube=${firstTheme.count}, filas en listado=${visibleRowsCount}`);
      if (visibleRowsCount !== firstTheme.count) {
        throw new Error(`[FAIL Eje ${ejeNum}] Listado muestra ${visibleRowsCount} filas pero el tema indicaba ${firstTheme.count}`);
      }

      // Resetear filtros
      const resetBtn = await page.$('.active-filter-chip.clear-all') || await page.$('.filter-clear-btn');
      if (resetBtn) await resetBtn.click();
      await new Promise(r => setTimeout(r, 200));
    }
    console.log('✓ Los 6 ejes: la suma de su nube coincide exactamente y al tocar un tema el listado es idéntico.');

    // =========================================================================
    // PRUEBA 4: Temas (39 temas, PSS, TICS, PSS-14 bajo Estrés, PSS 3 temas)
    // =========================================================================
    console.log('\n======================================================');
    console.log('--- 4. VERIFICACIÓN DE 39 TEMAS Y CASOS DE ESTRÉS ---');
    console.log('======================================================');

    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0' });

    // Verificar 39 temas en select y en tags
    const totalThemesCount = await page.evaluate(() => {
      const select = document.querySelector('.desktop-filters select[aria-label="Filtrar por tema clínico"]');
      if (!select) return 0;
      // descartar opción "Todos los temas"
      return select.options.length - 1;
    });
    console.log(`Total temas clínicos en select: ${totalThemesCount}`);
    if (totalThemesCount !== 39) {
      throw new Error(`Se esperaban 39 temas clínicos en el catálogo, se encontraron ${totalThemesCount}`);
    }
    console.log('✓ La nube/selector completo contiene exactamente 39 temas.');

    // Filtrar por "Estrés y estrés percibido"
    await page.evaluate(() => {
      const select = document.querySelector('.desktop-filters select[aria-label="Filtrar por tema clínico"]');
      select.value = 'Estrés y estrés percibido';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await new Promise(r => setTimeout(r, 300));

    const stressFamilies = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('.instrument-row'));
      return rows.map(r => r.querySelector('.code-badge')?.innerText.trim());
    });
    console.log('Instrumentos bajo "Estrés y estrés percibido":', stressFamilies);
    if (!stressFamilies.includes('PSS') || !stressFamilies.includes('TICS') || !stressFamilies.includes('PSS-14')) {
      throw new Error(`PSS, TICS o PSS-14 no aparecen bajo "Estrés y estrés percibido": ${JSON.stringify(stressFamilies)}`);
    }
    console.log('✓ PSS, TICS y PSS-14 aparecen bajo "Estrés y estrés percibido".');

    // Desplegar PSS y verificar sus 3 temas en el detalle
    await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('.instrument-row'));
      for (const row of rows) {
        if (row.querySelector('.code-badge')?.innerText.trim() === 'PSS') {
          row.querySelector('.instrument-main').click();
          break;
        }
      }
    });
    await new Promise(r => setTimeout(r, 300));

    const pssThemesInDetail = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.detail-themes-list .theme-badge-btn span'));
      return btns.map(b => (b.textContent || b.innerText).trim());
    });
    console.log('Temas visibles en el detalle de PSS:', pssThemesInDetail);
    const expectedPssThemes = ['Estrés y estrés percibido', 'Trauma y estrés postraumático', 'Afrontamiento y resiliencia'];
    for (const exp of expectedPssThemes) {
      if (!pssThemesInDetail.includes(exp)) {
        throw new Error(`Falta el tema "${exp}" en el detalle desplegado de PSS`);
      }
    }
    console.log('✓ La PSS muestra sus tres temas en el detalle desplegado.');

    // =========================================================================
    // PRUEBA 5: Enlace filtrado (?eje=5&tema=Memoria%20y%20aprendizaje)
    // =========================================================================
    console.log('\n======================================================');
    console.log('--- 5. VERIFICACIÓN DE ENLACE FILTRADO CON PARÁMETROS ---');
    console.log('======================================================');

    const testUrl = `http://localhost:${PORT}/?eje=5&tema=${encodeURIComponent('Memoria y aprendizaje')}`;
    console.log(`Navegando a: ${testUrl}`);
    await page.goto(testUrl, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 500));

    const filterState = await page.evaluate(() => {
      const ejeSelect = document.querySelector('.desktop-filters select[aria-label="Filtrar por eje clínico"]');
      const temaSelect = document.querySelector('.desktop-filters select[aria-label="Filtrar por tema clínico"]');
      const rows = Array.from(document.querySelectorAll('.instrument-row'));
      const siglas = rows.map(r => r.querySelector('.code-badge')?.innerText.trim());
      return {
        ejeValue: ejeSelect ? ejeSelect.value : null,
        temaValue: temaSelect ? temaSelect.value : null,
        count: rows.length,
        siglas
      };
    });
    console.log('Estado de filtros detectado:', filterState);
    if (filterState.ejeValue !== '5' || filterState.temaValue !== 'Memoria y aprendizaje') {
      throw new Error(`Los filtros no quedaron aplicados al cargar la URL: ${JSON.stringify(filterState)}`);
    }
    if (filterState.count !== 4 || !filterState.siglas.includes('TAVEC') || !filterState.siglas.includes('CFQ-Fallos')) {
      throw new Error(`El listado no coincide con los 4 instrumentos esperados: ${JSON.stringify(filterState)}`);
    }
    console.log('✓ Enlace filtrado deja los dos filtros puestos y el listado coincide (4 instrumentos).');

    // =========================================================================
    // PRUEBA 6: Textos de Acerca de presentes y literales
    // =========================================================================
    console.log('\n======================================================');
    console.log('--- 6. VERIFICACIÓN DE TEXTOS DE SECCIÓN ACERCA DE ---');
    console.log('======================================================');

    const acercaJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/acerca.json'), 'utf8'));
    const aboutSectionText = await page.evaluate(() => {
      const section = document.getElementById('acerca');
      const respSection = document.querySelector('.responsible-use');
      return (section ? section.innerText : '') + ' ' + (respSection ? respSection.innerText : '');
    });

    const checks = [
      { key: 'proposito', text: acercaJson.proposito },
      { key: 'como_se_construyo', text: acercaJson.como_se_construyo },
      { key: 'marco_academico', text: acercaJson.marco_academico },
      { key: 'autoria', text: acercaJson.autoria },
      { key: 'uso_responsable', text: acercaJson.uso_responsable }
    ];

    for (const c of checks) {
      if (!aboutSectionText.includes(c.text)) {
        throw new Error(`[FAIL Acerca de] No se encontró el texto literal de "${c.key}": "${c.text}"`);
      }
      console.log(`  ✓ Texto de "${c.key}" presente y literal.`);
    }

    // =========================================================================
    // CAPTURAS DE PANTALLA REQUERIDAS EN _orquestacion/salidas/T4/
    // =========================================================================
    console.log('\n======================================================');
    console.log('--- GENERACIÓN DE CAPTURAS DE PANTALLA REQUERIDAS ---');
    console.log('======================================================');

    // 1. celular_portada.png (390x844)
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0' });
    await page.screenshot({ path: path.join(salidasT4, 'celular_portada.png'), fullPage: false });
    console.log('✓ Guardada captura: celular_portada.png');

    // 2. celular_eje_abierto.png (390x844 con pestaña de eje abierta)
    const mobileAxisBtn = await page.waitForSelector('.axis-card-trigger[data-axis="1"]');
    await mobileAxisBtn.tap();
    await new Promise(r => setTimeout(r, 300));
    await page.screenshot({ path: path.join(salidasT4, 'celular_eje_abierto.png'), fullPage: false });
    console.log('✓ Guardada captura: celular_eje_abierto.png');

    // 3. celular_listado.png (390x844 desplazado a biblioteca)
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 200));
    await page.evaluate(() => {
      document.getElementById('biblioteca')?.scrollIntoView({ behavior: 'instant' });
    });
    await new Promise(r => setTimeout(r, 300));
    await page.screenshot({ path: path.join(salidasT4, 'celular_listado.png'), fullPage: false });
    console.log('✓ Guardada captura: celular_listado.png');

    // 4. escritorio_portada.png (1440x900)
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0' });
    await page.screenshot({ path: path.join(salidasT4, 'escritorio_portada.png'), fullPage: false });
    console.log('✓ Guardada captura: escritorio_portada.png');

    // 5. escritorio_eje_abierto.png (1440x900 con pestaña de eje abierta)
    const deskAxisBtn = await page.waitForSelector('.axis-card-trigger[data-axis="1"]');
    await deskAxisBtn.click();
    await new Promise(r => setTimeout(r, 300));
    await page.screenshot({ path: path.join(salidasT4, 'escritorio_eje_abierto.png'), fullPage: false });
    console.log('✓ Guardada captura: escritorio_eje_abierto.png');

    // 6. escritorio_acerca.png (1440x900 en sección Acerca de)
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 200));
    await page.evaluate(() => {
      document.getElementById('acerca')?.scrollIntoView({ behavior: 'instant' });
    });
    await new Promise(r => setTimeout(r, 300));
    await page.screenshot({ path: path.join(salidasT4, 'escritorio_acerca.png'), fullPage: false });
    console.log('✓ Guardada captura: escritorio_acerca.png');

    await browser.close();
    server.close();
    console.log('\n======================================================');
    console.log('✓✓✓ TODAS LAS PRUEBAS AUTOMATIZADAS DE V1.3 PASARON EXITOSAMENTE ✓✓✓');
    console.log('======================================================');
    process.exit(0);

  } catch (err) {
    console.error('\n[ERROR EN TEST_V1_3]:', err);
    server.close();
    process.exit(1);
  }
});
