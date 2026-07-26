#!/usr/bin/env bash
# One-shot local setup (non-Docker). Run from the project root:
#   bash scripts/setup.sh
set -e

echo "== CrimeGraph AI setup =="

echo "-- Backend --"
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip -q
pip install -r requirements.txt -q
echo "Generating synthetic city and training ML models..."
python -m app.data.synthetic_generator
python -m app.ml.train_risk_model
deactivate
cd ..

echo "-- Frontend --"
cd frontend
npm install
cd ..

echo ""
echo "Setup complete. To run:"
echo "  Terminal 1: cd backend && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000"
echo "  Terminal 2: cd frontend && npm run dev"
echo "Then open http://localhost:3000"
