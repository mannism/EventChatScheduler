// using native fetch

async function main() {
    const res = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            messages: [{ role: 'user', content: '[INIT_CHAT]', id: 'init' }],
            userProfile: {
                name: 'Test',
                jobType: 'Test',
                location: 'Test',
                attendanceDays: ['Both'],
                interests: ['AI']
            }
        })
    });

    console.log(res.status);
    console.log(await res.text());
}

main().catch(console.error);
