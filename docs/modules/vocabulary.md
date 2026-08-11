# Module: Vocabulary

> Hệ thống từ vựng thông minh: rút từ bằng AI, highlight trong Theory, và chuyển thành Flashcard một cú bấm.

---

## 3 Nguồn Từ Vựng

| Source Type | Cách thu thập | source_type trong DB |
|-------------|---------------|----------------------|
| Theory | User bôi chọn từ trong bài Theory | `'theory'` |
| Result | AI gợi ý sau khi hoàn thành bài học | `'result'` |
| Manual | User tự thêm từ | `'manual'` |

---

## Vocabulary Extraction Agent

**Input:**
```json
{
  "lessonId": "uuid",
  "content": "Business emails are an essential tool in modern professional communication. An effective email requires a clear subject line, professional salutation, concise body, and a strong call-to-action...",
  "sourceType": "result",
  "targetCount": 10
}
```

**Prompt gửi cho LLM:**
```
Bạn là chuyên gia ngôn ngữ. Từ nội dung bài học sau, hãy rút ra 10 từ/cụm từ 
quan trọng nhất cho người học tiếng Anh. Ưu tiên: business vocabulary, collocations, 
idiomatic expressions.

Với mỗi từ, cung cấp:
- term: từ hoặc cụm từ
- definition: định nghĩa ngắn gọn bằng tiếng Anh  
- phonetic: phiên âm IPA
- partOfSpeech: danh từ/động từ/tính từ/...
- exampleSentence: câu ví dụ tự nhiên

Nội dung bài:
{content}
```

**Sample Output từ LLM:**
```json
{
  "vocabulary": [
    {
      "term": "call-to-action",
      "definition": "A prompt that encourages the reader to take a specific action",
      "phonetic": "/ˌkɔːl tə ˈækʃən/",
      "partOfSpeech": "noun (compound)",
      "exampleSentence": "End your email with a clear call-to-action, such as 'Please reply by Friday.'"
    },
    {
      "term": "salutation",
      "definition": "A greeting at the beginning of a letter or email",
      "phonetic": "/ˌsæljuˈteɪʃən/",
      "partOfSpeech": "noun",
      "exampleSentence": "The appropriate salutation for a formal email is 'Dear Mr./Ms. [Last Name].'"
    },
    {
      "term": "concise",
      "definition": "Expressing much in few words; brief but comprehensive",
      "phonetic": "/kənˈsaɪs/",
      "partOfSpeech": "adjective",
      "exampleSentence": "Keep your email concise—aim for under 200 words."
    }
  ]
}
```

---

## Word Highlight UI

```tsx
// src/components/VocabTooltip.tsx

interface VocabTooltipProps {
  selectedText: string;
  position: { x: number; y: number };
  onSave: (term: string) => Promise<void>;
  onDismiss: () => void;
}

export function VocabTooltip({ selectedText, position, onSave, onDismiss }: VocabTooltipProps) {
  const [saving, setSaving] = useState(false);
  
  return (
    <div
      className="fixed z-50 bg-white shadow-xl rounded-xl p-3 border flex gap-2"
      style={{ left: position.x, top: position.y - 50 }}
    >
      <span className="text-sm font-semibold text-gray-700 max-w-[120px] truncate">
        "{selectedText}"
      </span>
      <button
        onClick={async () => {
          setSaving(true);
          await onSave(selectedText);
          setSaving(false);
          onDismiss();
        }}
        className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg font-bold"
      >
        {saving ? '...' : '+ Từ vựng'}
      </button>
    </div>
  );
}

// Trong TheoryReader.tsx — thêm selection listener
function TheoryReader({ lesson }: { lesson: Lesson }) {
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const { user } = useAuth();
  
  const handleMouseUp = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    if (!text || text.length < 2 || text.length > 50) {
      setTooltip(null);
      return;
    }
    const rect = selection!.getRangeAt(0).getBoundingClientRect();
    setTooltip({ text, x: rect.left, y: rect.top + window.scrollY });
  };
  
  const handleSaveVocab = async (term: string) => {
    // Kiểm tra duplicate
    const { data: existing } = await supabase
      .from('vocabulary')
      .select('id')
      .eq('owner_id', user.id)
      .eq('term', term.toLowerCase())
      .single();
    
    if (existing) {
      showToast('Từ này đã có trong kho từ vựng!', 'warning');
      return;
    }
    
    await supabase.from('vocabulary').insert({
      owner_id: user.id,
      term: term.toLowerCase(),
      source_lesson_id: lesson.id,
      source_type: 'theory',
    });
    
    showToast(`Đã lưu: "${term}"`, 'success');
  };
  
  return (
    <div onMouseUp={handleMouseUp}>
      {/* ... nội dung bài theory ... */}
      {tooltip && (
        <VocabTooltip
          selectedText={tooltip.text}
          position={{ x: tooltip.x, y: tooltip.y }}
          onSave={handleSaveVocab}
          onDismiss={() => setTooltip(null)}
        />
      )}
    </div>
  );
}
```

---

## One-click: Vocab → Flashcard

```typescript
async function convertVocabToFlashcard(vocab: Vocabulary, setId: string) {
  const { error } = await supabase.from('flashcards').insert({
    set_id: setId,
    owner_id: user.id,
    front_text: vocab.term,
    back_text: vocab.definition,
    phonetic: vocab.phonetic,
    example_sentence: vocab.example_sentence,
    // SRS defaults (mới)
    interval_days: 0,
    ease_factor: 2.5,
    repetitions: 0,
    next_review_date: new Date().toISOString().split('T')[0],
    status: 'new',
  });
  
  if (!error) {
    showToast(`Flashcard "${vocab.term}" đã được tạo!`, 'success');
  }
}
```
