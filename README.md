# AagniShield

**Heat&rarr;Health ward risk &amp; decision engine for Mumbai.** Built for Smart India Hackathon
as a 1-day MVP. Proves the full chain — weather forecast &rarr; thermal hazard &rarr;
ward vulnerability &rarr; combined risk &rarr; recommended actions &rarr; audience-specific alert —
for 8 real Mumbai wards, on an actual map, with every engine as a real backend
service, not logic buried in the frontend.

## Stack

- **Backend:** FastAPI (Python), engines as pure functions in `backend/engines/`
- **Frontend:** React (Vite) + Tailwind + react-leaflet (dark CartoDB basemap) + recharts
- **Weather:** Open-Meteo, called server-side. If unreachable, falls back to a
  deterministic seeded mock (see `backend/engines/weather.py`) so the demo
  never breaks live, even offline.
- **Data:** `backend/data/wards.json` — 8 Mumbai wards, every field tagged
  `verified` (with source) or `estimated`. Shown as provenance badges in the UI.

## Run it locally

You need Python 3.10+ and Node 18+.

### 1. Backend

```bash
cd backend
python3 -m venv venv && source venv/bin/activate   # optional but recommended
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Check it's alive: `curl http://127.0.0.1:8000/api/health` should return
`{"status":"ok","wards_loaded":8}`.

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the URL Vite prints (default `http://127.0.0.1:5173`). The dev server
proxies `/api/*` to `http://127.0.0.1:8000` (see `vite.config.js`), so the
frontend doesn't need to know about CORS or ports.

That's it — no database, no build step, no deployment needed for the demo.

## What to walk a judge through

1. **The map** — 8 wards as circle markers, colored/sized by risk band. Click
   one, or click a row in the ranked list on the left.
2. **The day tabs** — 5-day forecast, backend recomputes the whole pipeline
   per day (including a rolling count of consecutive Extreme-risk days,
   which feeds the health-impact multiplier).
3. **The pipeline strip** in the right panel — forecast &rarr; hazard (WBGT) &rarr;
   vulnerability &rarr; risk &rarr; action, in one glance.
4. **The explainability panel** below it — which vulnerability driver
   dominates for this ward (bar chart), the raw ward stats with
   verified/estimated provenance badges, and a plain-English trace of the
   exact arithmetic that produced the risk score. This is what you point to
   if a judge asks "why is this ward Extreme and that one High?"
5. **The alert tabs** — same risk payload, three differently-worded outputs
   for a citizen, a hospital, and the municipal ops team.
6. **Whiteboard-ready formulas** — every calculation lives in a pure function
   (`compute_wbgt`, `compute_vulnerability`, `compute_risk`, ...) in
   `backend/engines/`, so you can open the file and walk through the exact
   math live.

## Honest limitations (say these out loud, judges respect it)

- Ward markers are circles at centroids, not real BMC ward boundary polygons
  (Option A from the architecture doc — swap in real GeoJSON if you have
  1-2 more hours; `MapView.jsx` already has the risk-band coloring logic
  ready to reuse for a `<GeoJSON>` layer).
- `elderly_pct`, `outdoor_worker_pct`, `green_cover_pct`, and most
  `density_per_km2`/`population` values are estimated placeholders, not
  ward-verified. `informal_housing_pct` is the strongest real signal
  (cited, see `wards.json`'s `sources` block). Population figures are 2001
  Census-era; pull 2011 data from the OpenCity portal before a real
  submission.
- `health_impact.py` is explicitly a rule-based shape-matcher, not a fitted
  model — the UI labels it "confidence: low" for exactly this reason.
- Vulnerability weights (0.15/0.25/0.15/0.15/0.30) are a stated starting
  point, not empirically calibrated.

## Project layout

```
aagnishield/
├── backend/
│   ├── main.py                 # FastAPI app, route registration
│   ├── engines/
│   │   ├── weather.py          # Open-Meteo + deterministic mock fallback
│   │   ├── thermal.py          # WBGT approx, hazard score
│   │   ├── vulnerability.py    # normalizes ward stats -> vulnerability score
│   │   ├── risk.py             # combines hazard + vulnerability -> risk + band
│   │   ├── health_impact.py    # rule-based placeholder estimate
│   │   ├── decision.py         # risk band + driver -> action list
│   │   └── alerts.py           # template-based alert text generation
│   ├── data/wards.json
│   └── requirements.txt
└── frontend/
    └── src/
        ├── components/
        │   ├── MapView.jsx
        │   ├── DayTabs.jsx
        │   ├── WardList.jsx
        │   ├── PipelineChain.jsx
        │   ├── RiskExplain.jsx
        │   └── AlertPanel.jsx
        ├── api.js
        ├── riskTheme.js
        └── App.jsx
```

## GIS ward choropleth

The frontend map now uses polygon-based Mumbai BMC ward boundaries instead of circular point markers. Risk-bearing wards are filled using the existing AagniShield risk bands; wards without risk data remain neutral so the UI does not invent scores.

Boundary source used by the frontend: DataMeet Municipal Spatial Data, `Mumbai/BMC_Wards.geojson`. The source is loaded at runtime from its public GitHub raw endpoint. The repository also documents Mumbai administrative ward GeoJSON datasets and their licensing/attribution requirements.
