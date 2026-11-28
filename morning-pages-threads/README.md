# 모닝페이지 스레드 자동발행

Claude가 모닝페이지 글을 쓰고, Threads 공식 API로 하루 두 번 발행합니다.

- **오전 7:05 (KST)**: 정보성 글 (`src/topics.ts`의 `INFO_TOPICS`를 하루씩 돌아가며)
- **오후 9:35 (KST)**: 일상글 (`DAILY_THEMES`, 또는 `data/notes.md`에 적어둔 진짜 메모)
- 발행한 글은 `data/history.json`에 쌓이고, 최근 8개를 Claude에게 보여줘서 같은 말을 반복하지 않게 합니다.
- 정보성 글은 **본글 + 답글 1~2개**로 이어 올립니다. 본글은 '콕 집어 부르기 → 흔한 오해 깨기 → 진짜 이유 → "이것만 따라해!"' 4단, 답글에 실제 방법을 번호로.
- 말투·구조 규칙과 예시는 `src/generate.ts`의 `SYSTEM`에서 고치면 됩니다.

## 1. Threads API 준비 (한 번만)

1. [developers.facebook.com](https://developers.facebook.com) → 앱 만들기 → 사용 사례 **"Threads API 액세스"**
2. 권한: `threads_basic`, `threads_content_publish`
3. 앱 역할 → **Threads 테스터**에 내 스레드 계정 추가 → 스레드 앱 설정(웹사이트 권한)에서 초대 수락
4. 사용 사례 설정의 **"액세스 토큰 생성"**으로 토큰 발급 → 장기 토큰(60일)으로 교환
5. `https://graph.threads.net/v1.0/me?fields=id&access_token=토큰` 으로 내 `THREADS_USER_ID` 확인

내 계정에만 올리는 동안은 앱 검수(App Review)가 필요 없습니다. 다른 사람 계정에 올리는 앱으로 팔려면 검수가 필요해요.

## 2. 로컬에서 써보기

```bash
cd morning-pages-threads
npm install
cp .env.example .env        # 키 3개 입력
npm run preview -- --kind info    # 글만 만들어서 보기 (발행 안 함)
npm run preview -- --kind daily
npm run post -- --kind info       # 실제 발행
```

## 3. 자동발행 켜기 (GitHub Actions)

저장소 Settings → Secrets and variables → Actions 에 추가:

| 이름 | 값 |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API 키 |
| `THREADS_USER_ID` | 위 5번에서 확인한 ID |
| `THREADS_ACCESS_TOKEN` | 장기 토큰 |
| `SECRETS_PAT` (선택) | 토큰 자동 갱신용. Fine-grained PAT, 이 저장소 **Secrets: Read and write** 권한 |

워크플로(`.github/workflows/morning-pages-threads.yml`)는 **기본 브랜치에 있어야** 예약 실행이 돌아갑니다.
처음엔 Actions 탭 → "모닝페이지 스레드 자동발행" → Run workflow → `preview`로 확인해 보세요.

`SECRETS_PAT`가 없으면 매월 토큰 갱신이 secret에 저장되지 않으니, 60일 안에 직접 바꿔줘야 합니다.

## 비용

글 하나에 Claude 호출 1번(길이 초과 시 최대 2번). 하루 2개면 한 달 60번 정도라 몇 달러 이하입니다.
