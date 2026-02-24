export default async function handler(req: any, res: any) {
  const query = req.url?.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
  const upstreamUrl = `https://translate.google.com/translate_tts${query}`;

  try {
    const upstream = await fetch(upstreamUrl, {
      headers: {
        Referer: 'https://translate.google.com/',
        Origin: 'https://translate.google.com',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
      }
    });

    const arrayBuffer = await upstream.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = upstream.headers.get('content-type') || 'audio/mpeg';

    res.status(upstream.status);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'no-store');
    res.send(buffer);
  } catch (error) {
    res.status(502).json({ error: 'TTS proxy failure', details: String(error) });
  }
}
