const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

// Cargar datasets
const rawCatalog = require('../data/catalog.json');
const rawIndice = require('../data/indice_psicoflujo.json');
const rawCla = require('../data/catalogo_maestro_clasificado.json');
const guiaConfig = require('../data/guia.json');
const { crearIndice, buscar } = require('../buscador_indice.js');

const searchIndex = crearIndice(rawIndice);
const claMap = new Map(rawCla.map(c => [c.id, c]));
const indexFamilyMap = new Map(rawIndice.familias.map(f => [f.id, f]));
const indexThemeMap = new Map(rawIndice.temas.map(t => [t.id, t]));

// Funciones lógicas equivalentes para verificación pura
function contarDirecto(filtros = {}) {
  const trimmedQ = (filtros.q || '').trim();
  let searchHitMap = null;
  if (trimmedQ.length > 0) {
    const results = buscar(searchIndex, trimmedQ, { limite: rawCatalog.length });
    searchHitMap = new Map(results.map(r => [r.id, r]));
  }

  return rawCatalog.filter(item => {
    const famIndex = indexFamilyMap.get(item.family_id);
    const claItem = claMap.get(item.family_id);

    if (searchHitMap && !searchHitMap.has(item.family_id)) return false;
    if (filtros.edad && filtros.edad !== 'all' && !item.franjas.includes(filtros.edad)) return false;
    const itemEje = famIndex ? famIndex.eje : item.eje_num;
    if (filtros.eje && filtros.eje !== 'all' && itemEje !== filtros.eje) return false;

    if (filtros.tema && filtros.tema !== 'all') {
      const pName = indexThemeMap.get(famIndex?.tema || '')?.nombre;
      const sNames = (famIndex?.sec || []).map(s => indexThemeMap.get(s)?.nombre);
      const allNames = [pName, ...sNames].filter(Boolean);
      const allIds = [famIndex?.tema, ...(famIndex?.sec || [])].filter(Boolean);

      const target = filtros.tema.toLowerCase().trim();
      const match = allNames.some(n => n.toLowerCase().trim() === target) ||
                    allIds.some(id => id.toLowerCase().trim() === target);
      if (!match) return false;
    }

    if (filtros.fn && filtros.fn !== 'all' && claItem?.funcion_clinica_categoria !== filtros.fn) return false;
    if (filtros.quien && filtros.quien !== 'all' && claItem?.tipo_instrumento_categoria !== filtros.quien) return false;
    if (filtros.libre && claItem?.acceso_categoria !== 'abierto') return false;

    return true;
  }).length;
}

function opcionesPaso(paso, filtros = {}) {
  const res = [];
  if (paso === 'edad') {
    for (const op of guiaConfig.pasos.edad.opciones) {
      const c = op.franja === 'all' ? contarDirecto({ ...filtros, edad: undefined }) : contarDirecto({ ...filtros, edad: op.franja });
      if (c > 0) res.push({ id: op.id, franja: op.franja, label: op.label, conteo: c });
    }
  } else if (paso === 'area') {
    for (const op of guiaConfig.pasos.area.opciones) {
      const c = contarDirecto({ ...filtros, eje: op.eje });
      if (c > 0) res.push({ id: op.id, eje: op.eje, label: op.label, conteo: c });
    }
  } else if (paso === 'funcion') {
    for (const op of guiaConfig.pasos.afinar.criterios.funcion.opciones) {
      const c = contarDirecto({ ...filtros, fn: op.id });
      if (c > 0) res.push({ id: op.id, label: op.label, conteo: c });
    }
  } else if (paso === 'quien') {
    for (const op of guiaConfig.pasos.afinar.criterios.quien.opciones) {
      const c = contarDirecto({ ...filtros, quien: op.id });
      if (c > 0) res.push({ id: op.id, label: op.label, conteo: c });
    }
  } else if (paso === 'libre') {
    const c = contarDirecto({ ...filtros, libre: true });
    if (c > 0) res.push({ id: 'abierto', label: 'Solo libre', conteo: c });
  }
  return res;
}

function sugerirTemasTexto(texto, filtros = {}) {
  const results = buscar(searchIndex, texto.trim(), { limite: rawCatalog.length });
  const counts = new Map();
  for (const r of results) {
    const fam = indexFamilyMap.get(r.id);
    const item = rawCatalog.find(c => c.family_id === r.id);
    if (!fam || !item) continue;
    if (filtros.edad && filtros.edad !== 'all' && !item.franjas.includes(filtros.edad)) continue;
    if (filtros.eje && filtros.eje !== 'all' && fam.eje !== filtros.eje) continue;

    const themes = [fam.tema, ...(fam.sec || [])].filter(Boolean);
    for (const th of themes) {
      const nombre = indexThemeMap.get(th)?.nombre || th;
      counts.set(nombre, (counts.get(nombre) || 0) + 1);
    }
  }
  const list = [];
  for (const [nombre] of counts.entries()) {
    const c = contarDirecto({ ...filtros, tema: nombre });
    if (c > 0) list.push({ nombre, conteo: c });
  }
  list.sort((a, b) => b.conteo - a.conteo);
  return list;
}

let totalTests = 0;
let passedTests = 0;

function assertTest(condition, desc) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ [OK] ${desc}`);
  } else {
    console.error(`  ✗ [FALLO] ${desc}`);
    throw new Error(`Fallo de prueba: ${desc}`);
  }
}

async function runAllTests() {
  console.log('=== SUITE DE PRUEBAS DEL RECORRIDO GUIADO (test_guia.js) ===\n');

  // 1. Pruebas de lógica pura y conteo dinámico
  console.log('1. Verificando reglas de conteo y referencias:');

  const countNinez = contarDirecto({ edad: 'niños' });
  assertTest(countNinez === 22, `Conteo de niñez coincide con referencia: ${countNinez} (esperado: 22)`);

  const countNinezCog = contarDirecto({ edad: 'niños', eje: 5 });
  assertTest(countNinezCog === 10, `Conteo de niñez + funcionamiento cognitivo (Eje V) = ${countNinezCog} (esperado: 10)`);

  const countAdolEje1 = contarDirecto({ edad: 'adolescentes', eje: 1 });
  assertTest(countAdolEje1 === 32, `Conteo de adolescencia + Eje I = ${countAdolEje1} (esperado: 32)`);

  // Niñez + salud y hábitos (Eje VI) debe ser 0 y la opción debe estar AUSENTE
  const countNinezSalud = contarDirecto({ edad: 'niños', eje: 6 });
  assertTest(countNinezSalud === 0, `Conteo directo de niñez + salud y hábitos (Eje VI) = 0`);

  const opsAreaNinez = opcionesPaso('area', { edad: 'niños' });
  const tieneEje6 = opsAreaNinez.some(o => o.eje === 6);
  assertTest(!tieneEje6, `Opción de salud y hábitos (Eje VI) está AUSENTE para niñez`);

  // Ninguna opción mostrada en ningún paso tiene conteo 0
  const pasosAProbar = ['edad', 'area', 'funcion', 'quien', 'libre'];
  for (const p of pasosAProbar) {
    const ops = opcionesPaso(p);
    const tieneCero = ops.some(o => o.conteo === 0);
    assertTest(!tieneCero, `Paso "${p}": ninguna opción con conteo 0 (${ops.length} opciones válidas)`);
  }

  // Búsqueda semántica con "no duerme"
  console.log('\n2. Verificando búsqueda libre en tema ("no duerme"):');
  const sugsNoDuerme = sugerirTemasTexto('no duerme');
  assertTest(sugsNoDuerme.length > 0, `Búsqueda "no duerme" genera sugerencias de temas (${sugsNoDuerme.length})`);
  assertTest(sugsNoDuerme[0].nombre.toLowerCase().includes('sueño'), `El tema sugerido principal para "no duerme" es "${sugsNoDuerme[0].nombre}" (conduce a sueño)`);

  // 3. Pruebas de navegador con Puppeteer (servidor estático sobre out/)
  console.log('\n3. Iniciando servidor estático y pruebas con Puppeteer...');
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

  const PORT = 3458;
  await new Promise(resolve => server.listen(PORT, resolve));

  try {
    const browser = await puppeteer.launch({
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // A. Verificar que por defecto (sin ?guia=1) la guía está apagada
    console.log('   - Comprobando que sin ?guia=1 la guía está apagada...');
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0' });
    const guiaDefecto = await page.$('.guia-orientacion-container');
    assertTest(guiaDefecto === null, 'La guía está inactiva y no se renderiza sin ?guia=1');

    // B. Activar guía con ?guia=1
    console.log('   - Comprobando carga de ?guia=1...');
    await page.goto(`http://localhost:${PORT}/?guia=1`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.guia-orientacion-container', { timeout: 3000 });
    const guiaVisible = await page.$('.guia-orientacion-container');
    assertTest(guiaVisible !== null, 'La guía se renderiza con ?guia=1');

    // Comprobar botones del primer paso (edad) y sus conteos
    await page.waitForSelector('.guia-option-btn', { timeout: 6000 });
    const btnNinezText = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.guia-option-btn'));
      const found = btns.find(b => b.innerText.includes('Niñez'));
      return found ? found.innerText : null;
    });
    assertTest(btnNinezText && btnNinezText.includes('22'), `Botón Niñez muestra el conteo correcto: 22`);

    // C. Deep link: abrir URL con filtros reproduce el estado exacto
    console.log('   - Comprobando enlace profundo (?guia=1&edad=niños&eje=5)...');
    await page.goto(`http://localhost:${PORT}/?guia=1&edad=niños&eje=5`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.guia-orientacion-container');

    // Verificar que el botón "Ver N instrumentos" muestra 10
    const btnVer = await page.waitForSelector('.guia-btn-ver-instrumentos');
    const textVer = await page.evaluate(el => el.innerText, btnVer);
    assertTest(textVer.includes('10'), `Enlace profundo muestra "Ver 10 instrumentos" (esperado: 10)`);

    // Verificar chips activos
    const chipTexts = await page.$$eval('.guia-chip span:first-child', els => els.map(e => e.innerText));
    assertTest(chipTexts.some(t => t.includes('Niñez')), 'Chip de Niñez presente en deep link');
    assertTest(chipTexts.some(t => t.includes('Eje 5') || t.includes('Funcionamiento cognitivo')), 'Chip de Eje V / Funcionamiento cognitivo presente en deep link');

    // D. Probar búsqueda libre con "no duerme" en interfaz
    console.log('   - Comprobando interacción "Lo cuento con mis palabras" con "no duerme"...');
    // Ir a tema con edad y eje fijados
    await page.goto(`http://localhost:${PORT}/?guia=1&edad=adultos&eje=6`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('#guia-texto-libre', { timeout: 5000 });
    await page.type('#guia-texto-libre', 'no duerme');
    await new Promise(r => setTimeout(r, 250));

    // Debe aparecer sugerencia del tema de sueño
    const sugChip = await page.waitForSelector('.guia-sug-chip');
    const sugText = await page.evaluate(el => el.innerText, sugChip);
    assertTest(sugText.toLowerCase().includes('sueño'), `Sugerencia en UI contiene tema de sueño: "${sugText}"`);

    await browser.close();
  } finally {
    server.close();
  }

  console.log(`\n======================================================`);
  console.log(`RESULTADO FINAL: ${passedTests}/${totalTests} pruebas superadas con éxito.`);
  console.log(`======================================================\n`);
}

runAllTests().catch(err => {
  console.error('\n✗ Error durante la ejecución de pruebas:', err);
  process.exit(1);
});
