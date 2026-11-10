const React = require("react");
const { useState, useEffect } = React;

/**
 * AiProgressLoader - Keeps users engaged during long LLM inferences (5-20s)
 *
 * @param {Object} props
 * @param {string} [props.title="Synthesizing Intelligence..."]
 * @param {string} [props.subtitle="Processing complex cognitive extraction"]
 * @param {Array<string>} [props.stages] - Progressive status messages
 * @param {number} [props.estimatedSeconds=12] - Estimated total wait time
 * @param {string} [props.accentColor="#CEFF00"] - Primary theme accent color
 * @param {string} [props.className] - CSS class
 */
function AiProgressLoader({
  title = "Synthesizing Intelligence...",
  subtitle = "Distilling unstructured data with neural models",
  stages = [
    "Connecting to neural model gateway...",
    "Extracting key entities and dimensions...",
    "Validating patterns across knowledge corpus...",
    "Formatting structured response..."
  ],
  estimatedSeconds = 12,
  accentColor = "#CEFF00",
  className = ""
}) {
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [progressPercent, setProgressPercent] = useState(5);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    // 1. Elapsed timer
    const timerInterval = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);

    // 2. Progressive percentage crawl (never hits 100% until finished)
    const progressInterval = setInterval(() => {
      setProgressPercent((p) => {
        if (p < 92) {
          const increment = Math.max(0.5, (95 - p) / (estimatedSeconds * 3));
          return Math.min(92, p + increment);
        }
        return p;
      });
    }, 200);

    // 3. Stage cycle
    const stageDurationMs = (estimatedSeconds * 1000) / Math.max(1, stages.length);
    const stageInterval = setInterval(() => {
      setCurrentStageIdx((idx) => (idx < stages.length - 1 ? idx + 1 : idx));
    }, stageDurationMs);

    return () => {
      clearInterval(timerInterval);
      clearInterval(progressInterval);
      clearInterval(stageInterval);
    };
  }, [estimatedSeconds, stages.length]);

  return React.createElement(
    "div",
    {
      className,
      style: {
        padding: "24px",
        borderRadius: "16px",
        backgroundColor: "#08150D",
        border: "1px solid rgba(24, 76, 46, 0.7)",
        color: "#ffffff",
        fontFamily: "system-ui, -apple-system, sans-serif",
        maxWidth: "520px",
        width: "100%",
        boxSizing: "border-box"
      }
    },
    // Header
    React.createElement(
      "div",
      { style: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" } },
      React.createElement("h4", { style: { margin: 0, fontSize: "15px", fontWeight: "700" } }, title),
      React.createElement(
        "span",
        { style: { fontSize: "11px", color: "#A6A095", fontFamily: "monospace" } },
        `${elapsedSeconds}s elapsed`
      )
    ),
    // Subtitle
    React.createElement("p", { style: { margin: "0 0 16px 0", fontSize: "12px", color: "#A6A095" } }, subtitle),
    // Progress Bar Track
    React.createElement(
      "div",
      {
        style: {
          width: "100%",
          height: "6px",
          backgroundColor: "#0C2417",
          borderRadius: "999px",
          overflow: "hidden",
          marginBottom: "12px"
        }
      },
      React.createElement("div", {
        style: {
          height: "100%",
          width: `${Math.round(progressPercent)}%`,
          backgroundColor: accentColor,
          borderRadius: "999px",
          transition: "width 0.2s ease"
        }
      })
    ),
    // Current Active Stage Message
    React.createElement(
      "div",
      { style: { display: "flex", alignItems: "center", gap: "8px" } },
      React.createElement("span", {
        style: {
          display: "inline-block",
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          backgroundColor: accentColor,
          boxShadow: `0 0 8px ${accentColor}`
        }
      }),
      React.createElement(
        "span",
        { style: { fontSize: "12px", color: "#EAE5D9", fontFamily: "monospace" } },
        stages[currentStageIdx] || "Processing..."
      )
    )
  );
}

module.exports = AiProgressLoader;
module.exports.default = AiProgressLoader;
