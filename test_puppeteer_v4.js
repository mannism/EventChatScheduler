const { chromium } = require('playwright');
(async () => {
    try {
        const browser = await chromium.launch();
        const page = await browser.newPage();
        
        await page.goto('http://localhost:3000/');
        
        // Input name
        await page.fill('input[placeholder="e.g. Jane Doe"]', 'Jane Test');
        
        // Click role combobox and select Accountant
        await page.click('button[role="combobox"]');
        await page.waitForSelector('text=Accountant');
        await page.click('text=Accountant');
        
        // Find all comboboxes
        const combos = await page.$$('button[role="combobox"]');
        
        // Click location combobox (second one)
        await combos[1].click();
        await page.waitForSelector('text=Australia');
        await page.click('text=Australia');
        
        // Select Both Days
        await page.click('label:has-text("Both Days")');
        
        // Click interests combobox (third one)
        await combos[2].click();
        await page.waitForSelector('text=AI');
        await page.click('text=AI');
        
        // Submit form
        await page.click('button:has-text("Continue")');
        
        // Wait for chat to load
        await page.waitForSelector('input[placeholder="Type your question..."]', { timeout: 10000 });
        console.log("Chat loaded successfully.");
        
        // Wait for the first AI response containing "Jane Test"
        // The bot should say something like "Hello Jane Test!"
        try {
            await page.waitForSelector('text=Jane Test', { timeout: 15000 });
            console.log("SUCCESS! The bot greeted the user by name (Jane Test).");
        } catch (err) {
            console.log("FAILED to find 'Jane Test' in the chat within 15 seconds.");
            // Print the last few messages
            const texts = await page.$$eval('.whitespace-pre-wrap', els => els.map(e => e.textContent));
            console.log("Messages present:", texts);
        }
        
        await browser.close();
    } catch(err) {
        console.error("Test error:", err);
    }
})();
