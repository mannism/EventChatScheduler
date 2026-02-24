const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto('http://localhost:3000/');
    
    // Fill out onboarding form to send userProfile to chat interface
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
    await Promise.all([
        page.waitForSelector('input[placeholder="Type your question..."]'),
        page.click('button:has-text("Continue")')
    ]);
    
    console.log("Chat loaded successfully. Let's see if the first mock [INIT_CHAT] message reached the server.");
    // Wait for the AI's first message to appear
    await page.waitForTimeout(5000);
    
    await browser.close();
})();
