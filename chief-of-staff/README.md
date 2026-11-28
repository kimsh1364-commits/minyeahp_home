# 비서실장 키트 (Claude Duet 직접 만들기)

출처: @mika_systems, "Claude Duet: How to Build Your Own AI Agents with Claude Code & Opus 5.5" (2026-10-22)

## 쓰는 법
1. 이 폴더를 내 컴퓨터로 복사해요 (예: `~/chief-of-staff`)
2. 그 폴더에서 `claude` 실행 → `/model`에서 Opus 5.5 선택
3. 아래 **처음 세팅** 프롬프트를 붙여 넣어요 → CLAUDE.md와 사람 파일이 채워져요
4. `/morning-brief`를 손으로 돌려봐요

## 처음 세팅 (붙여넣기)
```
이 폴더를 읽어줘. 내 일, 자주 상대하는 사람, 허락 없이 절대 하지 말았으면 하는 것에 대해 짧은 질문 10개로 인터뷰해줘. 그다음 CLAUDE.md와 memory/people의 첫 파일들을 써줘. 저장하기 전에 전부 보여줘.
```

## 매일 쓰는 프롬프트
회의 준비:
```
다음 회의 준비해줘. memory/people와 이 사람들과 주고받은 최근 메일을 써서 한 장으로: 누구인지, 지난번 합의한 것, 내가 한 약속, 물어볼 것.
```
잊은 약속 찾기:
```
지난 14일 동안 보낸 메일을 훑어서 내가 한 약속을 전부 찾아줘(날짜가 있으면 날짜도). memory/people의 맞는 파일에 추가하고 늦은 건 따로 목록으로.
```
메모리 정리:
```
memory/에서 서로 모순되거나 30일 넘게 확인 안 된 노트를 이유와 함께 목록으로 보여줘. 아무것도 바꾸지 마.
```
하루 마무리:
```
오늘 내가 결정한 것, 약속한 것, 아직 열린 것은? memory/에 저장하고 내일을 세 줄로 알려줘.
```

## 자동 실행 (자리를 비워도 돌아가게)
권한(.claude/settings.json)을 먼저 확인한 뒤에 켜요. 무인 실행은 `--permission-mode dontAsk`로: "ask" 목록에 있는 건 실행되지 않고 거절돼요.

macOS / Linux (`crontab -e`, `command -v claude`로 나온 전체 경로를 쓰세요):
```
0 7 * * 1-5  cd ~/chief-of-staff && claude -p "/morning-brief" --permission-mode dontAsk >> briefs/cron.log 2>&1
0 16 * * 5   cd ~/chief-of-staff && claude -p "/weekly-review" --permission-mode dontAsk >> briefs/cron.log 2>&1
```
컴퓨터가 그 시간에 켜져 있어야 해요.

## 권한 3단계
- **하고 보고**: 읽기, 분류, 자기 노트 쓰기 → `allow`
- **준비하고 묻기**: 답장, 초대 등 밖으로 나가는 것 → `ask` (메일 보내기·일정 변경 도구 이름을 여기 추가, 절대 allow에 넣지 않기)
- **절대 안 함**: 돈, 삭제, 비밀 → `deny`

## 천천히 시작하기
- 1주차: CLAUDE.md, memory/, `/morning-brief` 손으로
- 2주차: 브리핑 예약 실행
- 3주차: 메일 연결 (보내기는 ask)
- 4주차: 첫 서브에이전트
