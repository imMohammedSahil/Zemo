import { useState } from "react";
import SemiCircleMeter from "./SemiCircleMeter";
import InsightExplanation from "./InsightExplanation";

export default function InsightsDashboard({ insights }) {

  const [selected, setSelected] = useState(null);

  // Calculate overall review score
  const calculateScore = (pros, cons) => {

    const prosTotal = pros.reduce((sum, p) => sum + p.percentage, 0);
    const consTotal = cons.reduce((sum, c) => sum + c.percentage, 0);

    const score = Math.round((prosTotal / (prosTotal + consTotal)) * 100);

    return score;
  };

  const score = calculateScore(insights.pros, insights.cons);

  return (

    <div>

      <h2>AI Review Insights</h2>

      <div style={{
        display: "flex",
        justifyContent: "center",
        gap: "40px"
      }}>

        <SemiCircleMeter
          title="Pros"
          data={insights.pros}
          score={score}
          onSelect={setSelected}
        />

        <SemiCircleMeter
          title="Cons"
          data={insights.cons}
          score={score}
          onSelect={setSelected}
        />

      </div>

      <InsightExplanation insight={selected} />

    </div>
  );
}