const { chromium } = require('playwright-core');

(async () => {
  console.log('Launching browser...');
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    });
  } catch (e) {
    console.log('Failed to launch installed Chrome, trying default chromium launch:', e.message);
    browser = await chromium.launch({ headless: true });
  }

  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`[CONSOLE] [${msg.type()}] ${msg.text()}`);
  });
  
  page.on('pageerror', err => {
    console.log('[PAGE ERROR]', err.stack || err.message);
  });

  console.log('Visiting http://localhost:5174/ (Employee)...');
  try {
    await page.goto('http://localhost:5174/', { waitUntil: 'networkidle', timeout: 5000 });
    console.log('Navigation complete to http://localhost:5174/');
  } catch (err) {
    console.error('Failed to load http://localhost:5174/ within timeout:', err.message);
  }

  await browser.close();
  console.log('Done!');
})();
