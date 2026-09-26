/* ============================================================
   Supabase 설정
   아래 두 값을 본인의 Supabase 프로젝트 값으로 교체하세요.
   Supabase 대시보드 → Project Settings → API 에서 확인할 수 있습니다.
   ============================================================ */
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_PUBLIC_KEY';
/* ============================================================ */

// 위 값이 아직 채워지지 않았으면 클라이언트를 만들지 않고
// app.js 가 자동으로 테스트 데이터로 대체해서 화면을 보여줍니다.
const IS_SUPABASE_CONFIGURED =
  typeof supabase !== 'undefined' &&
  !SUPABASE_URL.includes('YOUR_PROJECT_ID') &&
  !SUPABASE_ANON_KEY.includes('YOUR_ANON_PUBLIC_KEY');

const sb = IS_SUPABASE_CONFIGURED
  ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

/* ------------------------------------------------------------
   조회 함수 (학생 포함 누구나 호출 가능 - RLS의 select 정책이 허용)
   실패하거나 설정이 안 되어 있으면 null 을 반환하고,
   호출한 쪽(app.js)에서 테스트 데이터로 대체합니다.
------------------------------------------------------------ */
async function fetchSchedules() {
  if (!sb) return null;
  const { data, error } = await sb.from('schedules').select('*').order('date', { ascending: true });
  if (error) { console.error('fetchSchedules 오류:', error.message); return null; }
  return data;
}

async function fetchNotices() {
  if (!sb) return null;
  const { data, error } = await sb.from('notices').select('*, profiles(name)').order('created_at', { ascending: false });
  if (error) { console.error('fetchNotices 오류:', error.message); return null; }
  return data;
}

async function fetchMaterials() {
  if (!sb) return null;
  const { data, error } = await sb.from('study_materials').select('*, profiles(name)').order('created_at', { ascending: false });
  if (error) { console.error('fetchMaterials 오류:', error.message); return null; }
  return data;
}

/* ------------------------------------------------------------
   관리자 인증 (STEP 2에서 로그인 화면과 함께 사용할 예정)
   RLS 정책이 실제 쓰기 권한을 막아주므로, 여기서는 로그인 여부와
   profiles.role 만 확인합니다.
------------------------------------------------------------ */
async function adminSignIn(email, password) {
  if (!sb) return { error: 'Supabase가 아직 설정되지 않았습니다. supabase.js를 확인하세요.' };
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  const { data: profile, error: profileError } = await sb
    .from('profiles').select('*').eq('id', data.user.id).single();
  if (profileError || !profile || !['admin', 'teacher'].includes(profile.role)) {
    await sb.auth.signOut();
    return { error: '관리자 권한이 없는 계정입니다.' };
  }
  return { user: data.user, profile };
}

async function adminSignOut() {
  if (sb) await sb.auth.signOut();
}

async function getCurrentAdmin() {
  if (!sb) return null;
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return null;
  const { data: profile } = await sb.from('profiles').select('*').eq('id', session.user.id).single();
  return (profile && ['admin', 'teacher'].includes(profile.role)) ? profile : null;
}

/* ------------------------------------------------------------
   쓰기 함수 (STEP 2에서 관리자 화면과 연결할 예정)
   로그인하지 않은 사용자가 호출해도 Supabase의 RLS가
   실제 데이터베이스 수준에서 차단합니다.
------------------------------------------------------------ */
async function insertSchedule(row) { return sb.from('schedules').insert(row); }
async function updateSchedule(id, row) { return sb.from('schedules').update(row).eq('id', id); }
async function deleteSchedule(id) { return sb.from('schedules').delete().eq('id', id); }

async function insertNotice(row) { return sb.from('notices').insert(row); }
async function updateNotice(id, row) { return sb.from('notices').update(row).eq('id', id); }
async function deleteNotice(id) { return sb.from('notices').delete().eq('id', id); }

async function insertMaterial(row) { return sb.from('study_materials').insert(row); }
async function deleteMaterial(id) { return sb.from('study_materials').delete().eq('id', id); }

/* ------------------------------------------------------------
   파일 업로드 (STEP 2에서 사용 예정)
   bucket: 'study-materials' 또는 'attachments'
------------------------------------------------------------ */
async function uploadFile(bucket, path, file) {
  if (!sb) return { error: 'Supabase가 설정되지 않았습니다.' };
  const { error } = await sb.storage.from(bucket).upload(path, file, { upsert: true });
  if (error) return { error: error.message };
  const { data } = sb.storage.from(bucket).getPublicUrl(path);
  return { url: data.publicUrl };
}
