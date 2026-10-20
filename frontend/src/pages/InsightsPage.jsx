import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import InsightMeter from "../components/InsightMeter";
import ProductNavTabs from "../components/ProductNavTabs";

export default function InsightsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInsights() {
      try {
        setLoading(true);
        const res = await API.get(`/product/insights/${id}`);
        setInsights(res.data);
      } catch (error) {
        console.error("Failed to load insights", error);
      } finally {
        setLoading(false);
      }
    }

    loadInsights();
  }, [id]);

  const colorPalette = ["#39FF14", "#CEFF00", "#00E599", "#A855F7", "#3B82F6", "#F59E0B"];

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl mx-auto">
      
      {/* Breadcrumbs & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <ProductNavTabs productId={id} activeTab="reviews" />
      </div>

      {/* Banner */}
      <div className="bg-zemo-card border border-zemo-border p-6 rounded-3xl relative overflow-hidden">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-mono uppercase tracking-widest text-[#CEFF00] font-bold">
            Meta-Llama-3-8B Aspect Intelligence
          </span>
        </div>
        
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Aspect-Based Sentiment Distillation
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Serverless LLM review distillation categorizing customer opinions across positive/negative aspect vectors.
        </p>
      </div>

      {loading ? (
        <div className="py-24 text-center flex flex-col items-center justify-center gap-3 bg-zemo-card border border-zemo-border rounded-3xl">
          <div className="w-10 h-10 border-3 border-[#39FF14] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-mono text-zinc-300">Synthesizing review sentiment with Meta-Llama-3...</span>
        </div>
      ) : !insights ? (
        <div className="bg-zemo-card border border-zemo-border rounded-3xl p-12 text-center">
          <p className="text-zinc-500 font-mono text-sm">No aspect sentiment distilled yet for this product.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start justify-items-center">
          
          <InsightMeter
            title="Positive Vectors (Pros)"
            segments={(insights.pros || []).map((p, i) => ({
              label: p.aspect,
              value: Number(p.percentage),
              color: colorPalette[i % colorPalette.length],
              description: p.explanation
            }))}
          />

          <InsightMeter
            title="Critical Vectors (Cons)"
            segments={(insights.cons || []).map((c, i) => ({
              label: c.aspect,
              value: Number(c.percentage),
              color: ["#F43F5E", "#FB923C", "#E11D48", "#A855F7"][i % 4],
              description: c.explanation
            }))}
          />

        </div>
      )}

    </div>
  );
}