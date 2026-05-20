const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3001;
const DB_PATH = path.join(__dirname, 'data', 'db.json');

app.use(cors());
app.use(express.json({ limit: '10mb' }));

function loadItems() {
  try {
    if (!fs.existsSync(DB_PATH)) return [];
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  } catch {
    return [];
  }
}

function saveItems(items) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(items, null, 2), 'utf-8');
}

// GET /api/items
app.get('/api/items', (req, res) => {
  res.json(loadItems());
});

// POST /api/items
app.post('/api/items', (req, res) => {
  const items = loadItems();
  const item = {
    id: Date.now().toString(),
    title: '',
    price: null,
    image: '',
    rating: 0,
    memo: '',
    url: '',
    ...req.body,
    createdAt: new Date().toISOString(),
  };
  items.unshift(item);
  saveItems(items);
  res.status(201).json(item);
});

// PUT /api/items/:id
app.put('/api/items/:id', (req, res) => {
  const items = loadItems();
  const idx = items.findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  items[idx] = { ...items[idx], ...req.body };
  saveItems(items);
  res.json(items[idx]);
});

// DELETE /api/items/:id
app.delete('/api/items/:id', (req, res) => {
  const items = loadItems();
  const idx = items.findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  items.splice(idx, 1);
  saveItems(items);
  res.status(204).end();
});

function fetchHtml(url, depth = 0) {
  if (depth > 3) return Promise.reject(new Error('Too many redirects'));
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    };
    const req = client.get(url, options, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        const next = res.headers.location.startsWith('http')
          ? res.headers.location
          : new URL(res.headers.location, url).href;
        res.resume();
        return fetchHtml(next, depth + 1).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    });
    req.on('error', reject);
    req.setTimeout(8000, () => { req.destroy(); reject(new Error('Request timeout')); });
  });
}

function parseOgMeta(html, rawUrl) {
  const getMeta = (attr, val) => {
    const re = new RegExp(
      `<meta[^>]+${attr}=["']${val}["'][^>]+content=["']([^"']*?)["']|<meta[^>]+content=["']([^"']*?)["'][^>]+${attr}=["']${val}["']`,
      'i'
    );
    const m = html.match(re);
    return m ? (m[1] || m[2] || '').trim() : '';
  };

  const title =
    getMeta('property', 'og:title') ||
    getMeta('name', 'twitter:title') ||
    (html.match(/<title[^>]*>([^<]*)<\/title>/i) || [])[1]?.trim() ||
    '';

  const image =
    getMeta('property', 'og:image') ||
    getMeta('name', 'twitter:image') ||
    '';

  // Korean shopping site price patterns
  const pricePatterns = [
    /["']price["']\s*:\s*["']?(\d[\d,]*)/i,
    /판매가[^0-9]*(\d[\d,]*)/,
    /할인가[^0-9]*(\d[\d,]*)/,
    /정가[^0-9]*(\d[\d,]*)/,
    /sellingPrice[^0-9]*(\d[\d,]*)/i,
    /(\d[\d,]{2,})\s*원/,
    /₩\s*(\d[\d,]*)/,
  ];
  let price = null;
  for (const re of pricePatterns) {
    const m = html.match(re);
    if (m) {
      const num = parseInt(m[1].replace(/,/g, ''));
      if (num >= 100 && num <= 100_000_000) { price = num; break; }
    }
  }

  return { title, image, price, url: rawUrl };
}

// GET /api/fetch-meta?url=...
app.get('/api/fetch-meta', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'url query param required' });
  try {
    const html = await fetchHtml(url);
    const meta = parseOgMeta(html, url);
    res.json(meta);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`API server → http://localhost:${PORT}`);
});
