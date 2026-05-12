require("dotenv").config();

const mongoose = require("mongoose");
const importHistory = require("../services/importBuyhatkeHistory");

async function run() {

    await mongoose.connect(process.env.MONGO_URI);

    console.log("Connected");

    await importHistory("69aac545156297223fcf2be5");

    console.log("Import complete");

    process.exit();

}

run();
