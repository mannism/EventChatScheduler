const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    page.on('request', req => {
        if (req.url().includes('/api/chat')) {
            console.log('\n--- API CALL DETECTED ---');
            console.log('HEADERS:', JSON.stringify(req.headers(), null, 2));
            console.log('POST DATA:', req.postData());
            console.log('-------------------------\n');
        }
    });

    await page.goto('http://localhost:3000/');
    
    try {
        await page.fill('input[placeholder="e.g. Jane Doe"]', 'Jane Test');
        
        await page.click('button[role="combobox"]');
        await page.click('text=Accountant');
        
        const locBox = page.locator('button[role="combobox"]').nth(1);
        await locBox.click();
        await page.click('text=Australia');
        
        await page.click('text=Both Days');
        
        const intBox = page.locator('button[role="combobox"]').nth(2);
        await intBox.click();
        await page.click('text=AI');
        
        await page.click('button:has-text("Continue")');
        console.log("Clicked Continue, waiting for chat to render...");
        
        await page.waitForSelector('input[placeholder="Type your question..."]');
        console.log("Chat loaded! Waiting for initial network request...");
        
        await page.waitForTimeout(5000);
        
    } catch(err) {
        console.error("Test failed:", err);
    }
    
    await browser.close();
})();
