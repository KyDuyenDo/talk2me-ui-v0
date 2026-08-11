# API Design — Talk2Me LearnTube

> Thiết kế chi tiết cho toàn bộ Serverless API endpoints.

---

## Tổng quan Endpoints

| Method | Path | Mô tả | Auth | LLM Cost |
|--------|------|--------|------|----------|
| POST | `/api/generate-course` | Sinh khóa học từ YouTube URL | Optional | Free (cached) |
| GET | `/api/course/:videoId` | Lấy khóa đã cache | None | $0 |
| POST | `/api/evaluate-writing` | Chấm bài viết | Required | Free model |
| POST | `/api/evaluate-speaking` | Chấm phát âm | Required | $0 (client STT) |
| POST | `/api/extract-vocab` | Rút từ vựng từ bài học | Required | Free model rẻ |
| POST | `/api/cron/process-jobs` | Cron: xử lý job đang pending | System | — |

---

## Authentication

Tất cả endpoints trừ `GET /api/course/:videoId` sử dụng JWT từ Supabase Auth:

```typescript
// Client gửi token trong header
const { data: { session } } = await supabase.auth.getSession();
fetch('/api/generate-course', {
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json'
  }
})

// Server-side verify
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const { data: { user } } = await supabase.auth.getUser(token);
if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
```

---

## POST /api/generate-course

Sinh khóa học từ YouTube URL. Cache-first: kiểm tra DB trước khi gọi LLM.

### Request
```typescript
interface GenerateCourseRequest {
  youtubeUrl: string;    // "https://youtube.com/watch?v=dQw4w9WgXcQ"
  category?: string;     // "Business English" | "Tech" | ...
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
}
```

### Response (Cache HIT — instant)
```json
{
  "success": true,
  "source": "cache",
  "course": {
    "id": "uuid",
    "youtubeVideoId": "dQw4w9WgXcQ",
    "title": "Business Communication Mastery",
    "description": "...",
    "category": "Business English",
    "difficulty": "Intermediate",
    "thumbnailUrl": "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    "channelName": "English Academy",
    "creationStatus": "completed",
    "lessons": [/* ... */]
  }
}
```

### Response (Cache MISS — background job started)
```json
{
  "success": true,
  "source": "generating",
  "courseId": "uuid",
  "jobId": "uuid",
  "message": "Khóa học đang được sinh, bạn có thể theo dõi tiến độ qua Realtime."
}
```

### Response (Error)
```json
{
  "success": false,
  "error": "NO_CAPTIONS",
  "message": "Video này không có phụ đề. Vui lòng thử video khác hoặc thêm phụ đề."
}
```

### Error Codes
| Code | HTTP Status | Mô tả |
|------|-------------|-------|
| `INVALID_URL` | 400 | URL không phải YouTube |
| `NO_CAPTIONS` | 422 | Video không có phụ đề/transcript |
| `QUOTA_EXCEEDED` | 429 | Đã hết quota ngày hôm nay |
| `LLM_ERROR` | 502 | LLM provider lỗi |

---

## GET /api/course/:videoId

Lấy course đã cache theo YouTube video ID. Không cần auth.

### Request
```
GET /api/course/dQw4w9WgXcQ
```

### Response (Found)
```json
{
  "success": true,
  "course": { /* same as above */ }
}
```

### Response (Not Found)
```json
{
  "success": false,
  "error": "NOT_FOUND"
}
```

---

## POST /api/evaluate-writing

Chấm bài viết theo rubric IELTS/CEFR. Dùng model suy luận (DeepSeek R1 free hoặc BYOK).

### Request
```typescript
interface EvaluateWritingRequest {
  promptText: string;     // đề bài
  userSubmission: string; // bài viết của user (min 50 từ)
  lessonId?: string;      // để lưu vào progress
}
```

### Response
```json
{
  "success": true,
  "evaluation": {
    "overallScore": 7.5,
    "summary": "Your essay demonstrates a good understanding of the topic with clear organization. However, some grammatical errors affect the overall coherence.",
    "criteria": {
      "taskResponse": {
        "score": 8.0,
        "feedback": "Excellent address of all parts of the task with a fully developed position."
      },
      "coherenceCohesion": {
        "score": 7.0,
        "feedback": "Good use of cohesive devices, but some paragraphing could be improved."
      },
      "lexicalResource": {
        "score": 7.5,
        "feedback": "Wide range of vocabulary used accurately with only occasional errors."
      },
      "grammaticalAccuracy": {
        "score": 7.5,
        "feedback": "Mix of complex and simple sentences with only minor errors."
      }
    },
    "highlightedErrors": [
      {
        "originalText": "informations",
        "suggestedText": "information",
        "errorType": "grammar",
        "explanation": "'Information' là uncountable noun, không thêm 's'."
      }
    ],
    "improvedModelAnswer": "An effective approach to business email writing involves..."
  }
}
```

---

## POST /api/evaluate-speaking

Chấm phát âm. Dùng Web Speech API ở client để convert audio → text TRƯỚC, rồi gửi text lên đây.

### Request
```typescript
interface EvaluateSpeakingRequest {
  promptText: string;    // đề bài speaking
  transcriptText: string; // kết quả STT từ Web Speech API ở client
  targetText?: string;   // câu mẫu cần shadowing (nếu có)
}
```

### Response
```json
{
  "success": true,
  "evaluation": {
    "overallScore": 6.5,
    "summary": "Good fluency with occasional hesitation. Pronunciation mostly accurate.",
    "criteria": {
      "pronunciation": {
        "score": 6.0,
        "feedback": "Generally clear but some consonant clusters need work."
      },
      "fluency": {
        "score": 7.0,
        "feedback": "Natural pace with minor hesitations."
      },
      "intonation": {
        "score": 6.5,
        "feedback": "Good rising/falling patterns, but questions need more natural intonation."
      },
      "grammarLexicon": {
        "score": 7.0,
        "feedback": "Good range of vocabulary with mostly accurate grammar."
      }
    },
    "mispronouncedWords": [
      {
        "word": "specifically",
        "userPhonetic": "/spɛsɪfɪkli/",
        "correctPhonetic": "/spəˈsɪfɪkli/",
        "tip": "Nhấn trọng âm vào âm tiết thứ 2 (spe-CI-fi-cly)"
      }
    ]
  }
}
```

---

## POST /api/extract-vocab

Rút từ vựng quan trọng từ nội dung bài học. Dùng model rẻ nhất (Qwen/Llama free), batch cả bài.

### Request
```typescript
interface ExtractVocabRequest {
  content: string;   // nội dung bài (theory text hoặc kết quả bài học)
  lessonId: string;
  sourceType: 'theory' | 'result';
  targetCount?: number; // default 10
}
```

### Response
```json
{
  "success": true,
  "vocabulary": [
    {
      "term": "spaced repetition",
      "definition": "A learning technique using increasing review intervals to maximize retention",
      "phonetic": "/speɪst ˌrɛpɪˈtɪʃən/",
      "partOfSpeech": "noun",
      "exampleSentence": "Spaced repetition is the key to long-term vocabulary retention."
    },
    {
      "term": "retrieval practice",
      "definition": "Actively recalling information to strengthen memory",
      "phonetic": "/rɪˈtriːvəl ˈpræktɪs/",
      "partOfSpeech": "noun",
      "exampleSentence": "Retrieval practice through flashcards is more effective than re-reading."
    }
  ]
}
```

---

## POST /api/cron/process-jobs

Endpoint được gọi bởi Cron scheduler (Vercel Cron / Supabase pg_cron). Xử lý các generation jobs đang pending hoặc paused_quota.

### Request (từ Cron)
```
POST /api/cron/process-jobs
Authorization: Bearer CRON_SECRET
```

### Logic
```typescript
// 1. Tìm jobs cần xử lý
const jobs = await supabase
  .from('generation_jobs')
  .select('*')
  .in('status', ['queued', 'paused_quota'])
  .lte('next_retry_at', new Date().toISOString())  // đến giờ retry
  .limit(5);  // xử lý tối đa 5 jobs mỗi lần cron

// 2. Với mỗi job, claim và xử lý task kế tiếp
for (const job of jobs) {
  await processNextTask(job);
}
```

---

## Rate Limiting Strategy

```typescript
// Kiểm tra quota trước mỗi LLM call
async function checkRateLimit(userId: string, action: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  
  const { count } = await supabase
    .from('api_usage_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('action', action)
    .gte('created_at', today);
  
  const limits: Record<string, number> = {
    'generate-course': 3,   // 3 courses/ngày cho tier free
    'evaluate-writing': 10,  // 10 bài/ngày
    'evaluate-speaking': 10, // 10 bài/ngày
    'extract-vocab': 20,     // 20 lần/ngày
  };
  
  if (count >= (limits[action] ?? 5)) {
    throw new Error(`QUOTA_EXCEEDED: ${action} limit reached for today`);
  }
  
  // Ghi log sau khi pass
  await supabase.from('api_usage_logs').insert({ user_id: userId, action });
}
```

---

## LLM Fallback Chain

```typescript
const FREE_MODEL_CHAIN = [
  { provider: 'gemini', model: 'gemini-2.5-flash' },
  { provider: 'openrouter', model: 'google/gemini-2.0-flash-exp:free' },
  { provider: 'openrouter', model: 'meta-llama/llama-3.3-70b-instruct:free' },
];

async function callLLMWithFallback(prompt: string, schema: object) {
  for (const { provider, model } of FREE_MODEL_CHAIN) {
    try {
      return await callLLM(provider, model, prompt, schema);
    } catch (err: any) {
      if (err.status === 429) {
        // Đọc Retry-After header để biết khi nào hết quota
        const retryAfter = err.headers?.['retry-after'] ?? 3600;
        console.log(`Model ${model} rate limited, retrying after ${retryAfter}s`);
        continue;  // thử model tiếp theo
      }
      throw err;  // lỗi khác thì ném lên
    }
  }
  throw new Error('ALL_MODELS_EXHAUSTED: Tất cả model free đều hết quota. Vui lòng dùng BYOK.');
}
```
