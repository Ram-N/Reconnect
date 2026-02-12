// Simple Supabase connection test
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env from web directory
dotenv.config({ path: join(__dirname, 'web', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase Connection...\n');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'MISSING');
console.log('');

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables!');
    console.log('Expected: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in web/.env');
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
            if (healthError.message.includes('Failed to fetch')) {
                console.log('\n💡 This usually means:');
                console.log('   - Your Supabase project is paused (visit https://supabase.com/dashboard)');
                console.log('   - Or there\'s a network issue');
            }
            process.exit(1);
        }

        console.log('✅ Connected to Supabase!\n');

        // Test auth
        console.log('2️⃣  Testing authentication status...');
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError) {
            console.log('⚠️  No active session (this is normal if not logged in)');
        } else if (user) {
            console.log(`✅ Logged in as: ${user.email}`);
        } else {
            console.log('ℹ️  Not logged in (this is expected)');
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
                    console.log(`✅ Table "${table}": ${count} rows`);
                }
            } catch (err) {
                console.log(`❌ Table "${table}": ${err.message}`);
            }
        }

        console.log('\n✨ Connection test complete!');

    } catch (error) {
        console.error('❌ Unexpected error:', error.message);
        process.exit(1);
    }
}

testConnection();
