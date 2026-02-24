export default async function handler(req: any, res: any) {
  const apiKey = process.env.NVIDIA_API_KEY || process.env.VITE_NVIDIA_API_KEY;

  if (!apiKey) {
    res.status(500).json({ error: 'Missing NVIDIA API key on server.' });
    return;
  }

  const rawPath = typeof req.query?.path === 'string' ? req.query.path : '';
  const upstreamPath = rawPath.replace(/^\/+/, '');
  const queryParams = new URLSearchParams();
  Object.entries(req.query || {}).forEach(([key, value]) => {
    if (key === 'path') return;
    if (Array.isArray(value)) {
      value.forEach((item) => queryParams.append(key, String(item)));
      return;
    }
    if (typeof value !== 'undefined') {
      queryParams.append(key, String(value));
    }
  });
  const query = queryParams.toString();
  const upstreamUrl = `https://integrate.api.nvidia.com/v1/${upstreamPath}${query ? `?${query}` : ''}`;

  try {
    const upstream = await fetch(upstreamUrl, {
      method: req.method,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: req.method === 'GET' || req.method === 'HEAD' ? undefined : JSON.stringify(req.body)
    });

    const text = await upstream.text();
    const contentType = upstream.headers.get('content-type') || 'application/json; charset=utf-8';

    res.status(upstream.status);
    res.setHeader('Content-Type', contentType);
    res.send(text);
  } catch (error) {
    res.status(502).json({ error: 'NVIDIA proxy failure', details: String(error) });
  }
}
