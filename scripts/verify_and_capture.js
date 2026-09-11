const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT_DIR = '/Users/emorosini/Downloads/Instrumentos/_orquestacion/salidas/T1';

async function main() {
  console.log('=== VERIFICACIÓN EN NAVEGADOR Y CAPTURAS ===');
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('1. Navegando a http://localhost:3456/...');
  await page.goto('http://localhost:3456/', { waitUntil: 'networkidle0' });

  // 1. Escritorio
  console.log('2. Tomando captura de escritorio (Hero)...');
  await page.screenshot({
    path: path.join(OUT_DIR, 'captura_escritorio.png'),
    fullPage: false
  });

  // 2. Probar filtros por eje
  console.log('3. Probando filtros por eje...');
  const axes = ['Eje I', 'Eje II', 'Eje III', 'Eje IV', 'Eje V', 'Eje VI'];
  for (const axis of axes) {
    const btn = await page.waitForSelector(`xpath///button[contains(., '${axis}')]`);
    await btn.click();
    await new Promise((r) => setTimeout(r, 150));
    const countText = await page.$eval('.catalog-summary', el => el.innerText);
    console.log(`   - Filtro ${axis}: ${countText.split('\n')[0]}`);
  }

  // 3. Probar filtro por franja
  console.log('4. Probando filtros por franja de edad...');
  const franjas = ['Niños (<13)', 'Adolescentes (13–17)', 'Adultos (18–64)', 'Mayores (65+)'];
  for (const fr of franjas) {
    const btn = await page.waitForSelector(`xpath///button[contains(., '${fr.split(' ')[0]}')]`);
    await btn.click();
    await new Promise((r) => setTimeout(r, 150));
    const countText = await page.$eval('.catalog-summary', el => el.innerText);
    console.log(`   - Filtro ${fr}: ${countText.split('\n')[0]}`);
  }

  // Resetear filtros
  console.log('5. Restableciendo filtros...');
  const resetAllBtn = await page.waitForSelector("xpath///button[contains(., 'Todos los ejes')]");
  await resetAllBtn.click();
  const resetAgeBtn = await page.waitForSelector("xpath///button[contains(., 'Todas las edades')]");
  await resetAgeBtn.click();

  // 4. Búsqueda "PHQ"
  console.log('6. Probando búsqueda "PHQ"...');
  const searchInput = await page.waitForSelector('.catalog-controls-v1 input');
  await searchInput.type('PHQ');
  await new Promise((r) => setTimeout(r, 250));

  const searchSummary = await page.$eval('.catalog-summary', el => el.innerText);
  console.log(`   - Búsqueda "PHQ": ${searchSummary.split('\n')[0]}`);

  // 5. Expandir PHQ-9 (tiene Ficha y Protocolo)
  console.log('7. Expandiendo fila PHQ-9...');
  const phq9Btn = await page.waitForSelector("xpath///button[contains(., 'PHQ-9')]");
  await phq9Btn.click();
  await new Promise((r) => setTimeout(r, 200));

  // Verificar enlaces de ficha y protocolo
  const fichaLink = await page.$eval("a[href*='Ficha_Tecnica.pdf']", el => el.getAttribute('href'));
  const protoLink = await page.$eval("a[href*='Protocolo.pdf']", el => el.getAttribute('href'));
  console.log(`   - Enlace Ficha técnica: ${fichaLink}`);
  console.log(`   - Enlace Protocolo: ${protoLink}`);

  // Verificar apertura de una ficha y un protocolo
  const checkFicha = await page.evaluate(async (url) => {
    const res = await fetch(url);
    return { status: res.status, ok: res.ok, type: res.headers.get('content-type') };
  }, fichaLink);
  const checkProto = await page.evaluate(async (url) => {
    const res = await fetch(url);
    return { status: res.status, ok: res.ok, type: res.headers.get('content-type') };
  }, protoLink);
  console.log(`   - HTTP Ficha: ${checkFicha.status} (${checkFicha.type})`);
  console.log(`   - HTTP Protocolo: ${checkProto.status} (${checkProto.type})`);

  // Scroll to biblioteca and capture
  console.log('8. Tomando captura de biblioteca...');
  const libraryEl = await page.waitForSelector('#biblioteca');
  await libraryEl.scrollIntoView();
  await new Promise((r) => setTimeout(r, 300));
  await page.screenshot({
    path: path.join(OUT_DIR, 'captura_biblioteca.png'),
    fullPage: false
  });

  // 6. Probar instrumento no publicable (ej. buscar "STAI")
  console.log('9. Probando instrumento no publicable (STAI)...');
  await searchInput.click({ clickCount: 3 });
  await searchInput.type('STAI');
  await new Promise((r) => setTimeout(r, 250));
  const staiBtn = await page.waitForSelector("xpath///button[contains(., 'STAI')]");
  await staiBtn.click();
  await new Promise((r) => setTimeout(r, 200));

  const hasRestrictedBadge = await page.$eval('.badge-no-protocol', el => el.innerText).catch(() => null);
  console.log(`   - Etiqueta no descargable: "${hasRestrictedBadge}"`);

  // 7. Celular (390x844) sin desbordes
  console.log('10. Configurando vista de celular (390x844)...');
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:3456/#biblioteca', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 300));

  // Verificar desbordes horizontales
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const innerWidth = await page.evaluate(() => window.innerWidth);
  console.log(`   - Ancho de documento: ${scrollWidth}px, Viewport: ${innerWidth}px`);
  if (scrollWidth > innerWidth) {
    console.warn(`   [AVISO] Hay desborde horizontal de ${scrollWidth - innerWidth}px`);
  } else {
    console.log('   - Sin desbordes horizontales (0px de overflow).');
  }

  // Expandir primer instrumento en móvil
  const firstMobileRow = await page.waitForSelector('.instrument-main');
  await firstMobileRow.click();
  await new Promise((r) => setTimeout(r, 200));

  console.log('11. Tomando captura de celular...');
  await page.screenshot({
    path: path.join(OUT_DIR, 'captura_celular.png'),
    fullPage: false
  });

  await browser.close();
  console.log('=== VERIFICACIÓN NAVEGADOR COMPLETADA CON ÉXITO ===');
}

main().catch(err => {
  console.error('Error en verificación:', err);
  process.exit(1);
});
