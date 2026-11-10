# aspect-sentiment-miner 🧠📊

> Aspect-based sentiment analysis engine for e-commerce, app store, and SaaS customer reviews using Google Gemini with automatic heuristic fallback.

[![npm version](https://img.shields.io/npm/v/aspect-sentiment-miner.svg?style=flat-square)](https://www.npmjs.com/package/aspect-sentiment-miner)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

---

## Why Aspect-Based Sentiment?

Traditional sentiment analysis gives a simplistic `0.8 positive` score. In the real world, customers love the **Display (95% positive)** but dislike the **Battery Life (40% negative)**.

`aspect-sentiment-miner` extracts fine-grained aspect breakdowns, positive/negative pros & cons, and an executive purchasing verdict from customer reviews.

---

## Installation

```bash
npm install aspect-sentiment-miner
```

---

## Quickstart

```javascript
const AspectSentimentMiner = require("aspect-sentiment-miner");

const miner = new AspectSentimentMiner({
  apiKey: process.env.GEMINI_API_KEY // Optional: falls back to built-in heuristic engine if missing
});

async function analyzeProduct() {
  const result = await miner.analyze({
    productName: "Sony WH-1000XM5 Wireless Headphones",
    reviews: [
      "Sound quality is unmatched and the noise cancellation blocks everything on flights.",
      "Ear cups feel very comfortable for long sessions, but the folding case is bulkier than XM4.",
      "Battery easily lasts 30 hours. Microphone quality in windy areas could be better."
    ]
  });

  console.log(result.pros);
  // [
  //   { aspect: "Active Noise Cancellation", percentage: 96, sentiment: "positive", detail: "Blocks ambient noise effectively" },
  //   { aspect: "Sound Quality & Bass", percentage: 94, sentiment: "positive", detail: "Unmatched audio fidelity" },
  //   { aspect: "Battery Life", percentage: 92, sentiment: "positive", detail: "30-hour playback duration" }
  // ]

  console.log(result.cons);
  // [
  //   { aspect: "Case Portability", percentage: 35, sentiment: "negative", detail: "Bulkier case design" }
  // ]

  console.log(result.verdict);
}

analyzeProduct();
```

---

## Features

* **LLM Aspect Distillation**: Categorizes unstructured paragraphs into clean aspects (Performance, Display, Battery, Value).
* **Built-in Fallback**: If Gemini hits rate limits or network errors, it seamlessly switches to an offline heuristic engine so your production backend never crashes.
* **Deterministic JSON**: Returns clean structured objects ready for React/Vue dashboards.

---

## License

MIT © [Mohammed Sahil](https://github.com/imMohammedSahil)
Extracted from the cognitive review intelligence engine of [Zemo](https://github.com/imMohammedSahil/Zemo).
