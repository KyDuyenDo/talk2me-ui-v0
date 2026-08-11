# Module: Flashcard + Spaced Repetition (SRS)

> Hệ thống flashcard thông minh với thuật toán SM-2 chạy hoàn toàn ở client.

---

## Spaced Repetition là gì?

> **Learning checkpoint cho Junior:**
> Spaced Repetition (SRS - Spaced Repetition System) là kỹ thuật học có khoa học chứng minh hiệu quả. Thay vì ôn đều đặn mỗi ngày, SRS điều chỉnh khoảng cách ôn dựa trên mức độ nhớ của bạn:
> - Từ bạn nhớ tốt → ôn lại sau 10 ngày, 30 ngày, 90 ngày...
> - Từ bạn quên → ôn lại ngay ngày hôm sau
>
> **Thuật toán SM-2** (SuperMemo 2) là thuật toán SRS được dùng bởi Anki — app flashcard nổi tiếng nhất thế giới. Talk2Me dùng chính thuật toán này.

---

## SM-2 Algorithm

```typescript
// src/utils/srs.ts

export interface SM2Result {
  newEaseFactor: number;    // "độ dễ" của thẻ (khởi tạo 2.5)
  newIntervalDays: number;  // ôn lại sau bao nhiêu ngày
  newRepetitions: number;   // số lần đã ôn thành công liên tiếp
  nextReviewDate: string;   // ISO date: khi nào ôn lại
}

/**
 * Tính lịch ôn tập tiếp theo theo thuật toán SM-2.
 * 
 * @param easeFactor - "độ dễ" hiện tại (mặc định 2.5, min 1.3)
 * @param repetitions - số lần ôn thành công liên tiếp
 * @param quality - mức độ nhớ: 0=quên hoàn toàn, 5=nhớ hoàn hảo
 */
export function calculateSM2(
  easeFactor: number,
  repetitions: number,
  quality: number  // 0-5
): SM2Result {
  // Cập nhật ease factor (không bao giờ dưới 1.3)
  const newEF = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );
  
  let newInterval: number;
  let newReps: number;
  
  if (quality < 3) {
    // Quên (quality 0, 1, 2) → reset về đầu
    newReps = 0;
    newInterval = 1;  // ôn lại ngày mai
  } else {
    // Nhớ (quality 3, 4, 5)
    newReps = repetitions + 1;
    
    if (repetitions === 0) {
      newInterval = 1;    // lần đầu thành công → ôn sau 1 ngày
    } else if (repetitions === 1) {
      newInterval = 6;    // lần 2 thành công → ôn sau 6 ngày
    } else {
      // Nhân với ease factor (>= 1.3, thường ~2.5)
      // Ví dụ: interval 6 × 2.5 = 15 ngày
      newInterval = Math.round(/* previous interval */ repetitions === 1 ? 6 : Math.round(6 * newEF) * newEF);
      // Cần giữ track interval: xem lưu ý dưới
    }
  }
  
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + newInterval);
  
  return {
    newEaseFactor: newEF,
    newIntervalDays: newInterval,
    newRepetitions: newReps,
    nextReviewDate: nextDate.toISOString().split('T')[0],
  };
}
```

> **Lưu ý quan trọng:** SM-2 cần biết `interval` lần trước để tính `interval` lần sau. Vì vậy cần lưu `interval_days` trong DB, không chỉ `next_review_date`.

---

## Flow ôn Flashcard

```
Người dùng mở Review Session
         │
         ▼
Lấy tất cả cards: next_review_date <= hôm nay
         │
         ▼
Hiển thị card (front_text / video clip)
         │
         ▼
User lật thẻ xem đáp án
         │
         ▼
User bấm rating:
  [Quên hẳn]  [Khó]  [Ổn]  [Dễ]
  quality=1    q=2    q=4   q=5
         │
         ▼
calculateSM2(card.easeFactor, card.repetitions, quality)
         │ (chạy ở client, không tốn server)
         ▼
Update DB: ease_factor, interval_days, repetitions, next_review_date, status
Insert review_log: { card_id, quality, reviewed_at }
         │
         ▼
Card tiếp theo (nếu còn) hoặc kết thúc session
```

---

## Video Flashcard — Zero Cost

Video Flashcard không lưu video file. Chỉ lưu 3 số: `source_video_id`, `clip_start_sec`, `clip_end_sec`.

```typescript
// Khi người dùng lưu đoạn từ Shadowing:
const videoFlashcard = {
  front_text: "A business email has three core components.",
  back_text: "Một email có 3 thành phần cốt lõi.",
  source_video_id: "dQw4w9WgXcQ",
  clip_start_sec: 15,
  clip_end_sec: 23,
};

// Khi ôn, render YouTube embed:
const embedUrl = `https://www.youtube.com/embed/${card.source_video_id}` +
  `?start=${card.clip_start_sec}&end=${card.clip_end_sec}&autoplay=1`;
```

```tsx
// FlashcardPlayer.tsx — phần render video flashcard
function VideoFlashcard({ card }: { card: Flashcard }) {
  const isVideoCard = !!card.source_video_id;
  
  if (!isVideoCard) {
    return <div className="text-2xl font-bold">{card.front_text}</div>;
  }
  
  return (
    <div className="space-y-4">
      <iframe
        src={`https://www.youtube.com/embed/${card.source_video_id}?start=${card.clip_start_sec}&end=${card.clip_end_sec}&autoplay=1`}
        className="w-full aspect-video rounded-xl"
        allow="autoplay"
      />
      <p className="text-center text-gray-600">{card.front_text}</p>
    </div>
  );
}
```

---

## UI Rating Buttons

```tsx
// Sau khi user lật thẻ, hiển thị 4 nút rating
const RATING_OPTIONS = [
  { quality: 1, label: 'Quên hẳn', color: 'bg-red-500',    emoji: '😵' },
  { quality: 2, label: 'Khó',      color: 'bg-orange-500', emoji: '😓' },
  { quality: 4, label: 'Ổn',       color: 'bg-blue-500',   emoji: '😊' },
  { quality: 5, label: 'Dễ',       color: 'bg-green-500',  emoji: '😄' },
];

function RatingButtons({ onRate }: { onRate: (quality: number) => void }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {RATING_OPTIONS.map(({ quality, label, color, emoji }) => (
        <button
          key={quality}
          onClick={() => onRate(quality)}
          className={`${color} text-white p-3 rounded-xl font-bold text-sm`}
        >
          <div className="text-xl">{emoji}</div>
          <div>{label}</div>
        </button>
      ))}
    </div>
  );
}
```

---

## Sync về Supabase (sau khi rate)

```typescript
async function handleRate(card: Flashcard, quality: number) {
  // 1. Tính SM-2 ở client
  const result = calculateSM2(
    card.ease_factor ?? 2.5,
    card.repetitions ?? 0,
    quality
  );
  
  // 2. Xác định status mới
  const newStatus: 'new' | 'learning' | 'mastered' =
    result.newIntervalDays >= 21 ? 'mastered' :
    result.newRepetitions > 0 ? 'learning' : 'new';
  
  // 3. Update flashcard trong DB
  await supabase.from('flashcards').update({
    ease_factor: result.newEaseFactor,
    interval_days: result.newIntervalDays,
    repetitions: result.newRepetitions,
    next_review_date: result.nextReviewDate,
    status: newStatus,
  }).eq('id', card.id);
  
  // 4. Ghi review log
  await supabase.from('review_logs').insert({
    card_id: card.id,
    user_id: currentUser.id,
    quality,
    reviewed_at: new Date().toISOString(),
  });
  
  // 5. Cập nhật streak nếu cần
  await updateStreakIfNeeded(currentUser.id);
}
```

---

## Due Cards Query

```typescript
// Lấy tất cả cards đến hạn ôn hôm nay
const today = new Date().toISOString().split('T')[0];
const { data: dueCards } = await supabase
  .from('flashcards')
  .select('*')
  .eq('owner_id', user.id)
  .lte('next_review_date', today)
  .neq('status', 'mastered')  // bỏ qua thẻ đã master (interval > 21 ngày)
  .order('next_review_date', { ascending: true });

console.log(`You have ${dueCards.length} cards due today!`);
```
