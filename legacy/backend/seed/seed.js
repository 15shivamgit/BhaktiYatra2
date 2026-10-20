const mongoose = require('mongoose');
require('dotenv').config();
const Temple = require('../models/Temple');
const Package = require('../models/Package');

mongoose.connect(process.env.MONGO_URL).then(async () => {
  console.log('Seeding DB');
  await Temple.deleteMany({});
  await Package.deleteMany({});

  await Temple.create([
    { name: 'Kashi Vishwanath', location: 'Varanasi', description: 'Purana mandir', images: [] },
    { name: 'Jagannath Temple', location: 'Puri', description: 'Famous temple', images: [] }
  ]);

  await Package.create([
    { title: 'North India Pilgrimage', price: 12000, durationDays: 7, itinerary: 'Day1 Delhi ...', inclusions: ['Hotel','Meals'], seatsAvailable: 20 },
    { title: 'Bihari Dev Yatra', price: 8000, durationDays: 4, itinerary: 'Day1 Begusarai ...', inclusions: ['Transport'], seatsAvailable: 15 }
  ]);

  console.log('Done'); process.exit(0);
}).catch(err => console.error(err));
