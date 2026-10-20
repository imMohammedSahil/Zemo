const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/zemo');

  const liveOffers = [
    {
      title: 'Bank Offer: Upto ₹1,500.00 discount on SBI Credit Cards, SBI Debit Cards',
      description: 'Upto ₹1,500.00 discount on SBI Credit Cards, SBI Debit Cards',
      type: 'bank_discount',
      bank: 'SBI Card',
      discountAmount: 1500
    },
    {
      title: 'Cashback: Upto ₹2,039.00 cashback as Amazon Pay Balance with Amazon Pay ICICI Card',
      description: 'Upto ₹2,039.00 cashback as Amazon Pay Balance when you pay with Amazon Pay ICICI Bank Credit Cards',
      type: 'cashback',
      bank: 'Amazon Pay ICICI',
      discountAmount: 2039
    },
    {
      title: 'No Cost EMI: Upto ₹1,772.49 EMI interest savings on Amazon Pay ICICI Bank Credit Cards',
      description: 'Upto ₹1,772.49 EMI interest savings on Amazon Pay ICICI Bank Credit Cards',
      type: 'emi',
      bank: 'Amazon Pay ICICI',
      discountAmount: 1772
    },
    {
      title: 'Partner Offers: Get GST invoice and save up to 18% on business purchases',
      description: 'Get GST invoice and save up to 18% on business purchases. Sign up for free',
      type: 'coupon',
      bank: 'GST Invoice',
      discountAmount: 0
    }
  ];

  const updateResult = await mongoose.connection.collection('products').updateOne(
    { asin: 'B0GR64G4H6' },
    { $set: { bankOffers: liveOffers, coupon: null } }
  );
  console.log('MongoDB product updated:', updateResult.modifiedCount);

  // Clear local offers cache file so it regenerates cleanly
  const cachePath = path.join(__dirname, '../../.zemo_cache/gemini_offers_cache.json');
  if (fs.existsSync(cachePath)) {
    const data = JSON.parse(fs.readFileSync(cachePath, 'utf8') || '{}');
    delete data['B0GR64G4H6'];
    fs.writeFileSync(cachePath, JSON.stringify(data, null, 2), 'utf8');
    console.log('Cleared cache for B0GR64G4H6');
  }

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
