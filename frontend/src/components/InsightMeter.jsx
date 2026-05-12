import { useState } from "react";

export default function InsightMeter({ title, segments }) {

  const [selected, setSelected] = useState(null);

  const total = segments.reduce((sum, s) => sum + (s.value || 0), 0);

  let startAngle = 0;

  return (
    <div style={{ textAlign: "center" }}>

      <h3>{title}</h3>

      <svg width="300" height="160">

        {segments.map((seg, i) => {

          const value = seg.value || 0;

          const angle = (value / total) * 180;

          const x1 = 150 + 120 * Math.cos((Math.PI * startAngle) / 180);
          const y1 = 150 - 120 * Math.sin((Math.PI * startAngle) / 180);

          const endAngle = startAngle + angle;

          const x2 = 150 + 120 * Math.cos((Math.PI * endAngle) / 180);
          const y2 = 150 - 120 * Math.sin((Math.PI * endAngle) / 180);

          const largeArc = angle > 180 ? 1 : 0;

          const path = `
            M ${x1} ${y1}
            A 120 120 0 ${largeArc} 0 ${x2} ${y2}
          `;

          startAngle = endAngle;

          return (
            <path
              key={i}
              d={path}
              stroke={seg.color}
              strokeWidth="35"
              fill="none"
              style={{ cursor: "pointer" }}
              onClick={() => setSelected(seg)}
            />
          );

        })}

      </svg>

      {/* Legend */}

      <div style={{ marginTop: "10px" }}>
        {segments.map((seg, i) => (
          <div key={i} style={{ fontSize: "14px" }}>
            <span
              style={{
                display: "inline-block",
                width: "12px",
                height: "12px",
                background: seg.color,
                marginRight: "6px"
              }}
            ></span>
            {seg.label}
          </div>
        ))}
      </div>

      {/* Popup */}

      {selected && (
        <div style={{
  position: "fixed",
  top: "40%",
  left: "50%",
  transform: "translate(-50%,-50%)",
  background: "#ffffff",
  color: "#000000",
  padding: "20px",
  borderRadius: "10px",
  boxShadow: "0 0 20px rgba(0,0,0,0.3)",
  maxWidth: "350px"
}}>
          <h4 style={{color:"#000"}}>{selected.label}</h4>
<p style={{color:"#000"}}>{selected.description}</p>

          <button onClick={() => setSelected(null)}>
            Close
          </button>
        </div>
      )}

    </div>
  );
}