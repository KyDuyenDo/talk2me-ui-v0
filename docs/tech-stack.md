# Tech Stack — Talk2Me LearnTube

> Tài liệu này mô tả toàn bộ công nghệ được dùng trong dự án, lý do lựa chọn, và hướng dẫn setup môi trường cho Junior Developer.

---

## 1. Tổng quan kiến trúc

```
┌─────────────────────────────────────────────────────────────┐
│                    NGƯỜI DÙNG (Browser)                      │
│                                                             │
│  React 19 + Vite + TailwindCSS 4 + TypeScript              │
│  ┌────────────┐  ┌───────────┐  ┌──────────────────────┐  │
│  │   Courses  │  │ Flashcard │  │   Community/Squads   │  │
│  └────────────┘  └───────────┘  └──────────────────────┘  │
│         │              │                   │               │
│    SRS Client     BYOK OpenRouter     Supabase Realtime    │
└─────────────────────────────────────────────────────────────┘
           │                                    │
           ▼                                    ▼
┌──────────────────────┐            ┌───────────────────────┐
│   SERVERLESS API     │            │       SUPABASE        │
│ (Cloudflare/Vercel)  │            │                       │
│                      │            │  Postgres (DB)        │
│  /api/generate-course│◄──────────►│  Auth (JWT)           │
│  /api/eval-writing   │            │  Storage (audio)      │
│  /api/eval-speaking  │            │  Realtime (ws)        │
│  /api/extract-vocab  │            │  RLS (security)       │
│  /api/llm-proxy      │            └───────────────────────┘
└──────────────────────┘
           │
           ▼
┌──────────────────────┐
│   LLM PROVIDERS      │
│                      │
│  Gemini free tier    │  ← xương sống cho tier free
│  OpenRouter :free    │  ← fallback
│  OpenRouter BYOK     │  ← khi user nhập key riêng
└──────────────────────┘
```

---

## 2. Frontend

| Công nghệ | Phiên bản | Lý do chọn |
|-----------|-----------|------------|
| **React** | 19.x | UI framework chính; concurrent features giúp render mượt |
| **Vite** | 6.x | Build tool cực nhanh, HMR tức thì trong dev |
| **TypeScript** | 5.8.x | Type safety, dễ phát hiện lỗi sớm, IDE autocomplete tốt hơn |
| **TailwindCSS** | 4.x | Utility-first CSS, thiết kế nhất quán, không cần viết CSS file |
| **lucide-react** | 0.546.x | Icon library nhẹ, tree-shakeable |
| **motion** | 12.x | Animation library (trước đây là Framer Motion) |
| **recharts** | 3.x | Chart library cho Progress Analytics |
| **react-markdown** | 10.x | Render Markdown content cho Theory section |

### Tại sao không dùng Next.js?
Next.js thêm complexity server-side rendering không cần thiết. Talk2Me là SPA thuần, deploy static hoàn toàn được. Vite + React đơn giản hơn và Junior dễ học hơn.

### Tại sao không dùng Redux?
State management đủ với React `useState` + custom hooks + Supabase real-time. Redux là overkill cho scale này và làm phức tạp code không cần thiết.

---

## 3. Backend (Serverless)

| Công nghệ | Lý do chọn | Thay thế đã xem xét |
|-----------|------------|---------------------|
| **Cloudflare Workers** | Free tier rất rộng (100k req/ngày), global edge, zero cold start | AWS Lambda (tốn tiền hơn), Vercel Functions (cũng ok) |
| **Vercel Functions** | Dễ setup với Next.js-style routing, free tier ok | Cloudflare Workers |

> **Quyết định:** Dùng **Vercel Functions** trước (đơn giản hơn để bắt đầu), migrate sang Cloudflare Workers khi cần edge performance hoặc Durable Objects.

---

## 4. Database & Backend Services

| Dịch vụ | Tính năng dùng | Free tier |
|---------|---------------|-----------|
| **Supabase** | Postgres + Auth + Storage + Realtime + RLS | 500MB DB, 1GB storage, 50k MAU |

### Tại sao Supabase và không phải Firebase?
- Supabase dùng **Postgres** (SQL) — dễ query phức tạp, JOIN tables, leaderboard queries
- Firebase dùng NoSQL — khó làm leaderboard, squad member queries
- Supabase có **Row-Level Security** built-in — bảo mật tốt hơn
- Open source, có thể self-host nếu cần
- **RLS là hàng phòng thủ chính** khi client nói thẳng với DB — điều mà Firebase Firestore rules khó hơn để quản lý

---

## 5. AI / LLM

| Provider | Model | Dùng cho | Chi phí |
|----------|-------|----------|---------|
| **Gemini** | `gemini-2.5-flash` free | Sinh khóa học (xương sống) | Free (có quota) |
| **OpenRouter** | `gemini-2.0-flash-exp:free` | Fallback sinh khóa | Free |
| **OpenRouter** | `deepseek/deepseek-r1:free` | Chấm writing | Free |
| **OpenRouter** | `meta-llama/llama-3.3-70b:free` | Sinh flashcard | Free |
| **OpenRouter** | `qwen/qwen-2.5-72b:free` | Rút từ vựng | Free |
| **OpenRouter** | Claude / GPT-4o / DeepSeek V3 | BYOK premium | User trả tiền |

### SDK đang dùng
```typescript
// Server-side: Gemini
import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Client-side (BYOK): OpenRouter via fetch
fetch('https://openrouter.ai/api/v1/chat/completions', {
  headers: { 'Authorization': `Bearer ${userBYOKKey}` }
})
```

---

## 6. Deployment & DevOps

| Dịch vụ | Dùng cho | Chi phí |
|---------|----------|---------|
| **Cloudflare Pages** | Hosting frontend static | Free ($0) |
| **Vercel** | Serverless API functions | Free tier (100GB bandwidth) |
| **GitHub** | Source control + CI/CD | Free |
| **GitHub Actions** | Auto deploy khi push | Free (2000 min/tháng) |

---

## 7. Development Setup (cho Junior)

### Yêu cầu phần mềm
```
Node.js >= 18.x (hoặc Bun >= 1.x)
Git
VS Code (khuyên dùng)
```

### VS Code Extensions khuyên dùng
```
- Tailwind CSS IntelliSense
- ES7+ React/Redux/React-Native snippets
- TypeScript Importer
- Prettier - Code formatter
- GitLens
```

### Clone và chạy dự án
```bash
git clone <repo-url>
cd talk2me-ui

# Cài dependencies
bun install   # hoặc npm install

# Tạo file .env từ example
cp .env.example .env
# Điền VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY

# Chạy development server
bun run dev   # hoặc npm run dev
# Mở http://localhost:5173
```

### File .env.example
```env
# Supabase (Public - có thể expose ra client)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Server-side only (KHÔNG có VITE_ prefix = không lộ ra client)
GEMINI_API_KEY=AIzaSy...
OPENROUTER_API_KEY=sk-or-...
```

> **Lưu ý bảo mật cho Junior:** Chỉ các biến có prefix `VITE_` mới được bundle vào frontend. Các biến còn lại (GEMINI_API_KEY, OPENROUTER_API_KEY) chỉ dùng ở server-side, KHÔNG bao giờ đặt prefix `VITE_` cho chúng.

---

## 8. Cấu trúc thư mục dự án

```
talk2me-ui/
├── src/
│   ├── components/          # React components
│   │   ├── AuthModal.tsx    # (P0-S2) Sẽ tạo mới
│   │   ├── CourseCard.tsx   # Đã có
│   │   ├── TheoryReader.tsx # Đã có, sẽ thêm vocab highlight (P2-S2)
│   │   └── ...
│   ├── hooks/               # (Sẽ tạo) Custom hooks
│   │   ├── useAuth.ts       # Auth state management
│   │   ├── useCourses.ts    # Course CRUD với Supabase
│   │   └── useFlashcards.ts # Flashcard + SRS
│   ├── services/            # External API calls
│   │   ├── openrouter.ts    # Đã có - BYOK
│   │   └── supabase.ts      # (Sẽ tạo) Supabase client
│   ├── utils/               # (Sẽ tạo) Utility functions
│   │   └── srs.ts           # SM-2 algorithm
│   ├── types.ts             # TypeScript types
│   ├── App.tsx              # Main app
│   └── main.tsx             # Entry point
├── api/                     # (Sẽ tạo) Serverless functions
│   ├── generate-course.ts
│   ├── evaluate-writing.ts
│   ├── evaluate-speaking.ts
│   └── extract-vocab.ts
├── supabase/
│   └── migrations/          # (Sẽ tạo) SQL migration files
├── docs/                    # Tài liệu này
└── public/
```

---

## 9. Nguyên tắc coding (cho Junior)

### TypeScript
- Luôn khai báo type cho function parameters và return values
- Dùng `interface` cho object types, `type` cho union types
- Không dùng `any` — thay bằng `unknown` nếu thực sự không biết type

### React
- Dùng functional components + hooks (không class components)
- Custom hooks cho logic phức tạp (useAuth, useCourses, etc.)
- `useEffect` cleanup để tránh memory leaks (đặc biệt khi subscribe Supabase Realtime)

### Supabase
- Luôn check `error` sau mỗi Supabase call
- Dùng `supabase.auth.getUser()` (server-side) thay `getSession()` cho security
- RLS tự bảo vệ data — nhưng vẫn phải validate input ở client

---

## 10. Học hỏi từ dự án này

Dự án Talk2Me là nơi tốt để học:
1. **Supabase** — database, auth, realtime đều trong một tool
2. **Serverless** — cách deploy function không cần server
3. **LLM integration** — cách gọi Gemini/OpenRouter an toàn
4. **SRS algorithm** — thuật toán học thẻ (SM-2) nổi tiếng của Anki
5. **Real-time features** — WebSocket qua Supabase Realtime
6. **Cost optimization** — kỹ năng quan trọng để build product $0/tháng
