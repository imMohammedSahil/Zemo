# react-rainy-glass 🌧️🪟

> Aesthetic, physics-based procedural rain on glass canvas component for React.

[![npm version](https://img.shields.io/npm/v/react-rainy-glass.svg?style=flat-square)](https://www.npmjs.com/package/react-rainy-glass)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

---

## Features

* **Physics-Driven Raindrops**: Simulates gravity, surface tension friction, burst sliding, and droplet wobbling.
* **Micro-Droplets & Trails**: Sliding drops leave realistic fading moisture trails behind them.
* **Zero Heavy Shaders / WebGL Overhead**: Uses pure HTML5 Canvas 2D with smooth `requestAnimationFrame` render loops.
* **Responsive**: Automatically resizes with the parent container.

---

## Installation

```bash
npm install react-rainy-glass
```

---

## Quickstart

```jsx
import RainyGlass from "react-rainy-glass";

export default function App() {
  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh", backgroundColor: "#060d09" }}>
      {/* Background rain canvas */}
      <RainyGlass density={1.2} speed={1.0} backdropImage="/rain_bokeh.jpg" />

      {/* Your foreground content */}
      <div style={{ position: "relative", zIndex: 10, padding: 40, color: "white" }}>
        <h1>Cozy Atmospheric UI</h1>
      </div>
    </div>
  );
}
```

---

## Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `density` | `number` | `1.0` | Multiplier for the number of static & sliding droplets. |
| `speed` | `number` | `1.0` | Gravity sliding velocity multiplier. |
| `backdropImage` | `string` | `""` | Optional background image URL. |
| `className` | `string` | `""` | Optional CSS class name for the wrapper. |
| `style` | `object` | `{}` | Optional inline styles for the wrapper. |

---

## License

MIT © [Mohammed Sahil](https://github.com/imMohammedSahil)
Extracted from the procedural canvas engine of [Zemo](https://github.com/imMohammedSahil/Zemo).

