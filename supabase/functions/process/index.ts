import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

        // 1. STT: Call Groq Whisper API
        const groqKey = Deno.env.get('GROQ_API_KEY')
        if (!groqKey) {
            throw new Error('GROQ_API_KEY not set')
        }

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

        const llmResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${groqKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                response_format: { type: "json_object" }
            }),
        })

        if (!llmResponse.ok) {
            const err = await llmResponse.text()
            console.error('LLM Error:', err)
            throw new Error(`LLM failed: ${err}`)
        }

        const llmResult = await llmResponse.json()
        const extracted = JSON.parse(llmResult.choices[0].message.content)

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
