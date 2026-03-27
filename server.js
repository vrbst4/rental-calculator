import 'dotenv/config';
import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/lookup', async (req, res) => {
  const { query } = req.body;
  if (!query || query.trim().length < 5) {
    return res.status(400).json({ error: 'Enter a property address or listing URL' });
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server missing ANTHROPIC_API_KEY' });
  }

  const isUrl = /^https?:\/\//i.test(query.trim());

  // Build a very specific prompt depending on whether it's a URL or address
  let searchInstructions;
  if (isUrl) {
    searchInstructions = `The user gave you this EXACT listing URL: ${query}

DO THIS IN ORDER:
1. Search for this exact URL to find the listing page content
2. From the listing page, extract the EXACT listing price shown (not Zestimate, not estimated value — the actual asking/listing price)
3. Extract the EXACT property tax amount shown on the listing page (usually under "Monthly cost" or "Tax history" or "Property details")
4. Extract beds, baths, sqft, year built, lot size, HOA from the listing page
5. Then do a SEPARATE search for: rental prices for similar homes in that zip code to estimate monthly rent`;
  } else {
    searchInstructions = `The user gave you this property address: ${query}

DO THIS IN ORDER:
1. Search for this address on Zillow to find the current listing or Zestimate
2. Get the EXACT listing price or Zestimate shown on the page
3. Search for this address on the county tax assessor website to get the EXACT annual property tax amount
4. Search for rental listings in the same zip code with similar bedrooms to estimate monthly rent
5. Get beds, baths, sqft, year built, lot size from the listing or public records`;
  }

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: `You are a real estate data extraction assistant. Your job is to find ACCURATE property data. Accuracy is critical — a financial advisor will use these numbers with clients.

IMPORTANT RULES:
- For PRICE: Use the exact current listing price shown on the listing page. If not for sale, use the Zestimate or estimated value. Never round or approximate.
- For TAX: Use the exact annual property tax shown on the listing page or county records. Look for "Property taxes" or "Tax assessed" on the listing. If shown monthly, multiply by 12.
- For RENT: Search for actual rental listings of similar properties (same beds, similar sqft) in the same zip code. Use real comp data, not estimates.
- For HOA: Use the exact amount from the listing. If shown as monthly, multiply by 12. If no HOA mentioned, use 0.
- For all other fields: Use the exact numbers from the listing page.

After your research, return ONLY a raw JSON object (no markdown, no backticks, no explanation before or after):
{"address":"full street address, city, state zip","price":0,"rent":0,"tax":0,"ins":0,"hoa":0,"beds":0,"baths":0,"sqft":0,"yearBuilt":0,"lotSqft":0,"parking":"","propertyType":""}

Field definitions:
- price: EXACT listing price from the page (not estimated, not rounded)
- rent: estimated monthly rent based on actual local rental comps you found
- tax: EXACT annual property tax from the listing page or county records
- ins: estimated annual insurance (use 0.35% of purchase price for PA)
- hoa: annual HOA (monthly amount from listing × 12, or 0 if none)
- sqft: living area square footage from listing
- lotSqft: lot size in sqft (convert acres to sqft by multiplying by 43560)
- parking: describe garage/parking from listing (e.g. "1 Car Garage", "Driveway")
- propertyType: "Single Family", "Townhouse", "Condo", etc.`,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{ role: 'user', content: searchInstructions }],
    });

    const textContent = message.content.filter(b => b.type === 'text').map(b => b.text).join('');
    const jsonMatch = textContent.replace(/```json|```/g, '').trim().match(/\{[\s\S]*?\}/);
    if (!jsonMatch) {
      return res.status(422).json({ error: 'Could not find property data. Try a more specific address with city and state.' });
    }

    const d = JSON.parse(jsonMatch[0]);
    const result = {
      address: String(d.address || ''), price: Math.max(0, Number(d.price) || 0),
      rent: Math.max(0, Number(d.rent) || 0), tax: Math.max(0, Number(d.tax) || 0),
      ins: Math.max(0, Number(d.ins) || 0), hoa: Math.max(0, Number(d.hoa) || 0),
      beds: Math.max(0, Number(d.beds) || 0), baths: Math.max(0, Number(d.baths) || 0),
      sqft: Math.max(0, Number(d.sqft) || 0), yearBuilt: Math.max(0, Number(d.yearBuilt) || 0),
      lotSqft: Math.max(0, Number(d.lotSqft) || 0), parking: String(d.parking || ''),
      propertyType: String(d.propertyType || ''),
    };
    if (result.ins === 0 && result.price > 0) result.ins = Math.round(result.price * 0.0035);
    console.log(`[Lookup] ${result.address} -> Price: $${result.price.toLocaleString()} | Tax: $${result.tax} | Rent est: $${result.rent}/mo`);
    return res.json(result);
  } catch (err) {
    console.error('[Lookup Error]', err.message);
    if (err.status === 401) return res.status(500).json({ error: 'Invalid API key' });
    if (err.status === 429) return res.status(429).json({ error: 'Rate limited — wait a moment and try again' });
    return res.status(500).json({ error: 'Lookup failed: ' + err.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', hasApiKey: !!process.env.ANTHROPIC_API_KEY });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Newbridge Calculator running at http://localhost:${PORT}`);
  console.log(`API Key: ${process.env.ANTHROPIC_API_KEY ? 'Configured' : 'Missing — set ANTHROPIC_API_KEY'}`);
  console.log(`Supports: Zillow/Redfin URLs and street addresses`);
});
