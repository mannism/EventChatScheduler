const testPayload = {
    messages: [
        {
            role: "user",
            content: "I'd like to see a personalized schedule for the event."
        }
    ],
    userProfile: {
        name: "Tester",
        attendanceDays: ["Sept 3", "Sept 4"],
        interests: ["AI", "Tech"]
    }
};

async function run() {
    console.log("Calling /api/chat endpoint to test createSchedule...");
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

        if (text.includes('"toolName":"createSchedule"')) {
            console.log("✅ Tool createSchedule WAS called by the LLM!");
        } else {
            console.log("❌ Tool createSchedule was NOT called.");
        }

    } catch (err) {
        console.error("Test failed", err);
    }
}

run();
