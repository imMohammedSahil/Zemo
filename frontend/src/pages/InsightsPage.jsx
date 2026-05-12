import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../services/api";
import InsightMeter from "../components/InsightMeter";

export default function InsightsPage() {

  const { id } = useParams();

  const [insights, setInsights] = useState(null);

  useEffect(() => {

    async function loadInsights() {

      try {

        const res = await API.get(`/product/insights/${id}`);

        setInsights(res.data);

      } catch (error) {

        console.error("Failed to load insights", error);

      }

    }

    loadInsights();

  }, [id]);

  if (!insights) {
    return <div className="p-8">Loading AI insights...</div>;
  }

  return (

    <div className="max-w-5xl mx-auto p-8">

      <h1 className="text-2xl font-bold mb-6">
        AI Product Insights
      </h1>

      <div className="flex justify-center gap-16">

        <InsightMeter
          title="Pros"
          segments={(insights.pros || []).map((p, i) => ({
            label: p.aspect,
            value: Number(p.percentage),
            color: ["#22c55e","#a855f7","#3b82f6","#eab308"][i % 4],
            description: p.explanation
          }))}
        />

        <InsightMeter
          title="Cons"
          segments={(insights.cons || []).map((c, i) => ({
            label: c.aspect,
            value: Number(c.percentage),
            color: ["#22c55e","#a855f7","#3b82f6","#eab308"][i % 4],
            description: c.explanation
          }))}
        />

      </div>

    </div>

  );

}