
import { supabaseAdmin } from './lib/supabaseAdmin';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

async function check() {
    console.log("Checking order_items table...");
    const { data, error } = await supabaseAdmin.from('order_items').select('*').limit(1);
    if (error) {
        console.log('Error accessing order_items:', error.message);
        // Try 'order_details' just in case
        const { data: data2, error: error2 } = await supabaseAdmin.from('order_details').select('*').limit(1);
        if (error2) {
            console.log('Error accessing order_details:', error2.message);
        } else {
            console.log('Found order_details table');
        }
    } else {
        console.log('Found order_items table');
    }
}

check();
