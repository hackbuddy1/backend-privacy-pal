// server.js
require('dotenv').config();
const express = require('express');

const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors()); // Allow requests from your extension
app.use(express.json());



// server.js
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ----- NEW MOCK (FAKE) VERSION -----
app.post('/analyze', async (req, res) => {
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
    }

    try {
        // Get the generative model
        
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

        const prompt = `
            You are "Privacy Pal," an expert legal assistant who explains complex terms in simple language for the average user.
            Your response must be only the raw JSON object, without any markdown formatting like \`\`\`json.
            
            The JSON object must have FOUR properties:
            1. "riskScore": An integer from 1 (very safe) to 10 (very risky).
            2. "verdict": A short, one-sentence recommendation for the user. Examples: "Generally Safe.", "Proceed with Caution.", or "High-Risk Policy.".
            3. "categorizedPoints": An array of objects. Each object must have a "category" and a "point".
               - The "category" must be one of these exact strings: "Data Collection", "Data Sharing", "Content Rights", "User Liability", "Policy Changes".
               - The "point" is the single, concise summary of that clause.
            4. "highlights": An array of objects. Each object should have a "text" property (the exact phrase to highlight) and a "risk" property ("high", "medium", or "low").

            Analyze the following text and generate the JSON object based on these rules.
            ---
            ${text.substring(0, 30000)} 
        `; // Note: Gemini has a larger context window, so we can send more text.

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const responseText = response.text();
        
        // Parse the JSON string from the model's response
        const analysis = JSON.parse(responseText);
        res.json(analysis);

    } catch (error) {
        console.error('Error with Gemini API:', error);
        // It's helpful to see what the model actually returned if JSON parsing fails
        if (error instanceof SyntaxError) {
             console.error("Gemini Response Text that failed parsing:", responseText);
        }
        res.status(500).json({ error: 'Failed to analyze text with the new AI model.' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});