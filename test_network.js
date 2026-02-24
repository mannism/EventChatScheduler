const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    page.on('request', req => {
        if (req.url().includes('/api/chat')) {
            console.log('API REQUEST HEADERS:', req.headers());
            console.log('API REQUEST POST DATA:', req.postData());
        }
    });

    await page.goto('http://localhost:3000/');
    
    // Evaluate in browser to fill form and submit it quickly
    await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input'));
        if(inputs[0]) {
            // It's a hack, but let's try to just click around using DOM API
            // Actually it's easier to just trigger the chat directly if possible, or we can just fill it with evaluate
            const nameInput = document.querySelector('input[placeholder="e.g. Jane Doe"]');
            if (nameInput) {
                nameInput.value = "Jane Doe";
                nameInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }
    });
    
    // We can also just click through with playwright built-in clicks
    try {
        await page.fill('input[placeholder="e.g. Jane Doe"]', 'Jane Test');
        
        const combos = await page.$$('button[role="combobox"]');
        await combos[0].click(); // Role
        await page.waitForSelector('text=Accountant');
        await page.click('text=Accountant');
        
        await combos[1].click(); // Location
        await page.waitForSelector('text=Australia');
        await page.click('text=Australia');
        
        await page.click('text=Both Days'); // Attendance
        
        await combos[2].click(); // Interests
        await page.waitForSelector('text=AI');
        await page.click('text=AI');
        
        await page.click('button:has-text("Continue")');
        
        console.log("Waiting for network request...");
        await page.waitForResponse(response => response.url().includes('/api/chat'), { timeout: 10000 });
        
    } catch(err) {
        console.error("Test failed", err);
    }
    
    await browser.close();
})();
