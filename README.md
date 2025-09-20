2. No need to store each and every thing when deep research we just want stock and their price other than that all the information will be fetch only no storing
1. Wishlits addin featured with deleting
2. My portfolio where ill add my stock with qty, buying price and status of  sold / hold and same modal will open where selling price will be added and status must change to sold
3. A portfolio page with all the active purchase, sold, profit, loss management Ui and history of stocks


now we have to make a GLobal rule set so that all our stocks are islamic sharia compliant


📌 Quick Checklist Before Buying a Stock
 - Business sector is halal ✅
- Non-permissible income < 5% ✅
- Interest-based debt ≤ 30–33% ✅
- Cash & interest-bearing securities ≤ 30–33% ✅
- Accounts receivable ≤ 50% ✅

✅ Shariah Screening Criteria for Stocks
1. Core Business Activity Check

- The primary business of the company must be halal (permissible).
Not allowed (Haram sectors):
- Conventional banking, insurance, and other interest-based financial services.

- Alcohol, gambling, casinos, and adult entertainment.

- Pork and non-halal food products.

- Tobacco, drugs, and intoxicants.

- Weapons and arms manufacturing (in many Shariah boards).

- If a company’s main revenue comes from these sectors → ❌ Not Shariah-compliant.

2. Non-Permissible Income Threshold

Even if the main business is halal, some incidental income from haram sources is tolerated within limits.

Rule:

- Non-permissible income (like interest, haram investments, etc.) must be < 5% of total revenue.

- If above 5% → ❌ Not Shariah-compliant.

3. Debt Screening (Riba/Interest Rule)

- Company should not be heavily dependent on interest-based borrowing.

Rule:

- Total interest-bearing debt / Total Assets ≤ 30–33% (varies by Shariah boards).
- If debt exceeds the threshold → ❌ Not Shariah-compliant.

4. Cash & Liquid Asset Screening

To avoid trading in money (riba) instead of real assets:

Rule:

- Cash + Interest-bearing securities / Total Assets ≤ 30–33%.
- Ensures company isn’t just sitting on interest-based income or excessive cash.

5. Receivables & Liquidity Screening

- High receivables may indicate reliance on credit/interest transactions.

Rule:

- Accounts receivable / Total Assets ≤ 50%.
- Ensures company assets are not mostly debt-based transactions.git

# Swing Trader
## ✓ 1 — High-level architecture

1. Input: stock symbol (e.g., `LODHA`, or exchange-prefixed `NSE:LODHA`).
2. Fetcher layer (microservices): price/timeseries, fundamentals, corporate filings, news & social sentiment, institutional flows.
3. Data store: time-series DB or cloud DB (Postgres + timescale / or just Postgres) + cache (Redis).
4. Processing / Feature layer: compute indicators (MA, EMA, RSI, MACD, ATR, volume averages, support/resistance, Fibonacci levels), fundamentals ratios, event flags.
5. Signal engine (rules + ML): rule-based first; optionally ML ensemble later.
6. Risk & sizing: position-size calculator given risk% and SL distance.
7. API / UI: REST endpoint + simple React UI to accept symbol and show recommendation + charts.
8. Backtesting / Simulation: backtrader / vectorbt / zipline-style pipeline to validate rules.
9. Deployment: Docker + Kubernetes / or simple VPS with Docker Compose; scheduled workers (cron / Celery).

## ✓ 2 — Suggested data sources (practical, developer-friendly)

--> Price / OHLCV: `yfinance` for quick prototyping (works for many Indian tickers), or broker APIs (Zerodha Kite Connect, Upstox) for live and reliable data.
--> Intraday / Real-time: broker websockets (Kite), or paid feeds.
--> Fundamentals & ratios: Screener.in (scraping / unofficial API), TickerTape, Moneycontrol (scrape), FinancialModelingPrep (global), or official company filings (NSE/BSE).
--> Corporate filings / announcements: NSE/BSE official feeds (scrape or subscribe).
--> News / Sentiment: NewsAPI, GNews, or custom scrape of Economic Times / Business Standard / Livemint + a small sentiment model (VADER / small finetuned classifier).
--> FII/DII flows: NSE FII/DII daily reports, or vendor feeds.
--> Alternative: paid vendors (Quandl premium, Refinitiv) if you want production-grade reliability.

> Note: Indian exchanges have rate limits and official APIs are limited; for production prefer broker feeds or paid data.

## ✓ 3 — Rules & heuristics (how to decide Buy / Not buy)

Start with a rule-based decision tree (easy to backtest). Example rules to -->recommend buy-->:

Must-pass (fundamental safety):

--> Company revenue or operating cashflow positive last 4 quarters.
--> Net debt / equity < 0.6 (configurable).
--> No major promoter pledge or serious corporate governance flags in last 6 months.

Technical filters (example):

--> Trend: price > 50 DMA (short-term bullish bias).
--> Momentum: RSI(14) between 40–65 (not overbought); MACD bullish crossover in last 5 days.
--> Breakout / support confirmation: either

  --> Pullback to 20/50 DMA and bullish reversal candle with volume > 1.2× 20-day average, OR
  --> Breakout above recent resistance (e.g., 20-day high) with volume > 1.5× avg.

News filter:

--> No negative headlines or large negative sentiment spike in last 48 hrs.

If all above true → Buy. Otherwise → Avoid or Watchlist.

## ✓ 4 — How to compute Entry, Stop-Loss, Target (simple, transparent rules)

We’ll define levels based on price action and volatility:

--> Entry (buy):

  --> If breakout strategy: buy on close above resistance `R` (e.g., 20-day high) OR buy on the next candle open after confirmation.
  --> If dip strategy: buy when price shows bullish reversal near support `S` (20/50 DMA or an identified swing low).

--> Stop-Loss (SL):

  --> For breakout: SL = `R - k --> ATR(14)` or SL = last swing low — whichever is lower (k \~ 0.5–1).
  --> For dip entry: SL = `S - 0.5 --> ATR(14)` or fixed percent (e.g., 4–8%) depending on timeframe.
  --> Use ATR to adapt for volatility.

--> Target (take-profit):

  --> Simple multiple: `Target = Entry + 2 --> (Entry - SL)` (R\:R of 1:2).
  --> Or measured-move: `Target = Entry + width_of_channel` (height of breakout range) or next major resistance (Fibonacci extension 1.618).
  --> You can also set multiple targets (partial sell at 1× risk, remainder at 2× risk).

Example numeric:

--> Price = ₹1,120, breakout R = ₹1,100, ATR(14)=₹20.
--> Entry on breakout close above ₹1,100 → buy ₹1,110.
--> SL = 1,100 - (0.5 \--> 20) = ₹1,090. Risk per share = ₹20.
--> Target = 1,110 + 2\-->20 = ₹1,150 (conservative) or measure further to ₹1,190 based on channel width.

## ✓ 5 — Risk & position sizing

--> Let `risk_per_trade = 1%` of portfolio.
--> `position_size_shares = floor( (portfolio_value --> risk_per_trade) / (entry - SL) )`.
--> Apply max exposure per sector and max simultaneous trades.

## ✓ 6 — Backtesting & validation

--> Use vectorbt (fast, numpy-based) or backtrader to validate rules over 5–10 years of data.
--> Track metrics: CAGR, max drawdown, Sharpe, win rate, average R\:R, ## ✓ trades per year, slippage assumptions, transaction costs.

## ✓ 7 — Tech stack & components

--> Backend: Python (FastAPI) — easy microservices + async IO.
--> Indicators / calc: `pandas`, `ta` (pandas\_ta) or `ta-lib` (if you compile it). `numpy`, `scipy`.
--> Data fetching: `yfinance` for prototype; later integrate Kite Connect / broker APIs.
--> Database: Postgres; for time series optionally TimescaleDB. Cache with Redis.
--> Queue / scheduling: Celery + Redis or Prefect/Airflow for pipelines.
--> Front end: React + Tailwind (you already use Tailwind) — simple input + results panel + chart (TradingView widget or lightweight charting like `react-stockcharts` or `recharts`).
--> Container: Docker. CI: GitHub Actions. Deploy: DigitalOcean / AWS ECS / GCP Cloud Run.

## ✓ 10 — Backtest & sanity checks to avoid overfitting

--> Include transaction costs (0.05–0.3%) and slippage (0.1–0.5%).
--> Walk-forward validation and cross-validation across sectors.
--> Log false positives and edge cases (corporate actions, de-listings).

## ✓ 11 — UX / result presentation (what the user sees)

--> Simple card: `BUY / AVOID / WATCH` with reason tags (e.g., “Breakout with volume”, “Debt too high”).
--> Show numeric levels: Entry ₹X, SL ₹Y, Target ₹Z, Position size for portfolio ₹P.
--> Small chart with highlighted entry/SR levels and trade horizon suggestion (e.g., 2–6 weeks).
--> Confidence score (0–100) based on how many rules passed.

## ✓ 12 — Legal & risk disclaimers

--> Provide a clear “not financial advice” notice in UI and logs; add user-acceptance of risk if you provide actionable signals.
--> Consider throttling and compliance with data provider TOS (scraping vs API).
