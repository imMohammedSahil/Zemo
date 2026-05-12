const axios = require("axios");

const HF_API_URL =
"https://router.huggingface.co/v1/chat/completions";

const HF_TOKEN = process.env.HF_API_KEY;

const MODEL = "meta-llama/Meta-Llama-3-8B-Instruct";

async function analyzeReviews(reviewSample) {

    const { positive, negative } = reviewSample;

    const prompt = `
You are an AI product review analyst.

Analyze the following customer reviews.

Identify the most praised product aspects and the most complained aspects.

Return exactly 4 aspects for each.

Each aspect must include:
- aspect name
- percentage importance
- short explanation (1 sentence)

Return ONLY JSON in this format:

{
 "pros":[
   {"aspect":"Camera","percentage":40,"explanation":"Users praise the camera quality and zoom capabilities."},
   {"aspect":"Display","percentage":25,"explanation":"The display is frequently described as vibrant and sharp."},
   {"aspect":"Performance","percentage":20,"explanation":"Many users mention smooth performance and fast app loading."},
   {"aspect":"Build Quality","percentage":15,"explanation":"The phone feels premium and well-built according to reviewers."}
 ],
 "cons":[
   {"aspect":"Battery","percentage":50,"explanation":"Several users complain that the battery drains quickly."},
   {"aspect":"Heating","percentage":25,"explanation":"Some users report the phone heating during heavy usage."},
   {"aspect":"Price","percentage":15,"explanation":"A number of reviews mention the phone being expensive."},
   {"aspect":"Camera","percentage":10,"explanation":"A few users mention issues with camera performance in low light."}
 ]
}

Positive Reviews:
${positive.join("\n")}

Negative Reviews:
${negative.join("\n")}
`;

    try {

        const response = await axios.post(
            HF_API_URL,
            {
                model: MODEL,
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 400
            },
            {
                headers: {
                    Authorization: `Bearer ${HF_TOKEN}`,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log("AI RAW RESPONSE:", response.data);

        const output = response.data.choices[0].message.content;

        const jsonMatch = output.match(/\{[\s\S]*\}/);

        let parsed = { pros: [], cons: [] };

        if (jsonMatch) {
            parsed = JSON.parse(jsonMatch[0]);
        }

        return parsed;

    } catch (error) {

        console.error(
            "AI analysis failed:",
            error.response?.data || error.message
        );

        return {
            pros: [],
            cons: []
        };

    }
}

module.exports = {
    analyzeReviews
};