async function test() {
  const res = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Profile': encodeURIComponent(JSON.stringify({
        name: "Test User",
        role: "Accountant",
        location: "Australia",
        attendanceDays: ["2026-09-03", "2026-09-04"],
        interests: ["AI"]
      }))
    },
    body: JSON.stringify({
      messages: [
        { role: 'user', content: 'please create a schedule for me' },
        { role: 'assistant', content: 'I can generate a schedule for you based on your interests. Shall I proceed?' },
        { role: 'user', content: '[GENERATE_SCHEDULE]' }
      ]
    })
  });
  
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let done = false;

  while (!done) {
    const { value, done: doneReading } = await reader.read();
    done = doneReading;
    if (value) {
      process.stdout.write(decoder.decode(value));
    }
  }
}

test().catch(console.error);
