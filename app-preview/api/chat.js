export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { message, context, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const groqKey = process.env.GROQ_API_KEY;
    const pineconeKey = process.env.PINECONE_API_KEY;
    const pineconeHost = process.env.PINECONE_HOST; // e.g. https://loglift-knowledge-xxxx.svc.pinecone.io

    if (!groqKey) {
      return res.status(500).json({ error: 'GROQ_API_KEY is missing' });
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
            ragContext = '\n\nRelevant knowledge from expert bodybuilding books:\n' +
              hits.map((h, i) =>
                `[${i + 1}] (Source: ${h.fields?.source || 'book'}) ${h.fields?.text || ''}`
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

    // --- Step 2: Build messages with proper system/user separation ---
    const systemContent = [context || '', ragContext].filter(Boolean).join('\n\n');

    // --- Step 3: Call Groq ---
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemContent },
          ...history,
          { role: 'user', content: message }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API Error:', errorText);
      return res.status(response.status).json({ error: `Groq API Error: ${errorText}` });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

    res.status(200).json({ reply, pineconeStatus });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
