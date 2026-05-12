export default function InsightExplanation({ insight }) {

  if (!insight) return null;

  return (
    <div style={{
      border: "1px solid #ddd",
      padding: "15px",
      marginTop: "20px",
      borderRadius: "8px"
    }}>

      <h4>{insight.aspect}</h4>

      <p>{insight.explanation}</p>

    </div>
  );
}