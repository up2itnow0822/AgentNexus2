# Price Feed Configuration

By default, live prices come from CoinGecko (free, no API key needed).

To use your own provider, set environment variables:

| Variable | Values | Description |
|---|---|---|
| `PRICE_FEED_PROVIDER` | `coingecko` (default), `binance`, `coinmarketcap`, `custom` | Price data source |
| `CMC_API_KEY` | your key | Required when using `coinmarketcap` |
| `PRICE_FEED_URL` | `https://your-api.com/price?symbol={symbol}` | Required when using `custom` |

The `{symbol}` placeholder in `PRICE_FEED_URL` is replaced with the asset symbol (e.g., BTC).

## Examples

```bash
# Default — CoinGecko, no key needed
TRADING_MODE=live python main.py

# Binance public endpoint
TRADING_MODE=live PRICE_FEED_PROVIDER=binance python main.py

# CoinMarketCap
TRADING_MODE=live PRICE_FEED_PROVIDER=coinmarketcap CMC_API_KEY=your_key python main.py

# Custom endpoint
TRADING_MODE=live PRICE_FEED_PROVIDER=custom PRICE_FEED_URL="https://api.myexchange.com/ticker?symbol={symbol}" python main.py
```

## Supported Assets (CoinGecko auto-mapping)

BTC, ETH, SOL, BNB, XRP, ADA, DOGE, AVAX, MATIC, LINK, DOT, UNI, ATOM, LTC, ARB

Other symbols are passed as lowercase to CoinGecko (e.g., `PEPE` → `pepe`).
