export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { message, context, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const pineconeKey = process.env.PINECONE_API_KEY;
    const pineconeHost = process.env.PINECONE_HOST;

    if (!anthropicKey) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY is missing' });
    }

    // --- Step 1: Query Pinecone for relevant book passages ---
    let ragContext = '';
    let pineconeStatus = 'skipped (no keys)';
    if (pineconeKey && pineconeHost) {
      try {
        const searchRes = await fetch(`${pineconeHost}/records/namespaces/loglift/search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Api-Key': pineconeKey,
          },
          body: JSON.stringify({
            query: { inputs: { text: message }, top_k: 4 },
            fields: ['text', 'source'],
          }),
        });

        if (searchRes.ok) {
          const searchData = await searchRes.json();
          const hits = searchData.result?.hits || [];
          if (hits.length > 0) {
            ragContext = '\n\nRelevant expert knowledge:\n' +
              hits.map((h, i) =>
                `[${i + 1}] ${h.fields?.text || ''}`
              ).join('\n\n');
            pineconeStatus = `ok (${hits.length} hits)`;
          } else {
            pineconeStatus = 'ok but 0 hits - index may still be indexing';
          }
        } else {
          const errText = await searchRes.text();
          pineconeStatus = `http ${searchRes.status}: ${errText.slice(0, 300)}`;
        }
      } catch (pineconeErr) {
        pineconeStatus = `exception: ${pineconeErr.message}`;
      }
    }

    // --- Step 2: Build system prompt ---
    const systemContent = [context || '', ragContext].filter(Boolean).join('\n\n');

    // --- Step 3: Call Anthropic (with retry on overload) ---
    const anthropicBody = JSON.stringify({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 2048,
      system: systemContent,
      messages: [...history, { role: 'user', content: message }],
    });

    const anthropicHeaders = {
      'Content-Type': 'application/json',
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
    };

    let response, data;
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: anthropicHeaders,
        body: anthropicBody,
      });

      if (response.ok) {
        data = await response.json();
        break;
      }

      const errorText = await response.text();
      let errorObj = {};
      try { errorObj = JSON.parse(errorText); } catch {}

      const isOverloaded = errorObj.error?.type === 'overloaded_error' || errorObj.type === 'overloaded_error';
      if (isOverloaded && attempt < maxAttempts) {
        await new Promise(r => setTimeout(r, attempt * 800));
        continue;
      }

      console.error('Anthropic API Error:', response.status, errorText);
      return res.status(response.status).json({ error: `Anthropic API Error: ${errorText}`, errorType: errorObj.error?.type || errorObj.type || 'unknown' });
    }

    const reply = data?.content?.[0]?.text || "I'm sorry, I couldn't generate a response.";

    res.status(200).json({ reply, pineconeStatus });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
