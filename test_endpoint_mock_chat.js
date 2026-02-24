async function test() {
  const res = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Profile': encodeURIComponent(JSON.stringify({
        name: "MockUser",
        role: "Developer",
        location: "USA",
        attendanceDays: ["2026-09-03"],
        interests: ["AI"]
      }))
    },
    body: JSON.stringify({
      messages: [{"role":"user","content":"[INIT_CHAT]"}],
      userProfile: {
        name: "MockUserBody",
        role: "Dev",
        location: "USA",
        attendanceDays: ["2026-09-03"],
        interests: ["AI"]
      }
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
  }
}

test().catch(console.error);
