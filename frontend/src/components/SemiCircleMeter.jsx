import { PieChart, Pie, Cell } from "recharts";

const COLORS = ["#22c55e", "#4ade80", "#16a34a", "#15803d"];

export default function SemiCircleMeter({ data, title, score, onSelect }) {

  return (
    <div style={{ textAlign: "center", position: "relative", width: "320px" }}>

      <h3>{title}</h3>

      <PieChart width={300} height={180}>

        <Pie
          data={data}
          dataKey="percentage"
          nameKey="aspect"
          cx="50%"
          cy="100%"
          startAngle={180}
          endAngle={0}
          innerRadius={60}
          outerRadius={100}
          paddingAngle={3}
          onClick={(entry) => onSelect(entry)}
        >

          {data.map((entry, index) => (
            <Cell
              key={index}
              fill={COLORS[index % COLORS.length]}
            />
          ))}

        </Pie>

      </PieChart>

      {/* CENTER SCORE */}

      <div style={{
        position: "absolute",
        left: "50%",
        top: "65%",
        transform: "translate(-50%, -50%)",
        textAlign: "center"
      }}>

        <div style={{
          fontSize: "32px",
          fontWeight: "bold"
        }}>
          {score}%
        </div>

        <div style={{
          fontSize: "12px",
          color: "#777"
        }}>
          review score
        </div>

      </div>

      {/* LEGEND */}

      <div style={{
        marginTop: "10px",
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "12px"
      }}>

        {data.map((item, index) => (

          <div
            key={index}
            onClick={() => onSelect(item)}
            style={{
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "14px"
            }}
          >

            <span style={{
              width: "10px",
              height: "10px",
              backgroundColor: COLORS[index % COLORS.length],
              borderRadius: "50%"
            }}></span>

            {item.aspect} {item.percentage}%

          </div>

        ))}

      </div>

    </div>
  );
}