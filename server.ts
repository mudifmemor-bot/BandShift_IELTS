import { GoogleGenAI } from '@google/genai';
import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

let aiClient: GoogleGenAI | null = null;
function getAI() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error('GEMINI_API_KEY is missing');
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

// In-memory mock database
const db = {
  users: [] as any[],
  essays: [] as any[],
  evaluations: [] as any[],
};

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Omnichannel Onboarding
app.post('/api/onboarding', (req, res) => {
  const { currentBand, targetScore, targetCountry, testDate } = req.body;
  const user = {
    id: Date.now().toString(),
    currentBand,
    targetScore,
    targetCountry,
    testDate,
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  res.json({ user });
});

app.get('/api/dashboard/:userId', (req, res) => {
  const user = db.users.find((u) => u.id === req.params.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  // Calculate micro-habits based on days left
  const daysLeft = Math.max(0, Math.ceil((new Date(user.testDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  res.json({ user, daysLeft, habits: ['Read 1 complex article', 'Write 1 task 2 intro', 'Review vocabulary flashcards'] });
});

// The Paper-to-Digital Bridge (OCR)
app.post('/api/ocr', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
    const ai = getAI();
    
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-pro',
      contents: [
        {
          role: 'user',
          parts: [
            { text: 'Extract the handwritten text from this image precisely. Only output the text, maintaining paragraph breaks where present. Do not add any extra commentary.' },
            {
              inlineData: {
                data: req.file.buffer.toString('base64'),
                mimeType: req.file.mimetype,
              }
            }
          ]
        }
      ]
    });
    
    res.json({ text: response.text });
  } catch (error: any) {
    console.error('OCR Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// The Hybrid-Trust Assessment Engine
app.post('/api/evaluate', async (req, res) => {
  const { essay, topic } = req.body;
  if (!essay) return res.status(400).json({ error: 'Essay text is required' });

  try {
    const ai = getAI();
    
    // Define the evaluation rubrics prompt
    const systemInstruction = `You are a strict, professional IELTS Writing Task 2 examiner.
Evaluate the essay strictly according to the 4 IELTS criteria:
1. Task Achievement (TA)
2. Coherence & Cohesion (CC)
3. Lexical Resource (LR)
4. Grammatical Range and Accuracy (GRA)

Provide specific score estimates (0-9) for each criterion and calculate the overall band score (average of the 4, rounded to nearest half band).
Return a JSON object containing:
{
  "criteriaScores": {
    "TaskAchievement": number,
    "CoherenceAndCohesion": number,
    "LexicalResource": number,
    "GrammaticalRange": number
  },
  "overallBand": number,
  "feedback": [
    {
      "criterion": string,
      "comment": string,
      "exactSubstring": string,
      "suggestion": string
    }
  ],
  "generalComment": string
}
The exactSubstring must MUST EXACTLY match a portion of the user's essay text.
Provide at least 3 pieces of actionable feedback mapping to substrings.
Only output the raw JSON object, without markdown formatting like \`\`\`json.`;

    // To simulate different ensemble models, we will run multiple promises with slight temperature variance or model changes.
    // Given MVP limits, we will run them sequentially or Promise.all.
    const prompts = [
      { model: 'gemini-1.5-pro', temperature: 0.2 }, // Strict examiner
      { model: 'gemini-1.5-flash', temperature: 0.4 }, // Focused on structure
      { model: 'gemini-1.5-pro', temperature: 0.6 }  // Nuanced vocabulary focus
    ];

    const generateEvaluation = async (config: any) => {
      const response = await ai.models.generateContent({
        model: config.model,
        contents: `Topic: ${topic || 'General'}\n\nEssay:\n${essay}`,
        config: {
          temperature: config.temperature,
          systemInstruction,
          responseMimeType: 'application/json',
        }
      });
      return JSON.parse(response.text || '{}');
    };

    const results = await Promise.all(prompts.map(p => generateEvaluation(p)));
    
    // Aggregator function
    let totalScore = 0;
    let TA = 0, CC = 0, LR = 0, GRA = 0;
    const allFeedback: any[] = [];
    
    results.forEach((r, idx) => {
      totalScore += r.overallBand || 0;
      TA += r.criteriaScores?.TaskAchievement || 0;
      CC += r.criteriaScores?.CoherenceAndCohesion || 0;
      LR += r.criteriaScores?.LexicalResource || 0;
      GRA += r.criteriaScores?.GrammaticalRange || 0;
      if (r.feedback) {
        allFeedback.push(...r.feedback.map((f: any) => ({ ...f, _reviewerId: idx + 1 })));
      }
    });

    const averageScore = Math.round((totalScore / 3) * 2) / 2; // Round to nearest 0.5
    
    const aggregatedResult = {
      overallBand: averageScore,
      criteriaScores: {
        TaskAchievement: +(TA / 3).toFixed(1),
        CoherenceAndCohesion: +(CC / 3).toFixed(1),
        LexicalResource: +(LR / 3).toFixed(1),
        GrammaticalRange: +(GRA / 3).toFixed(1),
      },
      feedback: allFeedback.slice(0, 8), // Top 8 feedback items
      ensembleResults: results.map(r => r.overallBand),
    };

    // Save evaluating to mock DB
    const evaluationRecord = { id: Date.now().toString(), essay, ...aggregatedResult, createdAt: new Date().toISOString() };
    db.evaluations.push(evaluationRecord);

    res.json(aggregatedResult);
  } catch (error: any) {
    console.error('Evaluate Error:', error);
    res.status(500).json({ error: error.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
