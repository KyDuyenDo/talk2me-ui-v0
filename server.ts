import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const dirName = typeof __dirname !== 'undefined' ? __dirname : process.cwd();

const app = express();
app.use(express.json({ limit: '10mb' }));

// Lazy init Gemini AI
function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set. Please configure it in AI Studio Secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Helper to extract Youtube ID
function extractYoutubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : null;
}

// API: Generate course from YouTube URL
app.post('/api/generate-course', async (req: Request, res: Response) => {
  try {
    const { youtubeUrl, category, difficulty } = req.body;
    if (!youtubeUrl) {
      return res.status(400).json({ error: 'YouTube URL is required' });
    }

    const videoId = extractYoutubeId(youtubeUrl);
    if (!videoId) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    const ai = getAiClient();
    
    // Request Gemini to generate structured course content
    const prompt = `You are an expert language & skills educator for young adults.
Generate a structured online course based on the video URL / ID: ${videoId} (URL: ${youtubeUrl}).
Category preference: ${category || 'Web Development'}
Target difficulty level: ${difficulty || 'Intermediate'}

Return a complete JSON course object with 3 distinct lessons.
Each lesson MUST include:
- Title and timestamp bounds (e.g., "0:00" to "5:30", startSeconds: 0, endSeconds: 330)
- Theory Markdown lesson with key takeaways
- 3 interactive quiz questions with 4 options, correct answer index, and a clear explanation
- 2 Dictation segments (short sentences for listening and typing with target text and translation)
- 2 Shadowing lines (sentences for repetition and speaking drill)
- A Writing prompt for structured reflection
- A Speaking prompt for verbal practice
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            category: { type: Type.STRING },
            difficulty: { type: Type.STRING },
            channelName: { type: Type.STRING },
            durationText: { type: Type.STRING },
            lessons: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  videoStartTime: { type: Type.STRING },
                  videoEndTime: { type: Type.STRING },
                  startSeconds: { type: Type.INTEGER },
                  endSeconds: { type: Type.INTEGER },
                  theoryContent: { type: Type.STRING },
                  keyTakeaways: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  quizQuestions: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        question: { type: Type.STRING },
                        options: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                        },
                        correctAnswer: { type: Type.INTEGER },
                        explanation: { type: Type.STRING },
                      },
                      required: ['question', 'options', 'correctAnswer', 'explanation'],
                    },
                  },
                  dictationSegments: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        startTime: { type: Type.NUMBER },
                        endTime: { type: Type.NUMBER },
                        targetText: { type: Type.STRING },
                        translationText: { type: Type.STRING },
                        hintKeyWords: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                        },
                      },
                      required: ['targetText', 'startTime', 'endTime'],
                    },
                  },
                  shadowingLines: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        startTime: { type: Type.NUMBER },
                        endTime: { type: Type.NUMBER },
                        sampleText: { type: Type.STRING },
                        phoneticText: { type: Type.STRING },
                      },
                      required: ['sampleText'],
                    },
                  },
                  writingPrompt: {
                    type: Type.OBJECT,
                    properties: {
                      promptText: { type: Type.STRING },
                      suggestedWordCount: { type: Type.INTEGER },
                      sampleAnswer: { type: Type.STRING },
                    },
                    required: ['promptText'],
                  },
                  speakingPrompt: {
                    type: Type.OBJECT,
                    properties: {
                      promptText: { type: Type.STRING },
                      phoneticGuide: { type: Type.STRING },
                    },
                    required: ['promptText'],
                  },
                },
                required: ['title', 'videoStartTime', 'videoEndTime', 'theoryContent', 'quizQuestions'],
              },
            },
          },
          required: ['title', 'description', 'lessons'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    const course = {
      id: `course_${Date.now()}`,
      youtubeUrl,
      youtubeVideoId: videoId,
      title: parsed.title || 'Interactive AI Masterclass',
      description: parsed.description || 'Master key skills through real video lessons, dictation, and interactive quizzes.',
      category: parsed.category || category || 'Education & Tech',
      categoryId: (parsed.category || category || 'tech').toLowerCase().replace(/\s+/g, '-'),
      difficulty: parsed.difficulty || difficulty || 'Intermediate',
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      channelName: parsed.channelName || 'LearnTube Edu',
      durationText: parsed.durationText || '24m 15s',
      totalLessons: parsed.lessons?.length || 3,
      rating: 4.9,
      reviewsCount: Math.floor(Math.random() * 2000) + 500,
      badgeLabel: 'New',
      price: 0,
      isCustomGenerated: true,
      creationStatus: 'completed',
      progressPercent: 0,
      createdAt: new Date().toISOString().split('T')[0],
      lessons: (parsed.lessons || []).map((les: any, idx: number) => ({
        id: `les_${Date.now()}_${idx}`,
        lessonIndex: idx + 1,
        title: les.title || `Lesson ${idx + 1}`,
        durationMinutes: 8,
        videoStartTime: les.videoStartTime || '0:00',
        videoEndTime: les.videoEndTime || '8:00',
        startSeconds: les.startSeconds || idx * 480,
        endSeconds: les.endSeconds || (idx + 1) * 480,
        theoryContent: les.theoryContent || '## Key Concepts\n- Understand core fundamentals.\n- Practice hands-on exercises.',
        keyTakeaways: les.keyTakeaways || ['Active practice boosts retention', 'Watch and speak along'],
        quizQuestions: (les.quizQuestions || []).map((q: any, qIdx: number) => ({
          id: `q_${idx}_${qIdx}`,
          question: q.question,
          options: q.options || ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
          explanation: q.explanation || 'This is the correct answer according to the video tutorial.',
        })),
        dictationSegments: (les.dictationSegments || []).map((d: any, dIdx: number) => ({
          id: `d_${idx}_${dIdx}`,
          segmentIndex: dIdx + 1,
          startTime: d.startTime || 10,
          endTime: d.endTime || 20,
          targetText: d.targetText || 'Learning with video enhances comprehension.',
          translationText: d.translationText || 'Học qua video giúp nâng cao khả năng tiếp thu.',
          hintKeyWords: d.hintKeyWords || ['Learning', 'video', 'comprehension'],
        })),
        shadowingLines: (les.shadowingLines || []).map((s: any, sIdx: number) => ({
          id: `s_${idx}_${sIdx}`,
          segmentIndex: sIdx + 1,
          startTime: s.startTime || 15,
          endTime: s.endTime || 25,
          sampleText: s.sampleText || 'Consistency is the key to mastering any skill.',
          phoneticText: s.phoneticText || '/kənˈsɪstənsi ɪz ðə kiː tuː ˈmɑːstərɪŋ ˈɛni skɪl/',
        })),
        writingPrompt: les.writingPrompt || {
          id: `w_${idx}`,
          promptText: 'Summarize the core takeaways from this lesson in 100-150 words using your own vocabulary.',
          suggestedWordCount: 120,
          sampleAnswer: 'In this lesson, we explored how video-based contextual learning improves active recall...',
        },
        speakingPrompt: les.speakingPrompt || {
          id: `sp_${idx}`,
          promptText: 'Record a 30-second speech explaining the main concept to a classmate.',
          phoneticGuide: 'Maintain clear intonation and moderate pacing.',
        },
        availableModes: ['theory', 'quiz', 'dictation', 'shadowing', 'writing', 'speaking'],
        completedModes: [],
      })),
    };

    res.json({ success: true, course });
  } catch (err: any) {
    console.error('Course generation error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate course' });
  }
});

// API: Evaluate Writing with AI Rubric
app.post('/api/evaluate-writing', async (req: Request, res: Response) => {
  try {
    const { promptText, userSubmission } = req.body;
    if (!userSubmission) {
      return res.status(400).json({ error: 'Submission text is required' });
    }

    const ai = getAiClient();
    const prompt = `You are an expert English language assessor using IELTS/CEFR standards.
Evaluate this student essay/response:
Prompt: "${promptText || 'Summarize key takeaways'}"
User Submission: "${userSubmission}"

Provide detailed evaluation feedback in JSON format with overall score (1 to 9), summary feedback, 4 criteria scores (Task Response, Coherence, Lexical Resource, Grammar), highlighted errors with suggestions, and an improved model answer.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.NUMBER },
            summary: { type: Type.STRING },
            criteria: {
              type: Type.OBJECT,
              properties: {
                taskResponse: {
                  type: Type.OBJECT,
                  properties: {
                    score: { type: Type.NUMBER },
                    feedback: { type: Type.STRING },
                  },
                },
                coherenceCohesion: {
                  type: Type.OBJECT,
                  properties: {
                    score: { type: Type.NUMBER },
                    feedback: { type: Type.STRING },
                  },
                },
                lexicalResource: {
                  type: Type.OBJECT,
                  properties: {
                    score: { type: Type.NUMBER },
                    feedback: { type: Type.STRING },
                  },
                },
                grammaticalAccuracy: {
                  type: Type.OBJECT,
                  properties: {
                    score: { type: Type.NUMBER },
                    feedback: { type: Type.STRING },
                  },
                },
              },
            },
            highlightedErrors: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  originalText: { type: Type.STRING },
                  suggestedText: { type: Type.STRING },
                  errorType: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                },
              },
            },
            improvedModelAnswer: { type: Type.STRING },
          },
          required: ['overallScore', 'summary', 'criteria', 'improvedModelAnswer'],
        },
      },
    });

    const result = JSON.parse(response.text || '{}');
    res.json({ success: true, evaluation: result });
  } catch (err: any) {
    console.error('Writing evaluation error:', err);
    res.status(500).json({ error: err.message || 'Failed to evaluate writing' });
  }
});

// API: Evaluate Speaking with AI
app.post('/api/evaluate-speaking', async (req: Request, res: Response) => {
  try {
    const { promptText, transcriptText } = req.body;
    const ai = getAiClient();
    const prompt = `You are a speech & pronunciation coach.
Evaluate this student spoken speech transcript:
Prompt: "${promptText}"
Transcript: "${transcriptText || 'Sample spoken response'}"

Return JSON evaluation with overall band score, summary, criteria scores (Pronunciation, Fluency, Intonation, GrammarLexicon), mispronounced words list with phonetic guides.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.NUMBER },
            summary: { type: Type.STRING },
            criteria: {
              type: Type.OBJECT,
              properties: {
                pronunciation: {
                  type: Type.OBJECT,
                  properties: {
                    score: { type: Type.NUMBER },
                    feedback: { type: Type.STRING },
                  },
                },
                fluency: {
                  type: Type.OBJECT,
                  properties: {
                    score: { type: Type.NUMBER },
                    feedback: { type: Type.STRING },
                  },
                },
                intonation: {
                  type: Type.OBJECT,
                  properties: {
                    score: { type: Type.NUMBER },
                    feedback: { type: Type.STRING },
                  },
                },
                grammarLexicon: {
                  type: Type.OBJECT,
                  properties: {
                    score: { type: Type.NUMBER },
                    feedback: { type: Type.STRING },
                  },
                },
              },
            },
            mispronouncedWords: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  userPhonetic: { type: Type.STRING },
                  correctPhonetic: { type: Type.STRING },
                  tip: { type: Type.STRING },
                },
              },
            },
          },
          required: ['overallScore', 'summary', 'criteria'],
        },
      },
    });

    const result = JSON.parse(response.text || '{}');
    res.json({ success: true, evaluation: result });
  } catch (err: any) {
    console.error('Speaking evaluation error:', err);
    res.status(500).json({ error: err.message || 'Failed to evaluate speaking' });
  }
});

// Serve frontend build or Vite dev server
const isProd = process.env.NODE_ENV === 'production';
const PORT = 3000;

async function startServer() {
  if (isProd) {
    app.use(express.static(path.join(dirName, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(dirName, 'dist', 'index.html'));
    });
  } else {
    // Vite Dev Server middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Talk2Me LearnTube server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

