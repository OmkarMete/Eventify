// ==============================================
// database/seed.js
// Purpose: Populate the database with sample
//          venues and caterers for all cities
//          and event types.
// Run with: npm run seed
// Safe to run multiple times — duplicate
// records are checked before inserting.
// ==============================================

const db = require("../config/db");

// ==============================================
// SEED DATA — 50 VENUES
// 5 Cities × 5 Event Types × 2 per combination
// Cities:     Ahmedabad, Surat, Vadodara, Rajkot, Anand
// Event Types: Wedding, Birthday, Corporate, Engagement, Anniversary
// ==============================================

const venues = [

    // ------------------------------------------
    // AHMEDABAD
    // ------------------------------------------

    // Wedding
    { venue_name: "Royal Palace Banquet",       city: "Ahmedabad", event_type: "Wedding",     capacity: 500, cost: 150000 },
    { venue_name: "Golden Gate Lawns",           city: "Ahmedabad", event_type: "Wedding",     capacity: 800, cost: 200000 },

    // Birthday
    { venue_name: "Celebration Hub",             city: "Ahmedabad", event_type: "Birthday",    capacity: 150, cost: 40000  },
    { venue_name: "Party Paradise Hall",         city: "Ahmedabad", event_type: "Birthday",    capacity: 200, cost: 55000  },

    // Corporate
    { venue_name: "Prestige Convention Centre",  city: "Ahmedabad", event_type: "Corporate",   capacity: 300, cost: 90000  },
    { venue_name: "Executive Business Hall",     city: "Ahmedabad", event_type: "Corporate",   capacity: 250, cost: 75000  },

    // Engagement
    { venue_name: "Roseview Banquet",            city: "Ahmedabad", event_type: "Engagement",  capacity: 200, cost: 60000  },
    { venue_name: "Pearl Garden Events",         city: "Ahmedabad", event_type: "Engagement",  capacity: 180, cost: 50000  },

    // Anniversary
    { venue_name: "Eternal Moments Hall",        city: "Ahmedabad", event_type: "Anniversary", capacity: 150, cost: 45000  },
    { venue_name: "Silver Bells Banquet",        city: "Ahmedabad", event_type: "Anniversary", capacity: 120, cost: 35000  },

    // ------------------------------------------
    // SURAT
    // ------------------------------------------

    // Wedding
    { venue_name: "Diamond City Banquet",        city: "Surat",     event_type: "Wedding",     capacity: 600, cost: 180000 },
    { venue_name: "Surat Grand Lawns",           city: "Surat",     event_type: "Wedding",     capacity: 700, cost: 210000 },

    // Birthday
    { venue_name: "Fun Fiesta Hall",             city: "Surat",     event_type: "Birthday",    capacity: 100, cost: 30000  },
    { venue_name: "Joyful Events Centre",        city: "Surat",     event_type: "Birthday",    capacity: 180, cost: 48000  },

    // Corporate
    { venue_name: "Surat Business Pavilion",     city: "Surat",     event_type: "Corporate",   capacity: 250, cost: 80000  },
    { venue_name: "Trade Centre Hall",           city: "Surat",     event_type: "Corporate",   capacity: 300, cost: 95000  },

    // Engagement
    { venue_name: "Lotus Garden Banquet",        city: "Surat",     event_type: "Engagement",  capacity: 200, cost: 58000  },
    { venue_name: "Celebration Pointe",          city: "Surat",     event_type: "Engagement",  capacity: 150, cost: 45000  },

    // Anniversary
    { venue_name: "Memories Banquet Hall",       city: "Surat",     event_type: "Anniversary", capacity: 130, cost: 38000  },
    { venue_name: "Golden Years Events",         city: "Surat",     event_type: "Anniversary", capacity: 160, cost: 50000  },

    // ------------------------------------------
    // VADODARA
    // ------------------------------------------

    // Wedding
    { venue_name: "Baroda Palace Banquet",       city: "Vadodara",  event_type: "Wedding",     capacity: 500, cost: 140000 },
    { venue_name: "Heritage Wedding Lawns",      city: "Vadodara",  event_type: "Wedding",     capacity: 650, cost: 175000 },

    // Birthday
    { venue_name: "Baroda Celebrations Hall",    city: "Vadodara",  event_type: "Birthday",    capacity: 120, cost: 32000  },
    { venue_name: "Happy Days Event Space",      city: "Vadodara",  event_type: "Birthday",    capacity: 200, cost: 52000  },

    // Corporate
    { venue_name: "Vadodara Conference Hub",     city: "Vadodara",  event_type: "Corporate",   capacity: 280, cost: 85000  },
    { venue_name: "Synergy Business Centre",     city: "Vadodara",  event_type: "Corporate",   capacity: 200, cost: 65000  },

    // Engagement
    { venue_name: "Harmony Garden Hall",         city: "Vadodara",  event_type: "Engagement",  capacity: 180, cost: 55000  },
    { venue_name: "Bliss Banquet Vadodara",      city: "Vadodara",  event_type: "Engagement",  capacity: 150, cost: 42000  },

    // Anniversary
    { venue_name: "Timeless Events Baroda",      city: "Vadodara",  event_type: "Anniversary", capacity: 140, cost: 40000  },
    { venue_name: "Cherish Moments Hall",        city: "Vadodara",  event_type: "Anniversary", capacity: 100, cost: 30000  },

    // ------------------------------------------
    // RAJKOT
    // ------------------------------------------

    // Wedding
    { venue_name: "Rajkot Royal Banquet",        city: "Rajkot",    event_type: "Wedding",     capacity: 450, cost: 130000 },
    { venue_name: "Saurashtra Wedding Palace",   city: "Rajkot",    event_type: "Wedding",     capacity: 600, cost: 160000 },

    // Birthday
    { venue_name: "Sparkle Events Rajkot",       city: "Rajkot",    event_type: "Birthday",    capacity: 100, cost: 28000  },
    { venue_name: "Birthday Bash Arena",         city: "Rajkot",    event_type: "Birthday",    capacity: 150, cost: 40000  },

    // Corporate
    { venue_name: "Rajkot Corporate Hall",       city: "Rajkot",    event_type: "Corporate",   capacity: 200, cost: 60000  },
    { venue_name: "Summit Conference Centre",    city: "Rajkot",    event_type: "Corporate",   capacity: 250, cost: 75000  },

    // Engagement
    { venue_name: "Promise Garden Banquet",      city: "Rajkot",    event_type: "Engagement",  capacity: 160, cost: 48000  },
    { venue_name: "Rajkot Celebration Hall",     city: "Rajkot",    event_type: "Engagement",  capacity: 130, cost: 38000  },

    // Anniversary
    { venue_name: "Forever Memories Hall",       city: "Rajkot",    event_type: "Anniversary", capacity: 120, cost: 35000  },
    { venue_name: "Milestone Events Rajkot",     city: "Rajkot",    event_type: "Anniversary", capacity: 100, cost: 28000  },

    // ------------------------------------------
    // ANAND
    // ------------------------------------------

    // Wedding
    { venue_name: "Anand Wedding Palace",        city: "Anand",     event_type: "Wedding",     capacity: 400, cost: 120000 },
    { venue_name: "Shubh Vivah Banquet",         city: "Anand",     event_type: "Wedding",     capacity: 500, cost: 145000 },

    // Birthday
    { venue_name: "Anand Party Hall",            city: "Anand",     event_type: "Birthday",    capacity: 100, cost: 25000  },
    { venue_name: "Cheers Events Anand",         city: "Anand",     event_type: "Birthday",    capacity: 130, cost: 35000  },

    // Corporate
    { venue_name: "Anand Business Hub",          city: "Anand",     event_type: "Corporate",   capacity: 180, cost: 55000  },
    { venue_name: "Professional Events Centre",  city: "Anand",     event_type: "Corporate",   capacity: 220, cost: 68000  },

    // Engagement
    { venue_name: "Anand Garden Banquet",        city: "Anand",     event_type: "Engagement",  capacity: 140, cost: 42000  },
    { venue_name: "Sweet Promise Hall",          city: "Anand",     event_type: "Engagement",  capacity: 120, cost: 35000  },

    // Anniversary
    { venue_name: "Golden Bond Hall Anand",      city: "Anand",     event_type: "Anniversary", capacity: 110, cost: 32000  },
    { venue_name: "Together Forever Banquet",    city: "Anand",     event_type: "Anniversary", capacity:  90, cost: 25000  },
];

// ==============================================
// SEED DATA — 50 CATERERS
// 5 Cities × 5 Cuisine Types × 2 per combination
// Cuisine Types: Gujarati, Punjabi, South Indian, Chinese, Continental
// ==============================================

const caterers = [

    // ------------------------------------------
    // AHMEDABAD
    // ------------------------------------------
    { caterer_name: "Shree Gujarati Rasoi",       city: "Ahmedabad", cuisine_type: "Gujarati",      price_per_person: 450  },
    { caterer_name: "Annapurna Catering Co.",      city: "Ahmedabad", cuisine_type: "Gujarati",      price_per_person: 550  },
    { caterer_name: "Punjabi Tadka Caterers",      city: "Ahmedabad", cuisine_type: "Punjabi",       price_per_person: 600  },
    { caterer_name: "Dhaba Flavours Catering",     city: "Ahmedabad", cuisine_type: "Punjabi",       price_per_person: 700  },
    { caterer_name: "Dakshin Catering Services",   city: "Ahmedabad", cuisine_type: "South Indian",  price_per_person: 500  },
    { caterer_name: "Idli Dosa Catering House",    city: "Ahmedabad", cuisine_type: "South Indian",  price_per_person: 420  },
    { caterer_name: "Dragon Wok Caterers",         city: "Ahmedabad", cuisine_type: "Chinese",       price_per_person: 650  },
    { caterer_name: "Oriental Feast Catering",     city: "Ahmedabad", cuisine_type: "Chinese",       price_per_person: 750  },
    { caterer_name: "Bella Vita Catering",         city: "Ahmedabad", cuisine_type: "Continental",   price_per_person: 900  },
    { caterer_name: "The Grand Table Caterers",    city: "Ahmedabad", cuisine_type: "Continental",   price_per_person: 1100 },

    // ------------------------------------------
    // SURAT
    // ------------------------------------------
    { caterer_name: "Surat Swad Caterers",         city: "Surat",     cuisine_type: "Gujarati",      price_per_person: 480  },
    { caterer_name: "Ghar Ka Khana Surat",         city: "Surat",     cuisine_type: "Gujarati",      price_per_person: 520  },
    { caterer_name: "Sarson Da Saag Caterers",     city: "Surat",     cuisine_type: "Punjabi",       price_per_person: 620  },
    { caterer_name: "Amritsar Express Catering",   city: "Surat",     cuisine_type: "Punjabi",       price_per_person: 680  },
    { caterer_name: "Madras Kitchen Catering",     city: "Surat",     cuisine_type: "South Indian",  price_per_person: 460  },
    { caterer_name: "Chettinad Feast Caterers",    city: "Surat",     cuisine_type: "South Indian",  price_per_person: 510  },
    { caterer_name: "Chopsticks Catering Surat",   city: "Surat",     cuisine_type: "Chinese",       price_per_person: 670  },
    { caterer_name: "Jade Garden Caterers",        city: "Surat",     cuisine_type: "Chinese",       price_per_person: 720  },
    { caterer_name: "Le Petit Chef Catering",      city: "Surat",     cuisine_type: "Continental",   price_per_person: 950  },
    { caterer_name: "Riviera Banquet Catering",    city: "Surat",     cuisine_type: "Continental",   price_per_person: 1050 },

    // ------------------------------------------
    // VADODARA
    // ------------------------------------------
    { caterer_name: "Baroda Bhoj Caterers",        city: "Vadodara",  cuisine_type: "Gujarati",      price_per_person: 460  },
    { caterer_name: "Ruchira Catering Vadodara",   city: "Vadodara",  cuisine_type: "Gujarati",      price_per_person: 530  },
    { caterer_name: "Pind Balluchi Caterers",      city: "Vadodara",  cuisine_type: "Punjabi",       price_per_person: 590  },
    { caterer_name: "Golden Temple Catering",      city: "Vadodara",  cuisine_type: "Punjabi",       price_per_person: 660  },
    { caterer_name: "South Spice Catering Co.",    city: "Vadodara",  cuisine_type: "South Indian",  price_per_person: 490  },
    { caterer_name: "Udupi Caterers Vadodara",     city: "Vadodara",  cuisine_type: "South Indian",  price_per_person: 440  },
    { caterer_name: "Wok & Roll Caterers",         city: "Vadodara",  cuisine_type: "Chinese",       price_per_person: 630  },
    { caterer_name: "Bamboo Garden Catering",      city: "Vadodara",  cuisine_type: "Chinese",       price_per_person: 700  },
    { caterer_name: "The Continental Kitchen",     city: "Vadodara",  cuisine_type: "Continental",   price_per_person: 880  },
    { caterer_name: "Epicure Fine Catering",       city: "Vadodara",  cuisine_type: "Continental",   price_per_person: 1000 },

    // ------------------------------------------
    // RAJKOT
    // ------------------------------------------
    { caterer_name: "Rajkot Rasoi Caterers",       city: "Rajkot",    cuisine_type: "Gujarati",      price_per_person: 430  },
    { caterer_name: "Saurashtra Swad Catering",    city: "Rajkot",    cuisine_type: "Gujarati",      price_per_person: 500  },
    { caterer_name: "Chandigarh Caterers Rajkot",  city: "Rajkot",    cuisine_type: "Punjabi",       price_per_person: 570  },
    { caterer_name: "Butter Chicken Catering Co.", city: "Rajkot",    cuisine_type: "Punjabi",       price_per_person: 640  },
    { caterer_name: "Coconut Grove Caterers",      city: "Rajkot",    cuisine_type: "South Indian",  price_per_person: 470  },
    { caterer_name: "Sambar Rice Catering",        city: "Rajkot",    cuisine_type: "South Indian",  price_per_person: 420  },
    { caterer_name: "Great Wall Caterers Rajkot",  city: "Rajkot",    cuisine_type: "Chinese",       price_per_person: 610  },
    { caterer_name: "Noodle House Catering",       city: "Rajkot",    cuisine_type: "Chinese",       price_per_person: 680  },
    { caterer_name: "Bistro Catering Rajkot",      city: "Rajkot",    cuisine_type: "Continental",   price_per_person: 850  },
    { caterer_name: "Euro Kitchen Caterers",       city: "Rajkot",    cuisine_type: "Continental",   price_per_person: 980  },

    // ------------------------------------------
    // ANAND
    // ------------------------------------------
    { caterer_name: "Anand Farsan Caterers",       city: "Anand",     cuisine_type: "Gujarati",      price_per_person: 400  },
    { caterer_name: "Vallabh Caterers Anand",      city: "Anand",     cuisine_type: "Gujarati",      price_per_person: 470  },
    { caterer_name: "Dhaba Days Catering Anand",   city: "Anand",     cuisine_type: "Punjabi",       price_per_person: 550  },
    { caterer_name: "Tandoor Express Caterers",    city: "Anand",     cuisine_type: "Punjabi",       price_per_person: 620  },
    { caterer_name: "Kerala Kitchen Anand",        city: "Anand",     cuisine_type: "South Indian",  price_per_person: 430  },
    { caterer_name: "Dosa Point Catering",         city: "Anand",     cuisine_type: "South Indian",  price_per_person: 400  },
    { caterer_name: "Sichuan Bites Catering",      city: "Anand",     cuisine_type: "Chinese",       price_per_person: 590  },
    { caterer_name: "Lotus Wok Caterers",          city: "Anand",     cuisine_type: "Chinese",       price_per_person: 650  },
    { caterer_name: "Cafe Continental Anand",      city: "Anand",     cuisine_type: "Continental",   price_per_person: 820  },
    { caterer_name: "The Fine Spread Catering",    city: "Anand",     cuisine_type: "Continental",   price_per_person: 950  },
];

// ==============================================
// SEED FUNCTION
// Inserts venues and caterers only if they do
// not already exist (checked by venue_name /
// caterer_name + city combination).
// ==============================================

function seedDatabase() {
    console.log("🌱 Starting database seed...\n");

    // ------------------------------------------
    // Prepare parameterized insert statements
    // Parameterized queries prevent SQL injection
    // ------------------------------------------

    const insertVenue = db.prepare(`
        INSERT INTO venues (venue_name, city, event_type, capacity, cost)
        VALUES (@venue_name, @city, @event_type, @capacity, @cost)
    `);

    const insertCaterer = db.prepare(`
        INSERT INTO caterers (caterer_name, city, cuisine_type, price_per_person)
        VALUES (@caterer_name, @city, @cuisine_type, @price_per_person)
    `);

    // Queries to check if a record already exists
    const findVenue = db.prepare(`
        SELECT id FROM venues WHERE venue_name = @venue_name AND city = @city
    `);

    const findCaterer = db.prepare(`
        SELECT id FROM caterers WHERE caterer_name = @caterer_name AND city = @city
    `);

    // ------------------------------------------
    // Seed Venues
    // ------------------------------------------

    let venuesInserted = 0;
    let venuesSkipped  = 0;

    console.log("📍 Seeding venues...");

    for (const venue of venues) {
        try {
            // Check if venue already exists
            const existing = findVenue.get({
                venue_name: venue.venue_name,
                city:       venue.city
            });

            if (existing) {
                // Skip if already in database
                venuesSkipped++;
            } else {
                // Insert new venue record
                insertVenue.run(venue);
                venuesInserted++;
            }
        } catch (error) {
            console.error(`❌ Error seeding venue "${venue.venue_name}":`, error.message);
        }
    }

    console.log(`   ✅ Inserted : ${venuesInserted} venues`);
    console.log(`   ⏭️  Skipped  : ${venuesSkipped} venues (already exist)\n`);

    // ------------------------------------------
    // Seed Caterers
    // ------------------------------------------

    let caterersInserted = 0;
    let caterersSkipped  = 0;

    console.log("🍽️  Seeding caterers...");

    for (const caterer of caterers) {
        try {
            // Check if caterer already exists
            const existing = findCaterer.get({
                caterer_name: caterer.caterer_name,
                city:         caterer.city
            });

            if (existing) {
                // Skip if already in database
                caterersSkipped++;
            } else {
                // Insert new caterer record
                insertCaterer.run(caterer);
                caterersInserted++;
            }
        } catch (error) {
            console.error(`❌ Error seeding caterer "${caterer.caterer_name}":`, error.message);
        }
    }

    console.log(`   ✅ Inserted : ${caterersInserted} caterers`);
    console.log(`   ⏭️  Skipped  : ${caterersSkipped} caterers (already exist)\n`);

    // ------------------------------------------
    // Summary
    // ------------------------------------------

    console.log("✅ Database seeding complete!");
    console.log(`   Total venues   in DB: ${db.prepare("SELECT COUNT(*) as count FROM venues").get().count}`);
    console.log(`   Total caterers in DB: ${db.prepare("SELECT COUNT(*) as count FROM caterers").get().count}`);
}

// ==============================================
// RUN SEED
// ==============================================

try {
    seedDatabase();
} catch (error) {
    console.error("❌ Seed process failed:", error.message);
    process.exit(1);
}
