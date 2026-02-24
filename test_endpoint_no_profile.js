async function test() {
  const res = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: '[INIT_CHAT]' }]
    })
  });
  
  if (!res.ok) {
    console.log("Error status:", res.status);
    console.log(await res.text());
    return;
  }
  
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
