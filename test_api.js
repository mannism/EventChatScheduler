const userProfile = {
  name: "Test User",
  role: "Accountant",
  location: "Australia",
  attendanceDays: ["Day 1 - November 25", "Day 2 - November 26"],
  interests: ["AI"]
};

async function testChat() {
  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Profile': encodeURIComponent(JSON.stringify(userProfile))
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: '[INIT_CHAT]' }]
      })
    });
    
    console.log("Status:", response.status);
    
    // It's a readable stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    
    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      if (value) {
        process.stdout.write(decoder.decode(value));
      }
    }
    console.log("\nStream finished.");
  } catch(e) {
    console.error("Fetch failed:", e);
  }
}

testChat();
