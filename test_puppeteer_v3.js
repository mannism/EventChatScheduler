const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    page.on('request', req => {
        if (req.url().includes('/api/chat')) {
            console.log('--- API REQUEST ---');
            console.log('Headers:', req.headers()['x-user-profile']);
            console.log('PostData:', req.postData());
        }
    });
    
    // Add a fast script to page to just call the API like the hook would.
    // Wait, let's just use the UI!
    await page.goto('http://localhost:3000/');
    
    // Input name
    await page.fill('input[placeholder="e.g. Jane Doe"]', 'Jane Test');
    
    // Click buttons to skip form validation
    const buttons = await page.$$('button');
    for (const btn of buttons) {
        const text = await btn.textContent();
        if (text === 'Continue') {
            await btn.click();
        }
    }
    
    // Wait a bit
    await page.waitForTimeout(5000);
    console.log("Done");
    await browser.close();
})();
