export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const key = process.env.DEEPSEEK_KEY;
  if (!key) return res.status(500).json({ error: 'DEEPSEEK_KEY not configured on server' });

  try {
    const { messages } = req.body;
    const upstream = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({ model: 'deepseek-chat', messages, temperature: 0.85, max_tokens: 800 })
    });
    if (!upstream.ok) {
      const err = await upstream.text();
      return res.status(upstream.status).json({ error: err });
    }
    res.json(await upstream.json());
  } catch (e) {
    res.status(500).json({ error: 'AI resolution failed: ' + e.message });
  }
}
