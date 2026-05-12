import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import API from "../services/api";
import PriceHistoryChart from "../components/PriceHistoryChart";

export default function PriceHistoryPage() {

  const { id: productId } = useParams();

  const [data, setData] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [historicLow, setHistoricLow] = useState(null);

  useEffect(() => {
    if (productId) {
      loadPriceHistory();
    }
  }, [productId]);

  async function loadPriceHistory() {

    try {

      const res = await API.get(`/price-history/${productId}`);

      console.log("Price history response:", res.data);

      setData(res.data.history || []);
      setCurrentPrice(res.data.currentPrice || null);
      setHistoricLow(res.data.historicLow || null);

    } catch (error) {

      console.error("Failed to load price history", error);

    }

  }

  return (

    <div className="max-w-4xl mx-auto p-6">

      <h2 className="text-xl font-bold mb-6">Price History</h2>

      <div className="flex gap-6 mb-6">

        <div className="bg-gray-900 p-4 rounded">
          <p className="text-gray-400 text-sm">Current Price</p>
          <p className="text-lg font-semibold">₹{currentPrice ?? "--"}</p>
        </div>

        <div className="bg-gray-900 p-4 rounded">
          <p className="text-gray-400 text-sm">Historic Low</p>
          <p className="text-lg font-semibold">₹{historicLow ?? "--"}</p>
        </div>

      </div>

      <div className="bg-gray-900 p-4 rounded">

        {data.length === 0 ? (
          <p className="text-gray-400">No price history yet...</p>
        ) : (
          <PriceHistoryChart data={data} />
        )}

      </div>

    </div>

  );

}