import { convertToModelMessages } from 'ai';

async function run() {
  const messages = [
    {"role":"user","content":"[INIT_CHAT]","id":"Cn5WvjDCqS07PfK5"},
    {"id":"UaFjUUrAqqj5tbJm","role":"assistant","parts":[{"type":"step-start"},{"type":"text","text":"Guest, it’s fantastic to have you joining XyzCon 2026 in Melbourne.\n\nYou’re stepping into two days built to supercharge your advisory work – packed with innovation, practical sessions, and plenty of time to connect with other accountants and bookkeepers who think like you.\n\nWould you like:\n- A quick overview of what XyzCon is all about this year, or  \n- A personalised schedule tailored to your interests and goals for the event?","providerMetadata":{"openai":{"itemId":"msg_00d27d00fd8aea2c0069991f7f7e108196b3c2fd87a3d22540"}},"state":"done"}], "content": "Guest..."},
    {"role":"user","content":"My name is diana","id":"EHOFBsCYCxkgLgMO"}
  ];
  
  const validMessages = messages.map((msg: any) => {
      if (msg.role === 'user' && msg.content && !msg.parts) {
          return { ...msg, parts: [{ type: 'text', text: msg.content }] };
      }
      return msg;
  });

  // @ts-ignore
  console.log(JSON.stringify(await convertToModelMessages(validMessages), null, 2));
}

run().catch(console.error);
