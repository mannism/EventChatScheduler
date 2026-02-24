const { streamText } = require('ai');
const { openai } = require('@ai-sdk/openai');
async function test() {
   const res = await streamText({
      model: openai('gpt-4o'),
      prompt: 'hi'
   });
   console.log(Object.keys(res));
}
test();
