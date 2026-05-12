const mongoose = require("mongoose");
require("dotenv").config();

const importHistoricPrices = require("../services/importPriceHistory");

async function run() {

  await mongoose.connect(process.env.MONGO_URI);

  const productId = "69aac545156297223fcf2be5"; // your product id
  const asin = "B09G9BL5CP";

  await importHistoricPrices(productId, asin);

  console.log("Historic import complete");

  process.exit();

}

run();
