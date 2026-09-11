const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

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

server.listen(3457, async () => {
  try {
    const browser = await puppeteer.launch({
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      headless: true
    });
    const page = await browser.newPage();
    await page.goto('http://localhost:3457/', { waitUntil: 'networkidle0' });

    async function testQuery(q) {
      const input = await page.waitForSelector('.catalog-controls-v1 input');
      await input.click({ clickCount: 3 });
      await input.press('Backspace');
      await input.type(q);
      await new Promise(r => setTimeout(r, 200));
      const summary = await page.$eval('.catalog-summary span:first-child', el => el.innerText.trim());
      const num = parseInt(summary.split(' ')[0], 10);
      return num;
    }

    const c_sin = await testQuery('depresion');
    const c_con = await testQuery('depresión');
    const c_ans = await testQuery('ansiedad');
    const c_sui = await testQuery('suicid');
    const c_mem = await testQuery('memoria');

    console.log('TEST RESULT:');
    console.log('depresion count:', c_sin);
    console.log('depresión count:', c_con);
    console.log('ansiedad count:', c_ans);
    console.log('suicid count:', c_sui);
    console.log('memoria count:', c_mem);

    if (c_sin !== c_con) throw new Error('Counts for depresion and depresión do not match!');
    if (c_ans < 1) throw new Error('ansiedad returned 0!');
    if (c_sui < 1) throw new Error('suicid returned 0!');
    if (c_mem < 1) throw new Error('memoria returned 0!');

    console.log('ALL BROWSER SEARCH TESTS PASSED SUCCESSFULLY!');
    await browser.close();
  } catch (err) {
    console.error('Error during test:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});
