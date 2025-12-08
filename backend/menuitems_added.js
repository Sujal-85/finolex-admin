// seedMenu.js
// Usage:
//   1. npm install mongoose
//   2. set MONGODB_URI (e.g. export MONGODB_URI="mongodb://localhost:27017/yourdb")
//   3. node seedMenu.js

const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI || 'mongodb+srv://finolex:finolex_canteen@mess.dqhbzlz.mongodb.net/finolex_canteen?appName=Mess';

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  allergens: [String],
  isSpecial: { type: Boolean, default: false },
  price: { type: Number, required: true },
  category: { type: String, default: 'General' },
  day: { type: String, required: true }, // e.g., Monday
  mealType: { type: String, required: true, enum: ['breakfast', 'lunch', 'dinner'] },
  createdAt: { type: Date, default: Date.now }
});

const MenuItem = mongoose.model('MenuItem', menuItemSchema);

// --- The menu data extracted from your table image ---
// Each object: name, description, price (0 if unknown), day, mealType
const menuData = [
  // Monday
  { name: 'Vada Pav', description: 'Chutney, Mirchi, Tea', price: 20, category: 'Snacks', day: 'Monday', mealType: 'breakfast' },
  { name: 'Masala Pulav with Dal & Chapati', description: 'Masoor, Chapati, Pickle, Papad, Dahi, Lal Chutney', price: 60, day: 'Monday', mealType: 'lunch' },
  { name: 'Pavta & Chapati Meal', description: 'Pavta, Chapati, Dal Rice, Salad, Pickle, Papad, Lal Chutney', price: 70, day: 'Monday', mealType: 'dinner' },

  // Tuesday
  { name: 'Poha (Girls) / Upama (Boys)', description: 'Shev, Lemon, Tea', price: 20, day: 'Tuesday', mealType: 'breakfast' },
  { name: 'White Vatana Thali', description: 'Chapati, Dal, Rice, Dahi, Papad, Pickle, Lal Chutney', price: 60, day: 'Tuesday', mealType: 'lunch' },
  { name: 'Veg Kurma & Puri', description: 'Amrakhand / Shrikhand, Puri, Moong/Masoor Amti, Rice, Salad, Papad, Pickle', price: 75, day: 'Tuesday', mealType: 'dinner' },

  // Wednesday
  { name: 'Misal Pav', description: 'Onion, Lemon, Tea', price: 30, day: 'Wednesday', mealType: 'breakfast' },
  { name: 'Fried Rice Thali', description: 'Fried Rice, Channa, Chapati, Dal, Rice, Dahi, Papad, Pickle, Thecha', price: 65, day: 'Wednesday', mealType: 'lunch' },
  { name: 'Egg Biryani / White Pulav', description: 'Paneer Chilly / Egg Gravy / Chapati, Rice, Koshimbir, Papad, Pickle', price: 80, day: 'Wednesday', mealType: 'dinner' },

  // Thursday
  { name: 'Idli with Sambar & Chutney', description: 'Idli, Sambar, Chutney, Coffee', price: 25, day: 'Thursday', mealType: 'breakfast' },
  { name: 'Matki (Dry) Thali', description: 'Matki, Chapati, Dal, Rice, Dahi, Papad, Pickle, Lal Chutney', price: 60, day: 'Thursday', mealType: 'lunch' },
  { name: 'Chole & Puri', description: 'Chole, Puri, Dal Tadaka, Jeera Rice, Salad, Gulab Jamun (2), Papad, Pickle, Lal Chutney', price: 75, day: 'Thursday', mealType: 'dinner' },

  // Friday
  { name: 'Kata Vada Pav', description: 'Onion, Lemon, Tea', price: 22, day: 'Friday', mealType: 'breakfast' },
  { name: 'Kala Vatana Thali', description: 'Kala Vatana, Chapati, Dal, Rice, Tak, Papad, Pickle, Lal Chutney', price: 62, day: 'Friday', mealType: 'lunch' },
  { name: 'Batata (Dry yellow) with Chapati', description: 'Batata Fry, Chinch-Gul Amati, Salad, Papad, Pickle, Lal Chutney', price: 70, day: 'Friday', mealType: 'dinner' },

  // Saturday
  { name: 'Medu Wada / Idli', description: 'Sambar, Chutney, Coffee', price: 30, day: 'Saturday', mealType: 'breakfast' },
  { name: 'Veg Pulav & Matar (Frozen)', description: 'Chapati, Tak, Papad, Pickle, Lal Chutney', price: 65, day: 'Saturday', mealType: 'lunch' },
  { name: 'Moong / Dry Simla Bhata', description: 'Chapati, Dal Rice, Banana (2 Nos), Papad, Pickle, Lal Chutney', price: 70, day: 'Saturday', mealType: 'dinner' },

  // Sunday
  { name: 'Dosa (Bhaji Yellow)', description: 'Sambar, Chutney, Coffee', price: 30, day: 'Sunday', mealType: 'breakfast' },
  { name: 'Chicken / Paneer Thali', description: 'Onion, Lemon, Paneer, Chapati, Dal, Rice, Kadi, Papad, Pickle, Gulab Jamun (2)', price: 90, day: 'Sunday', mealType: 'lunch' },
  { name: 'Flower Batata (Chapati) Dinner', description: 'Flower Batata, Chapati, Dal Rice, Kanda Bhaji (05), Papad, Pickle, Lal Chutney', price: 80, day: 'Sunday', mealType: 'dinner' }
];

async function seed() {
  console.log('Connecting to MongoDB:', uri);
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    // Optional: clear existing week entries (uncomment if you want reset)
    // await MenuItem.deleteMany({ day: { $in: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"] } });

    // Insert or upsert each menu row for idempotency
    const ops = menuData.map(item => ({
      updateOne: {
        filter: { name: item.name, day: item.day, mealType: item.mealType },
        update: { $set: item },
        upsert: true
      }
    }));

    const res = await MenuItem.bulkWrite(ops);
    console.log('BulkWrite result:', res);
    console.log('Seeding complete. Inserted/updated menu items for the week.');
  } catch (err) {
    console.error('Error during seed:', err);
  } finally {
    await mongoose.disconnect();
  }
}

seed().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
