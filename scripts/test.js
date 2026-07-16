import puppeteer from 'puppeteer';

(async () => {
  try {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Wait for the app to render something
    await page.waitForSelector('#workspace-container', { timeout: 10000 });
    console.log("SUCCESS: Workspace container rendered.");
    
    await browser.close();
  } catch (error) {
    console.error("TEST FAILED:", error);
    process.exit(1);
  }
})();
