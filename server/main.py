import os
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

app = FastAPI(title="Reconnect API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ExtractedData(BaseModel):
    people_mentioned: List[dict]
    key_topics: List[str]
    facts: List[dict]
    followups: List[dict]
    checkin_hint_days: Optional[int] = None

@app.get("/")
async def root():
    return {"message": "Reconnect API is running"}

@app.post("/process")
async def process_audio(file: UploadFile = File(...)):
    """
    Receives an audio file, performs STT (Whisper), and extracts insights (LLM).
    """
    try:
        # 1. Save temporary file
        temp_filename = f"temp_{file.filename}"
        with open(temp_filename, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
            
        # 2. TODO: Call Whisper (Local or Cloud)
        # transcript = run_whisper(temp_filename)
        transcript = "This is a placeholder transcript from the Python backend. Real Whisper integration would go here."
        
        # 3. TODO: Call LLM (Ollama or OpenAI)
        # extracted = run_llm_extraction(transcript)
        extracted = {
            "people_mentioned": [{"name": "Backend Bob", "relation": "Server Admin"}],
            "key_topics": ["API", "Python", "FastAPI"],
            "facts": [{"type": "status", "who": "API", "role": "Online"}],
            "followups": [{"what": "Implement actual Whisper calls", "due": "Soon"}],
            "checkin_hint_days": 7
        }

        # Cleanup
        if os.path.exists(temp_filename):
            os.remove(temp_filename)

        return {
            "transcript": transcript,
            "extracted": extracted
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
