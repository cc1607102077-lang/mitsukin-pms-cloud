export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (req.method === 'GET') {
    if (kvUrl && kvToken) {
      try {
        const response = await fetch(`${kvUrl}/get/mitsukin_pms_data`, {
          headers: { Authorization: `Bearer ${kvToken}` }
        });
        const data = await response.json();
        let result = data.result;
        if (typeof result === 'string') {
          try { result = JSON.parse(result); } catch (e) {}
        }
        return res.status(200).json(result || {});
      } catch (err) {
        return res.status(500).json({ error: err.message });
      }
    }
    return res.status(200).json({});
  }

  if (req.method === 'POST') {
    const body = req.body;
    if (kvUrl && kvToken) {
      try {
        const payload = typeof body === 'string' ? body : JSON.stringify(body);
        await fetch(`${kvUrl}/set/mitsukin_pms_data`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${kvToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify([payload])
        });
        return res.status(200).json({ success: true, timestamp: Date.now() });
      } catch (err) {
        return res.status(500).json({ error: err.message });
      }
    }
    return res.status(200).json({ success: true, warning: 'KV not attached yet, saved in memory/local' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
