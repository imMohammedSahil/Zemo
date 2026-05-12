
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

export default function PriceHistoryChart({ data = [] }) {

  const safeData = Array.isArray(data) ? data : [];

  const validData = safeData.filter(p => p.price && p.price > 0);

  /* GUARD — prevents crash when no price history exists */

  if (!validData.length) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        No price history available yet.
      </div>
    );
  }

  const formattedData = validData.map((item) => ({
    price: item.price,
    date: new Date(item.recordedAt)
  }));


  const generateTimeline = (history) => {

    if (!history || history.length === 0) return [];

    const result = [];
    let currentPrice = history[0].price;

    let startDate = new Date(history[0].date);

    let today = new Date();
    let minDays = 7;

    const diffDays = Math.floor(
      (today - startDate) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < minDays) {
      today = new Date(startDate);
      today.setDate(today.getDate() + minDays);
    }

    let historyIndex = 0;

    for (
      let d = new Date(startDate);
      d <= today;
      d.setDate(d.getDate() + 1)
    ) {

      const historyDate = new Date(history[historyIndex]?.date);

      if (
        historyIndex < history.length &&
        historyDate.toDateString() === d.toDateString()
      ) {
        currentPrice = history[historyIndex].price;
        historyIndex++;
      }

      result.push({
        date: d.toLocaleDateString(),
        price: currentPrice
      });

    }

    return result;
  };

  const chartData = generateTimeline(formattedData);

  return (

    <div style={{ width: "100%", height: 350 }}>

      <ResponsiveContainer width="100%" height={350}>

        <AreaChart data={chartData}>

          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
            </linearGradient>
          </defs>

          <XAxis
            dataKey="date"
            interval="preserveStartEnd"
            tick={{ fontSize: 12 }}
          />

          <YAxis tickCount={4} />

          <Tooltip />

          <Area
            type="monotone"
            dataKey="price"
            stroke="#ef4444"
            fill="url(#priceGradient)"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />

        </AreaChart>

      </ResponsiveContainer>

    </div>

  );

}