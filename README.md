# Reconnect - Personal CRM

A privacy-minded personal CRM to help you stay in touch with friends and family.

## 🚀 Getting Started

### 1. Prerequisites

- Node.js installed
- A Supabase account

### 2. Installation

Navigate to the `web` directory and install dependencies:

```bash
cd web
npm install
```

### 3. Supabase Setup

1.  Create a new project on [Supabase](https://supabase.com).
2.  Go to the **SQL Editor** and run the contents of `supabase/schema.sql`.
3.  Get your **Project URL** and **Anon Key** from **Project Settings > API**.
4.  Create a `.env` file in the `web` directory:

    ```env
    VITE_SUPABASE_URL=your_project_url
    VITE_SUPABASE_ANON_KEY=your_anon_key
    ```

### 4. Run Locally

Start the development server:

```bash
npm run dev
```

## 📱 Features

-   **Capture**: Record voice notes of your interactions.
-   **Process**: (Simulated) AI extracts people, topics, and follow-ups.
-   **Review**: Verify and edit the extracted information.
-   **Contacts**: Manage your personal network.
-   **Up Next**: Smart scheduling for who to contact next.

## 🛠️ Tech Stack

-   **Frontend**: Vite, React, TypeScript, Tailwind CSS
-   **Icons**: Lucide React
-   **Database**: Supabase (Postgres)
-   **AI**: (Mocked for MVP) OpenAI Whisper & LLM
