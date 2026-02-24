async function test() {
  const res = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [
        {"role":"user","content":"[INIT_CHAT]","id":"Cn5WvjDCqS07PfK5"},
        {"id":"UaFjUUrAqqj5tbJm","role":"assistant","parts":[{"type":"step-start"},{"type":"text","text":"Guest, it’s fantastic to have you joining XyzCon 2026 in Melbourne.\n\nYou’re stepping into two days built to supercharge your advisory work – packed with innovation, practical sessions, and plenty of time to connect with other accountants and bookkeepers who think like you.\n\nWould you like:\n- A quick overview of what XyzCon is all about this year, or  \n- A personalised schedule tailored to your interests and goals for the event?","providerMetadata":{"openai":{"itemId":"msg_00d27d00fd8aea2c0069991f7f7e108196b3c2fd87a3d22540"}},"state":"done"}], "content": "Guest..."},
        {"role":"user","content":"My name is diana","id":"EHOFBsCYCxkgLgMO"}
      ]
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
