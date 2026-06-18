const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local
const env = {};
const lines = fs.readFileSync('.env.local', 'utf8').split('\n');
lines.forEach(l => {
  const m = l.match(/^([^#\s=]+)\s*=\s*(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
});

const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// Read user stay listings
const stayListings = JSON.parse(fs.readFileSync('src/data/jsons/__stayListing.json', 'utf8'));

async function seed() {
  console.log('Clearing existing hotels in database...');
  // Delete existing records to avoid duplicates
  const { error: deleteError } = await client
    .from('hotels')
    .delete()
    .neq('name', 'Some Nonexistent Name'); // deletes all

  if (deleteError) {
    console.error('Error clearing hotels:', deleteError);
    return;
  }

  console.log('Seeding stay listings to Supabase hotels table...');
  const hotelsToInsert = stayListings.map(stay => {
    // Parse price like "$26" to 26
    const priceNum = Number(stay.price.replace('$', '').trim());
    return {
      name: stay.title.trim(),
      address: stay.address,
      price_per_night: isNaN(priceNum) ? 100 : priceNum,
      image_url: stay.featuredImage,
      rating: stay.reviewStart || 5.0,
      remaining_quantity: stay.bedrooms || 5
    };
  });

  const { data, error } = await client
    .from('hotels')
    .insert(hotelsToInsert)
    .select();

  if (error) {
    if (error.message.includes('remaining_quantity')) {
      console.error('\n[LỖI]: Thiếu cột remaining_quantity trong bảng hotels.');
      console.error('Vui lòng chạy câu lệnh sau trong Supabase SQL Editor của bạn, sau đó chạy lại script này:');
      console.error('\n   ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS remaining_quantity INT DEFAULT 5;\n');
    } else {
      console.error('Error seeding hotels:', error);
    }
  } else {
    console.log(`Successfully seeded ${data.length} hotels into Supabase!`);
  }
}

seed();
