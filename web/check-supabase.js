#!/usr/bin/env node
/**
 * Quick Supabase health check
 * Usage: node check-supabase.js
 * Or: npm run check:supabase
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read env vars
const envContent = readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
    }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function quickHealthCheck() {
    const startTime = Date.now();

    try {
        // Simple ping to check if project is active
        const { error } = await supabase
            .from('contacts')
            .select('count')
            .limit(0);

        const duration = Date.now() - startTime;

        if (error) {
            const errorMsg = error.message || '';

            if (errorMsg.includes('fetch') || errorMsg.includes('ENOTFOUND')) {
                console.log('💤 Supabase project is PAUSED or UNREACHABLE');
                console.log('   → Go to https://supabase.com/dashboard and resume your project');
                process.exit(1);
            } else if (errorMsg.includes('521') || errorMsg.includes('Web server is down')) {
                console.log('⏳ Supabase project is WAKING UP...');
                console.log('   → Wait 30-60 seconds and try again');
                console.log('   → Or check https://supabase.com/dashboard');
                process.exit(1);
            } else if (errorMsg.includes('<!DOCTYPE html>') || errorMsg.includes('Cloudflare')) {
                console.log('⏳ Supabase project is STARTING...');
                console.log('   → This usually takes 30-60 seconds after resuming');
                console.log('   → Try running this command again in a moment');
                process.exit(1);
            } else {
                console.log(`⚠️  Error: ${errorMsg.substring(0, 100)}...`);
                process.exit(1);
            }
        }

        console.log(`✅ Supabase is ACTIVE and responding (${duration}ms)`);
        console.log(`   Project: ${supabaseUrl}`);
        process.exit(0);

    } catch (err) {
        console.log('❌ Connection failed:', err.message);
        console.log('   → Check if your project is paused at https://supabase.com/dashboard');
        process.exit(1);
    }
}

quickHealthCheck();
