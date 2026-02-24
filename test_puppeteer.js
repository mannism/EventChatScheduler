const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    // Listen for all console events and log them
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    
    // Listen for all network requests to /api/chat
    page.on('request', request => {
        if (request.url().includes('/api/chat')) {
            console.log('API REQUEST URL:', request.url());
            console.log('API REQUEST HEADERS:', JSON.stringify(request.headers(), null, 2));
            console.log('API REQUEST POST DATA:', request.postData());
        }
    });

    await page.goto('http://localhost:3000/');
    
    // Fill out onboarding form to send userProfile to chat interface
    await page.waitForSelector('input[placeholder="e.g. Jane Doe"]');
    await page.fill('input[placeholder="e.g. Jane Doe"]', 'Jane Test');
    
    // Click Role
    await page.click('button[role="combobox"]');
    await page.click('text=Accountant');
    
    // Click Location
    const combos = await page.$$('button[role="combobox"]');
    await combos[1].click();
    await page.click('text=Australia');
    
    // Attendance
    await page.click('text=Both Days');
    
    // Interests
    await combos[2].click();
    await page.click('text=AI');
    
    // Submit
    await page.click('button:has-text("Continue")');
    
    // Wait for chat to load
    await page.waitForSelector('input[placeholder="Type your question..."]');
    
    console.log("Chat loaded successfully, waiting 5 seconds for background API calls...");
    await new Promise(r => setTimeout(r, 5000));
    
    await browser.close();
})();
