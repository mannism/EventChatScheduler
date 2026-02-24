const testPayload = {
  messages: [
    {
      role: "user",
      content: "Who are the top exhibitors at the event? I am attending Sept 3."
    }
  ],
  userProfile: {
    name: "Tester",
    attendanceDays: ["Sept 3"],
    interests: ["AI", "Tech"]
  }
};

async function run() {
  console.log("Calling /api/chat endpoint...");
  try {
    const res = await fetch("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testPayload)
    });

    if (!res.ok) {
      console.error(`HTTP Error: ${res.status} ${res.statusText}`);
      const text = await res.text();
      console.error(text);
      return;
    }

    const text = await res.text();
    console.log("--- RAW RESPONSE ---");
    console.log(text);
    console.log("--------------------");
    
    if (text.includes('"toolName":"getExhibitors"')) {
        console.log("✅ Tool getExhibitors WAS called by the LLM!");
    } else {
        console.log("❌ Tool getExhibitors was NOT called.");
    }
    
  } catch (err) {
    console.error("Test failed", err);
  }
}

run();
