require("dotenv").config();

const mongoose = require("mongoose");
const extractHistory = require("./services/buyhatkeExtractor");

async function run() {

    await mongoose.connect(process.env.MONGO_URI);

    console.log("Connected");

    await extractHistory(
    "69aac545156297223fcf2be5",
    "https://buyhatke.com/samsung-galaxy-s26-price-in-india-4544-37056"
);

    console.log("Import finished");

    process.exit();

}

run();