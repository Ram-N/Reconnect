import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Load balancing: rotate through multiple API keys
let currentGroqKeyIndex = 0
let currentNimKeyIndex = 0

function getNextGroqKey(): string {
    // Load all keys from environment
    const keys = [
        Deno.env.get('GROQ_API_KEY1'),
        Deno.env.get('GROQ_API_KEY2'),
        Deno.env.get('GROQ_API_KEY3'),
    ].filter(Boolean) // Remove null/undefined

    // Fallback to single key for backwards compatibility
    if (keys.length === 0) {
        const singleKey = Deno.env.get('GROQ_API_KEY')
        if (!singleKey) {
            throw new Error('No GROQ_API_KEY configured')
        }
        return singleKey
    }

    // Round-robin rotation
    const key = keys[currentGroqKeyIndex % keys.length]
    currentGroqKeyIndex = (currentGroqKeyIndex + 1) % keys.length

    console.log(`Using Groq key ${(currentGroqKeyIndex === 0 ? keys.length : currentGroqKeyIndex)} of ${keys.length}`)

    return key!
}

function getNextNimKey(): string {
    const keys = [
        Deno.env.get('NIM_API_KEY1'),
        Deno.env.get('NIM_API_KEY2'),
    ].filter(Boolean)

    if (keys.length === 0) {
        const singleKey = Deno.env.get('NIM_API_KEY')
        if (!singleKey) {
            throw new Error('No NIM_API_KEY configured')
        }
        return singleKey
    }

    const key = keys[currentNimKeyIndex % keys.length]
    currentNimKeyIndex = (currentNimKeyIndex + 1) % keys.length

    console.log(`Using NIM key ${(currentNimKeyIndex === 0 ? keys.length : currentNimKeyIndex)} of ${keys.length}`)

    return key!
}

async function callOpenAICompatibleLLM(
    systemPrompt: string,
    userPrompt: string,
    baseUrl: string,
    model: string,
    apiKey: string
): Promise<object> {
    const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.1,
        }),
    })

    if (!response.ok) {
        const err = await response.text()
        throw new Error(`LLM call failed (${response.status}): ${err}`)
    }

    const result = await response.json()
    return JSON.parse(result.choices[0].message.content)
}

async function extractStructuredData(systemPrompt: string, userPrompt: string): Promise<object> {
    // Primary: NVIDIA NIM
    try {
        console.log('Attempting LLM extraction via NIM...')
        const nimKey = getNextNimKey()
        return await callOpenAICompatibleLLM(
            systemPrompt, userPrompt,
            'https://integrate.api.nvidia.com/v1',
            'meta/llama-3.3-70b-instruct',
            nimKey
        )
    } catch (nimError) {
        console.warn('NIM failed, falling back to Groq LLM:', nimError.message)
    }

    // Secondary: Groq LLM
    const groqKey = getNextGroqKey()
    return await callOpenAICompatibleLLM(
        systemPrompt, userPrompt,
        'https://api.groq.com/openai/v1',
        'llama-3.3-70b-versatile',
        groqKey
    )
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const formData = await req.formData()
        const audioFile = formData.get('audio') as File

        if (!audioFile) {
            throw new Error('No audio file uploaded')
        }

        // 1. STT: Call Groq Whisper API with load-balanced key
        const groqKey = getNextGroqKey()

        const whisperFormData = new FormData()
        whisperFormData.append('file', audioFile)
        whisperFormData.append('model', 'whisper-large-v3')

        const sttResponse = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${groqKey}`,
            },
            body: whisperFormData,
        })

        if (!sttResponse.ok) {
            const err = await sttResponse.text()
            console.error('STT Error:', err)
            throw new Error(`STT failed: ${err}`)
        }

        const sttResult = await sttResponse.json()
        const transcript = sttResult.text

        // 2. LLM: Extract structured data
        const systemPrompt = `You extract structured facts from personal call transcripts.
Return STRICT JSON matching the provided schema. No extra keys, no commentary.
If a field is unknown, use null. Dates ISO-8601 when possible.
For hashtags: extract any words spoken with "hashtag" prefix (e.g. "hashtag books" -> "books"),
or words that sound like category tags (e.g. "things to read" -> ["reading"]). Return as lowercase strings without # symbol.`

        const schema = {
            "people_mentioned": [{ "name": "string", "relation": "string|null", "org_school": "string|null", "location": "string|null" }],
            "key_topics": ["string"],
            "hashtags": ["string"],
            "facts": [{ "type": "string", "who": "string|null", "org": "string|null", "role": "string|null", "when": "string|null", "to": "string|null", "from": "string|null" }],
            "followups": [{ "what": "string", "due": "string|null" }],
            "checkin_hint_days": "number|null"
        }

        const userPrompt = `Schema:
${JSON.stringify(schema, null, 2)}

Transcript:
${transcript}`

        const extracted = await extractStructuredData(systemPrompt, userPrompt)

        return new Response(JSON.stringify({ transcript, extracted }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
