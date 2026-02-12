// Simple Supabase connection test
import { createClient } from '@supabase/supabase-js';

// Read from .env file manually
const fs = await import('fs');
const envContent = fs.readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
    }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase Connection...\n');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'MISSING');
console.log('');

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables!');
    console.log('Expected: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    try {
        console.log('1️⃣  Testing basic connection...');
        const { data: healthCheck, error: healthError } = await supabase
            .from('contacts')
            .select('count')
            .limit(0);

        if (healthError) {
            console.error('❌ Connection failed:', healthError.message);
            console.error('   Full error:', healthError);
            if (healthError.message.includes('Failed to fetch') || healthError.message.includes('fetch')) {
                console.log('\n💡 This usually means:');
                console.log('   - Your Supabase project is PAUSED (visit https://supabase.com/dashboard)');
                console.log('   - Click "Restore" or "Resume" on your project');
                console.log('   - Or there\'s a network issue');
            }
            process.exit(1);
        }

        console.log('✅ Connected to Supabase!\n');

        // Test auth
        console.log('2️⃣  Testing authentication status...');
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError) {
            console.log('⚠️  Auth check error:', authError.message);
        } else if (user) {
            console.log(`✅ Logged in as: ${user.email}`);
        } else {
            console.log('ℹ️  Not logged in (this is expected when running from CLI)');
        }
        console.log('');

        // Test tables
        console.log('3️⃣  Checking database tables...');
        const tables = ['contacts', 'interactions', 'people', 'followups'];

        for (const table of tables) {
            try {
                const { count, error } = await supabase
                    .from(table)
                    .select('*', { count: 'exact', head: true });

                if (error) {
                    console.log(`❌ Table "${table}": ${error.message}`);
                } else {
                    console.log(`✅ Table "${table}": ${count ?? 0} rows`);
                }
            } catch (err) {
                console.log(`❌ Table "${table}": ${err.message}`);
            }
        }

        console.log('\n✨ Connection test complete!');
        console.log('\nNext steps:');
        console.log('  1. If project is paused, go to https://supabase.com/dashboard');
        console.log('  2. Find your project and click "Restore/Resume"');
        console.log('  3. Wait a minute for it to wake up');
        console.log('  4. Try the app again');

    } catch (error) {
        console.error('❌ Unexpected error:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    }
}

testConnection();
