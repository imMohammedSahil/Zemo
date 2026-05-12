import { useEffect, useState } from "react";
import InsightMeter from "./InsightMeter";

export default function AIInsights({ productId }) {

  const [insights, setInsights] = useState(null);

  useEffect(() => {

    fetch(`http://localhost:5000/api/product/${productId}/insights`)
      .then(res => res.json())
      .then(data => setInsights(data.insights));

  }, [productId]);

  if (!insights) return <p>Loading AI insights...</p>;

  return (

    <div className="grid grid-cols-2 gap-6">

      <InsightMeter title="Pros" data={insights.pros} />

      <InsightMeter title="Cons" data={insights.cons} />

    </div>

  );

}