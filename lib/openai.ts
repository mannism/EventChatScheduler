/**
 * lib/openai.ts
 *
 * OpenAI SDK v6 client wrapper. Initializes a singleton instance
 * configured with the OPENAI_API_KEY environment variable.
 * Note: The main chat route uses @ai-sdk/openai directly for streaming;
 * this module is available for any non-streaming OpenAI calls.
 */

import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export default openai;
