const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const outDir = path.join(process.cwd(), 'out');
const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  else if (reqPath.endsWith('/')) reqPath += 'index.html';
  const filePath = path.join(outDir, reqPath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    res.writeHead(200);
    fs.createReadStream(filePath).pipe(res);
  } else if (fs.existsSync(filePath + '.html')) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    fs.createReadStream(filePath + '.html').pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not found: ' + reqPath);
  }
});

server.listen(3459, async () => {
  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      headless: true
    });
    const page = await browser.newPage();

    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', err => {
      consoleErrors.push(err.message);
    });

    console.log('1. Loading http://localhost:3459/ ...');
    await page.goto('http://localhost:3459/', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 500));

    // Check for hydration errors
    const hydrationErrors = consoleErrors.filter(e => e.includes('Hydration') || e.includes('418') || e.includes('Minified React error'));
    if (hydrationErrors.length > 0) {
      throw new Error('Hydration error detected: ' + hydrationErrors.join('\n'));
    }
    console.log('✓ [OK] No hydration errors detected!');

    // Check hero search box input
    console.log('2. Testing hero search box input...');
    const heroInput = await page.waitForSelector('.hero-search-box input');
    await heroInput.click();
    await heroInput.type('PHQ');
    await new Promise(r => setTimeout(r, 300));

    // Verify feedback button appears
    const feedbackText = await page.$eval('.hero-search-results-btn', el => el.innerText.trim());
    console.log('✓ [OK] Hero search feedback:', feedbackText);
    if (!feedbackText.includes('2') || !feedbackText.includes('instrumentos encontrados')) {
      throw new Error('Unexpected feedback text: ' + feedbackText);
    }

    // Verify catalog summary
    const catalogSummary = await page.$eval('.catalog-summary span:first-child', el => el.innerText.trim());
    console.log('✓ [OK] Catalog summary:', catalogSummary);
    if (!catalogSummary.startsWith('2')) {
      throw new Error('Catalog did not filter to 2 instruments: ' + catalogSummary);
    }

    // Test submit / enter scroll
    console.log('3. Testing Enter key submit in hero search...');
    await heroInput.press('Enter');
    await new Promise(r => setTimeout(r, 400));

    // Test clear button in hero
    console.log('4. Testing search clear button in hero...');
    const clearBtn = await page.waitForSelector('.hero-search-box .search-clear-btn');
    await clearBtn.click();
    await new Promise(r => setTimeout(r, 300));

    const resetSummary = await page.$eval('.catalog-summary span:first-child', el => el.innerText.trim());
    console.log('✓ [OK] Catalog summary after clear:', resetSummary);
    if (!resetSummary.startsWith('270')) {
      throw new Error('Catalog did not reset to 270 instruments: ' + resetSummary);
    }

    // Test typing in hero search with accent insensitive query
    console.log('5. Testing search "depresión" in hero...');
    await heroInput.click();
    await heroInput.type('depresión');
    await new Promise(r => setTimeout(r, 300));

    const depFeedback = await page.$eval('.hero-search-results-btn', el => el.innerText.trim());
    console.log('✓ [OK] Depresión feedback:', depFeedback);

    const depSummary = await page.$eval('.catalog-summary span:first-child', el => el.innerText.trim());
    console.log('✓ [OK] Depresión catalog summary:', depSummary);
    if (!depSummary.startsWith('55')) {
      throw new Error('Expected 55 instruments for depresión, got: ' + depSummary);
    }

    console.log('\n=========================================');
    console.log('HERO SEARCH VERIFICATION PASSED 100%!');
    console.log('=========================================\n');

  } catch (err) {
    console.error('TEST FAILED:', err);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
    server.close();
  }
});
