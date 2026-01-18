# n8n + Telegram bot (FREE) for Khidmaty search

This guide sets up a **free Telegram bot** that searches **Khidmaty Services** and **Khidmaty Sales** by calling:

- `POST https://<yourdomain>/api/bot/search`

The API returns JSON with clickable URLs back to your site.

---

## 1) Create the Telegram bot (BotFather)

1. Open Telegram and chat with **@BotFather**
2. Run `/newbot`
3. Pick a name and username
4. Copy the **Bot Token** (looks like `123456:ABC...`)

Keep this token secret.

---

## 2) Secure the API endpoint (recommended)

The endpoint supports an optional API key:

- Set `BOT_API_KEY` in your production environment (Vercel/hosting env vars)
- In n8n, send header `x-bot-key: <BOT_API_KEY>`

If `BOT_API_KEY` is not set, the endpoint is dev-friendly and will allow requests without a key.

---

## 3) n8n workflow overview

Create a new workflow with these nodes:

1. **Telegram Trigger**
2. **Function** (Parse command)
3. **HTTP Request** (Call Khidmaty search API)
4. **Function** (Format results)
5. **Telegram** (Send Message)

---

## 4) Telegram Trigger node

- Credentials: use the Bot Token from BotFather
- Updates: **Message**

---

## 5) Function node: Parse command

Add a **Function** node after the trigger and paste this code:

```js
// Input examples:
//   /s plumber city:Tripoli
//   /sale iphone city:Benghazi
//
// Output:
//   { type, q, city, limit }

const text = ($json.message?.text || '').trim();

// Defaults
let type = 'services';
let q = '';
let city = '';
let limit = 6;

// Detect command
if (text.startsWith('/sale')) type = 'sales';
if (text.startsWith('/s ' ) || text === '/s') type = 'services';

// Remove the command part
const parts = text.split(/\s+/).filter(Boolean);
if (parts.length > 0 && parts[0].startsWith('/')) parts.shift();

// Extract key:value tokens like city:Tripoli limit:5
const rest = [];
for (const p of parts) {
  const m = p.match(/^([a-zA-Z]+):(.*)$/);
  if (m) {
    const key = m[1].toLowerCase();
    const val = (m[2] || '').trim();
    if (key === 'city') city = val;
    if (key === 'limit') {
      const n = Number(val);
      if (Number.isFinite(n)) limit = Math.max(1, Math.min(12, Math.trunc(n)));
    }
  } else {
    rest.push(p);
  }
}

q = rest.join(' ').trim();

return [{ type, q, city, limit }];
```

---

## 6) HTTP Request node: Call Khidmaty API

Add an **HTTP Request** node:

- Method: `POST`
- URL: `https://<yourdomain>/api/bot/search`
- Authentication: none
- Send Body: JSON
- Body:
  - `type`: `{{$json.type}}`
  - `q`: `{{$json.q}}`
  - `city`: `{{$json.city}}`
  - `limit`: `{{$json.limit}}`

Headers:
- `Content-Type: application/json`
- Optional (recommended): `x-bot-key: <BOT_API_KEY>`

---

## 7) Function node: Format results for Telegram

Add another **Function** node and paste:

```js
// If you renamed your Telegram Trigger node, update the node name here:
const chatId = $node["Telegram Trigger"].json.message.chat.id;

const res = $json;

if (!res?.ok) {
  return [{ chatId, text: `Search failed: ${res?.error || 'unknown_error'}` }];
}

const type = res.type === 'sales' ? 'Sales' : 'Services';
const city = res.city ? ` (city: ${res.city})` : '';
const q = res.q ? ` "${res.q}"` : '';

const items = Array.isArray(res.results) ? res.results : [];
if (items.length === 0) {
  return [{ chatId, text: `${type}${city}: no results for${q}.` }];
}

const lines = [];
lines.push(`${type}${city}: results for${q}`);
lines.push('');

for (const it of items) {
  const title = (it.title || 'Untitled').toString();
  const url = (it.url || '').toString();
  const price = typeof it.price === 'number' ? it.price : Number(it.price);
  const priceStr = Number.isFinite(price) && price > 0 ? ` — ${price} LYD` : '';
  lines.push(`- ${title}${priceStr}`);
  if (url) lines.push(`  ${url}`);
}

return [{ chatId, text: lines.join('\n') }];
```

---

## 8) Telegram Send Message node

Add a **Telegram** node:

- Operation: **Send Message**
- Chat ID: `{{$json.chatId}}`
- Text: `{{$json.text}}` (from the Format node)

Tip: If you prefer, you can also send the message back to the same chat by mapping the chat id from the Telegram Trigger node directly.

---

## Example API calls

Services:

`GET /api/bot/search?type=services&q=plumber&city=Tripoli&limit=5`

Sales:

`GET /api/bot/search?type=sales&q=iphone&city=Benghazi&limit=5`
