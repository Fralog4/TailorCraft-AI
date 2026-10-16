import uvicorn

if __name__ == "__main__":
    print("Starting FastAPI server on http://localhost:8000 (0.0.0.0:8000) ...", flush=True)
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False, log_level="info")
