# react-ai-progress-loader ⏳✨

> Engaging multi-stage progressive loader component for React AI applications. Cycles through status updates, animated progress, and elapsed time during slow LLM inference.

[![npm version](https://img.shields.io/npm/v/react-ai-progress-loader.svg?style=flat-square)](https://www.npmjs.com/package/react-ai-progress-loader)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

---

## Why?

LLM API calls (Gemini, ChatGPT, Claude) frequently take **5 to 15 seconds**. Standard spinning wheels make users believe the app crashed or froze.

`react-ai-progress-loader` provides a calming, cinematic multi-step loading experience with:
* Real-time elapsed seconds counter.
* Dynamic stage-by-stage messages that progress automatically.
* Asymptotic progress bar (smoothly crawls up to 92% and never fake-completes early).

---

## Installation

```bash
npm install react-ai-progress-loader
```

---

## Quickstart

```jsx
import AiProgressLoader from "react-ai-progress-loader";

export default function AnalysisView({ loading }) {
  if (loading) {
    return (
      <AiProgressLoader
        title="Distilling Customer Sentiment..."
        subtitle="Mining 500+ reviews across verified store purchases"
        estimatedSeconds={10}
        accentColor="#CEFF00"
        stages={[
          "Filtering verified buyer feedback...",
          "Analyzing sentiment polarity on battery & performance...",
          "Synthesizing pros, cons, and recommendations...",
          "Formatting cognitive decision matrix..."
        ]}
      />
    );
  }

  return <div>Your analysis content here</div>;
}
```

---

## License

MIT © [Mohammed Sahil](https://github.com/imMohammedSahil)
Extracted from the AI progress design system of [Zemo](https://github.com/imMohammedSahil/Zemo).

