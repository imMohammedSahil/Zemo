#!/usr/bin/env node
const { condenseTitle } = require("../index");

const input = process.argv.slice(2).join(" ");
if (!input) {
  console.log('Usage: npx condense-title "<messy product title>"');
  process.exit(0);
}

console.log(condenseTitle(input));

