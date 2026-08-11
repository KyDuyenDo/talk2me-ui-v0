# Module: Community / Squad

> Hệ thống học nhóm với Squad, nhiệm vụ nhóm, chia sẻ tài nguyên, leaderboard và phòng học trực tuyến.

---

## Squad System

### Tạo Squad
```typescript
async function createSquad(name: string, description: string) {
  const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
  
  const { data: squad } = await supabase
    .from('squads')
    .insert({ name, description, owner_id: user.id, invite_code: inviteCode })
    .select()
    .single();
  
  // Tự join squad với role 'owner'
  await supabase.from('squad_members').insert({
    squad_id: squad.id, user_id: user.id, role: 'owner'
  });
  
  return squad;
}
```

### Join Squad bằng Invite Code
```typescript
async function joinSquad(inviteCode: string) {
  // Tìm squad với invite code này
  const { data: squad } = await supabase
    .from('squads')
    .select('id, name')
    .eq('invite_code', inviteCode.toUpperCase())
    .single();
  
  if (!squad) throw new Error('Mã mời không hợp lệ hoặc đã hết hạn.');
  
  // Check chưa là thành viên
  const { data: existing } = await supabase
    .from('squad_members')
    .select('*')
    .eq('squad_id', squad.id)
    .eq('user_id', user.id)
    .single();
  
  if (existing) throw new Error('Bạn đã là thành viên của nhóm này rồi.');
  
  // Join
  await supabase.from('squad_members').insert({
    squad_id: squad.id, user_id: user.id, role: 'member'
  });
  
  return squad;
}
```

---

## Squad Task System

### Tạo nhiệm vụ (Owner)
```typescript
async function createSquadTask(squadId: string, task: {
  title: string;
  resourceType: 'lesson' | 'flashcard_set';
  resourceId: string;
  dueDate?: string;
}) {
  // Tạo task
  const { data: squadTask } = await supabase
    .from('squad_tasks')
    .insert({
      squad_id: squadId,
      title: task.title,
      resource_type: task.resourceType,
      resource_id: task.resourceId,
      due_date: task.dueDate,
      created_by: user.id,
    })
    .select()
    .single();
  
  // Tạo progress record cho TẤT CẢ thành viên
  const { data: members } = await supabase
    .from('squad_members')
    .select('user_id')
    .eq('squad_id', squadId);
  
  await supabase.from('squad_task_progress').insert(
    members.map(m => ({
      task_id: squadTask.id,
      user_id: m.user_id,
      status: 'pending'
    }))
  );
  
  return squadTask;
}
```

### Auto-complete khi user học xong bài
```typescript
// Gọi hàm này sau khi user.progress cập nhật
async function checkAndCompleteSquadTasks(userId: string, lessonId: string) {
  // Tìm tất cả squad tasks liên quan đến bài học này
  const { data: tasks } = await supabase
    .from('squad_tasks')
    .select('id')
    .eq('resource_type', 'lesson')
    .eq('resource_id', lessonId);
  
  if (!tasks?.length) return;
  
  // Update tất cả progress record pending của user
  await supabase
    .from('squad_task_progress')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .in('task_id', tasks.map(t => t.id))
    .eq('user_id', userId)
    .eq('status', 'pending');
}
```

---

## Realtime: Cập nhật khi thành viên hoàn thành

```typescript
// Trong SquadTaskList component (Owner view)
useEffect(() => {
  const channel = supabase
    .channel(`squad-tasks-${squadId}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'squad_task_progress',
    }, (payload) => {
      // Khi có thành viên complete → cập nhật UI ngay
      if (payload.new.status === 'completed') {
        updateTaskProgress(payload.new.task_id, payload.new.user_id, 'completed');
        showToast(`${getMemberName(payload.new.user_id)} vừa hoàn thành nhiệm vụ!`);
      }
    })
    .subscribe();
  
  return () => supabase.removeChannel(channel);
}, [squadId]);
```

---

## Leaderboard Query

```typescript
// Leaderboard cho 1 squad
async function getSquadLeaderboard(squadId: string, metric: 'streak' | 'lessons' | 'cards') {
  const { data } = await supabase.rpc('get_squad_leaderboard', {
    p_squad_id: squadId,
    p_metric: metric
  });
  return data;
}
```

```sql
-- Supabase RPC function
CREATE OR REPLACE FUNCTION get_squad_leaderboard(
  p_squad_id uuid,
  p_metric text DEFAULT 'lessons'
)
RETURNS TABLE(
  user_id uuid, username text, avatar_url text,
  streak_days int, lessons_completed bigint, cards_mastered bigint,
  rank bigint
) AS $$
SELECT
  p.id, p.username, p.avatar_url, p.streak_days,
  COUNT(DISTINCT CASE WHEN up.completed = true THEN up.lesson_id END) as lessons_completed,
  COUNT(DISTINCT CASE WHEN f.status = 'mastered' THEN f.id END) as cards_mastered,
  RANK() OVER (
    ORDER BY
      CASE p_metric
        WHEN 'streak'  THEN p.streak_days
        WHEN 'lessons' THEN COUNT(DISTINCT CASE WHEN up.completed THEN up.lesson_id END)
        WHEN 'cards'   THEN COUNT(DISTINCT CASE WHEN f.status='mastered' THEN f.id END)
      END DESC
  ) as rank
FROM profiles p
JOIN squad_members sm ON p.id = sm.user_id AND sm.squad_id = p_squad_id
LEFT JOIN user_progress up ON p.id = up.user_id
LEFT JOIN flashcards f ON p.id = f.owner_id
GROUP BY p.id, p.username, p.avatar_url, p.streak_days;
$$ LANGUAGE SQL SECURITY DEFINER;
```

---

## LiveStudyRoom với Jitsi

```tsx
// src/components/LiveStudyRoom.tsx

interface LiveStudyRoomProps {
  squadId: string;
  room: LiveRoom;
}

export function LiveStudyRoom({ squadId, room }: LiveStudyRoomProps) {
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  
  return (
    <div className="grid grid-cols-3 gap-4 h-screen">
      {/* Jitsi Video (chiếm 2/3 màn hình) */}
      <div className="col-span-2">
        <iframe
          src={`https://meet.jit.si/${room.room_name}#config.startWithAudioMuted=true&config.prejoinPageEnabled=false`}
          className="w-full h-full rounded-2xl"
          allow="camera; microphone; fullscreen; display-capture"
        />
      </div>
      
      {/* Sidebar: Timer + Chat + Members */}
      <div className="flex flex-col gap-4">
        {/* Study Timer */}
        <div className="p-4 bg-white rounded-2xl shadow">
          <div className="text-4xl font-mono text-center">
            {formatTime(seconds)}
          </div>
          <button onClick={() => setIsTimerRunning(!isTimerRunning)}>
            {isTimerRunning ? 'Dừng' : 'Bắt đầu học'}
          </button>
        </div>
        
        {/* Squad Task list for this session */}
        <SquadTaskList squadId={squadId} />
      </div>
    </div>
  );
}
```

> **Tại sao Jitsi và không phải Zoom/Google Meet?**
> Jitsi Meet là open source, tự vận hành hạ tầng miễn phí (`meet.jit.si`). Zoom/Meet yêu cầu tài khoản và có giới hạn. Jitsi cho phép embed iframe trực tiếp mà không cần API key.
