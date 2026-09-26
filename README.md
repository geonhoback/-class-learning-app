# 📚 우리 반 학습공간

중학교 학급용 학습관리 웹앱 (모바일 우선). 지금 이 버전은 **STEP 1~4: 모바일 UI + 월간 달력/주간 플래너 + Supabase 데이터 연동**까지 구현되어 있습니다.

## 프로젝트 구조
```
class-learning-app/
├── index.html          ← 화면 구조
├── style.css            ← 디자인
├── app.js               ← 화면 로직 (달력, 필터, 검색 등)
├── supabase.js           ← Supabase 설정 + 데이터 조회/쓰기 함수
├── sql/
│   └── schema.sql         ← Supabase에 실행할 테이블 + RLS 정책
├── icons/                ← 앱 아이콘 (STEP 3 PWA에서 추가 예정)
└── README.md
```

## 지금 상태
- `supabase.js`의 `SUPABASE_URL` / `SUPABASE_ANON_KEY`가 아직 채워지지 않아서, 앱을 열면 **자동으로 테스트 데이터**가 표시됩니다. (화면 상단에 "테스트 데이터로 표시 중" 배지가 떠요)
- 아래 순서대로 설정하면 실제 Supabase 데이터베이스에서 일정/공지/학습자료를 불러오게 됩니다.
- 관리자 로그인, 일정·공지·자료 작성/수정/삭제 화면, 파일 업로드 UI는 **STEP 2**에서 이어서 만듭니다. (지금은 `supabase.js`에 함수만 미리 준비되어 있어요)

---

## Supabase 설정 방법 (1단계 → 5단계)

### 1단계. Supabase 프로젝트 만들기
1. https://supabase.com 에 접속해서 회원가입 후 로그인합니다.
2. **New Project**를 눌러 새 프로젝트를 만듭니다. (조직 선택 → 프로젝트 이름 `class-learning-app` → 비밀번호 설정 → 리전은 `Northeast Asia (Seoul)` 추천)
3. 생성이 끝날 때까지 1~2분 정도 기다립니다.

### 2단계. 테이블 + 보안 정책(RLS) 만들기
1. 왼쪽 메뉴에서 **SQL Editor**를 클릭합니다.
2. **New query**를 누르고, 이 프로젝트의 `sql/schema.sql` 파일 내용 전체를 복사해서 붙여넣습니다.
3. 오른쪽 아래 **Run** 버튼을 누릅니다. `profiles`, `schedules`, `notices`, `study_materials` 테이블과 보안 정책(RLS), 테스트용 샘플 일정이 함께 만들어집니다.
4. 왼쪽 메뉴 **Table Editor**에서 테이블들이 잘 만들어졌는지 확인합니다.

### 3단계. Storage 버킷 확인
1. 왼쪽 메뉴 **Storage**로 이동합니다.
2. `study-materials`, `attachments` 버킷이 2단계 SQL 실행으로 자동 생성되어 있는지 확인합니다. (안 보이면 새로고침)
3. 두 버킷 모두 **Public bucket**으로 되어 있는지 확인합니다.

### 4단계. API 키 확인 후 `supabase.js`에 입력
1. 왼쪽 메뉴 **Project Settings → API**로 이동합니다.
2. **Project URL**과 **anon public key** 값을 복사합니다. (⚠️ `service_role` 키는 절대 복사해서 쓰지 마세요)
3. `supabase.js` 파일을 열어 아래 두 줄을 본인 값으로 바꿉니다.
   ```js
   const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
   const SUPABASE_ANON_KEY = 'YOUR_ANON_PUBLIC_KEY';
   ```
4. 저장 후 `index.html`을 다시 열면, 화면 상단의 "테스트 데이터" 배지가 사라지고 실제 Supabase 데이터가 보입니다.

### 5단계. 관리자 계정 만들기 (STEP 2에서 로그인 화면과 함께 사용)
1. Supabase 대시보드 **Authentication → Users**에서 **Add user**를 눌러 회장/담임 선생님 이메일과 비밀번호로 계정을 만듭니다.
2. 계정이 생성되면 `profiles` 테이블에 자동으로 행이 하나 생깁니다. **Table Editor → profiles**에서 방금 만든 계정의 `role` 값을 `student`에서 `admin`(또는 `teacher`)으로 바꿔줍니다.
3. 이렇게 지정된 계정만 STEP 2에서 만들 로그인 화면으로 일정·공지·자료를 작성/수정/삭제할 수 있습니다. 일반 학생 계정은 만들지 않아도 되며, 학생들은 로그인 없이 읽기 전용으로 앱을 사용합니다.

---

## 로컬에서 바로 확인하는 방법
별도 서버 없이 `index.html`을 더블클릭해서 브라우저로 열어도 되지만, `fetch`가 막히는 브라우저도 있어서 **간단한 로컬 서버**를 켜는 걸 추천합니다.
```bash
cd class-learning-app
python3 -m http.server 8000
```
그 다음 브라우저에서 `http://localhost:8000` 접속 (휴대폰에서 보려면 같은 와이파이에 연결한 뒤 `http://내PC의사설IP:8000`으로 접속).

## 다음 단계
- **STEP 2**: 관리자 로그인 화면 + 일정/공지/학습자료 작성·수정·삭제 화면, 이미지 압축 업로드
- **STEP 3**: `manifest.json` + `service-worker.js` (홈 화면 설치, 오프라인 캐싱)
- **STEP 4**: GitHub Pages 배포 + 휴대폰 설치 가이드
