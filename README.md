# Lumos - Procurement Assistant

Lightweight prototype for alternate vendor recommendations in procurement with SKU search.

## Setup

### Backend (Python/FastAPI)

```bash
cd backend
pip3 install -r requirements.txt
chmod +x run.sh
./run.sh
```

Backend runs on `http://localhost:8000`

### Frontend (React/Vite)

```bash
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

## Features

- Real-time SKU search with autocomplete
- Top 90% SKUs by spend (~1000 SKUs)
- Clean landing page with search
- Vendor results with expandable tiles
- Priority-based ordering
- Minimal, Apple-inspired design

