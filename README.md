# 찜 목록 앱

따뜻한 크림 톤의 위시리스트 앱입니다. URL을 붙여넣으면 og:image·제목·가격을 자동으로 가져오고, 별점과 메모를 함께 저장할 수 있어요.

## 실행 방법

```bash
npm install
node server.js        # 백엔드 (포트 3001)
npm run dev           # 프론트 (포트 5173)
```

브라우저에서 [http://localhost:5173](http://localhost:5173) 접속

## API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/items` | 전체 아이템 목록 |
| POST | `/api/items` | 아이템 추가 |
| PUT | `/api/items/:id` | 아이템 수정 |
| DELETE | `/api/items/:id` | 아이템 삭제 |
| GET | `/api/fetch-meta?url=...` | og:image · og:title · 가격 추출 |

## 디자인 가이드

- 배경: `#FDF6EE` (따뜻한 크림)
- 포인트 컬러: `#C8A882` (모카 브라운)
- 텍스트: `#3D3530` / 서브텍스트: `#A89B90`
- 카드: 흰 배경, border-radius 14px
- 별점: ★ (채움 `#D4A853` / 빈칸 `#D9D0C7`)
- 모달: 하단에서 올라오는 sheet 형태, backdrop blur
- 레이아웃: max-width 520px, 2열 그리드

## 기술 스택

- **백엔드**: Express.js, Node.js 내장 `http`/`https` (서버사이드 OG 파싱)
- **프론트**: Vanilla JS + Vite
- **데이터**: `data/db.json` (로컬 파일, gitignore 포함)

## 주의사항

- og:image 추출은 서버사이드에서 수행 (CORS 우회)
- 이미지 base64는 5MB 이하로 제한
- 가격은 숫자만 저장, 표시 시 `toLocaleString("ko-KR") + "원"` 포맷
