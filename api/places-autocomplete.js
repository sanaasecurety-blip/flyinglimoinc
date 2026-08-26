module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const query = (req.query.q || '').toString().trim();
  if (query.length < 2) {
    return res.status(200).json({ results: [] });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.error('GOOGLE_PLACES_API_KEY is not configured');
    return res.status(500).json({ error: 'Server not configured' });
  }

  try {
    const r = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat',
      },
      body: JSON.stringify({ input: query }),
    });

    if (!r.ok) {
      const text = await r.text();
      console.error('Places API error:', r.status, text);
      return res.status(200).json({ results: [] });
    }

    const data = await r.json();
    const suggestions = Array.isArray(data.suggestions) ? data.suggestions : [];

    const results = suggestions
      .map((s) => s.placePrediction)
      .filter(Boolean)
      .map((p) => {
        const main = p.structuredFormat && p.structuredFormat.mainText ? p.structuredFormat.mainText.text : (p.text ? p.text.text : '');
        const sub = p.structuredFormat && p.structuredFormat.secondaryText ? p.structuredFormat.secondaryText.text : '';
        const fill = p.text ? p.text.text : main;
        return { main, sub, fill };
      })
      .filter((item) => item.main);

    res.setHeader('Cache-Control', 'private, max-age=60');
    return res.status(200).json({ results });
  } catch (err) {
    console.error('Places API request failed:', err);
    return res.status(200).json({ results: [] });
  }
};
