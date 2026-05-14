Backend: 
    python -m venv .venv
    source .venv/bin/activate
    uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

Frontend:
    cd frontend
    npm run dev
