# Reconnect Backend

This is the Python backend for Reconnect, designed to handle audio processing and LLM extraction.

## Setup

1.  **Install Python 3.10+**
2.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```
3.  **Run Server**:
    ```bash
    uvicorn main:app --reload
    ```

The API will be available at `http://localhost:8000`.

## Endpoints

-   `GET /`: Health check.
-   `POST /process`: Upload audio file, returns transcript and extracted JSON.
