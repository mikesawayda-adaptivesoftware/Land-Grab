# 🌾 Land-Grab

Search for land listings for sale near any US zip code. Filter and sort results by price per acre, total price, acreage, or distance — all client-side with no extra API calls.

---

## Features

- Search land listings by **zip code + radius** (up to 500 miles)
- Sort by **price per acre**, **total price**, **acreage**, or **distance**
- Filter by min/max acres, price, and distance
- Geocoding via [Nominatim / OpenStreetMap](https://nominatim.openstreetmap.org/) — free, no key required
- Listings via [Zillow ZLLW API](https://rapidapi.com/oneapiproject/api/zllw-working-api) on RapidAPI (free basic plan)
- **Demo mode** — works out of the box with sample data if no API key is set

---

## Tech Stack

| Layer    | Tech                          |
|----------|-------------------------------|
| Frontend | React 18, Vite                |
| Backend  | Node.js, Express              |
| APIs     | Nominatim (geocoding), RapidAPI ZLLW (listings) |
| Deploy   | Docker, GitHub Container Registry |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- A free [RapidAPI](https://rapidapi.com) account with the [ZLLW Working API](https://rapidapi.com/oneapiproject/api/zllw-working-api) subscribed on the **Basic (free)** plan

### 1. Clone & install

```bash
git clone https://github.com/mikesawayda-adaptivesoftware/Land-Grab.git
cd Land-Grab
npm run install:all
```

### 2. Configure environment

```bash
cp env.example .env
```

Open `.env` and add your RapidAPI key:

```
RAPIDAPI_KEY=your_rapidapi_key_here
PORT=3001
```

> **No key?** The app will still run in demo mode and show sample listings.

### 3. Run in development

```bash
npm run dev
```

This starts both the Express server (port `3001`) and the Vite dev server (port `5173`) concurrently. Open [http://localhost:5173](http://localhost:5173).

---

## Project Structure

```
Land-Grab/
├── client/                  # React frontend (Vite)
│   └── src/
│       ├── api/             # API call helpers
│       ├── components/      # SearchForm, FilterControls, SortControls, ListingCard
│       └── App.jsx
├── server/                  # Express backend
│   ├── routes/
│   │   └── search.js        # POST /api/search
│   └── services/
│       ├── geocode.js       # Zip → lat/lon via Nominatim
│       └── listings.js      # Land listings via ZLLW API
├── Dockerfile
├── deploy.sh                # Deploy script (Linux/macOS)
├── deploy.ps1               # Deploy script (Windows PowerShell)
├── env.example
└── package.json
```

---

## Deployment (Docker)

The app ships as a single Docker container. The Express server serves both the API and the built React frontend.

### Windows (PowerShell)

```powershell
$env:GITHUB_CR_PAT = "your_github_pat"
.\deploy.ps1 "your commit message"
```

### Linux / macOS

```bash
export GITHUB_CR_PAT="your_github_pat"
./deploy.sh "your commit message"
```

The script will:
1. Commit and push any changes to GitHub
2. Build a `linux/amd64` Docker image
3. Push it to GitHub Container Registry (`ghcr.io`)

> Your GitHub PAT needs `write:packages` and `read:packages` scopes.
> Create one at [github.com/settings/tokens](https://github.com/settings/tokens).

### Running the container

```bash
docker pull ghcr.io/mikesawayda-adaptivesoftware/land-grab:latest

docker run -d \
  --name land-grab \
  --restart unless-stopped \
  -p 3089:3089 \
  -e RAPIDAPI_KEY=your_key_here \
  ghcr.io/mikesawayda-adaptivesoftware/land-grab:latest
```

Then open [http://localhost:3089](http://localhost:3089).

---

## API

| Method | Endpoint       | Body                              | Description                  |
|--------|----------------|-----------------------------------|------------------------------|
| POST   | `/api/search`  | `{ zip, radiusMiles }`            | Returns land listings        |
| GET    | `/api/health`  | —                                 | Health check                 |

Sorting and filtering happen entirely client-side — changing sort/filter criteria never triggers a new API call.
