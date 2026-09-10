# design-kg

UI/UX 디자인 지식그래프와 그걸 조회·검증하는 MCP 서버.

에이전트가 "과감한 표현으로 새로 그려줘" 같은 자연어 디자인 지시를 받았을 때, 지어내지 않고 그래프에서 찾아 쓰게 만드는 게 목표다. 코퍼스는 [Madia Designer](https://www.youtube.com/@UXUIDesign) 리뷰 영상이고, 영상에서 뽑은 사례가 규칙(Rule) · 선택지(Option) · 형용사 매핑(Quality)으로 승격된다.

- 설계: [docs/plan.md](docs/plan.md)
- 스키마: `docs/schema.md` (4단계 산출물)
- 데이터: `kg/`
- MCP 서버: `mcp/`

그래프에는 추출 결과와 출처(영상 ID + 타임스탬프)만 들어 있다. 프레임 캡처 원본은 `.evidence/`에 두고 커밋하지 않는다.

관련 레포: [my-ui-lib](https://github.com/Junseop-Shin/my-ui-lib) (디자인 테마 축 · 평가 대상 컴포넌트)

## 사용

```bash
npm install && npx playwright install chromium
npm run validate                 # kg/ 검증
npm run candidates               # 승격 후보 표
npm run snapshot -- --url <url> --out .evidence/snapshots/x.json --platform mobile
npm run mcp                      # stdio MCP 서버 (Claude Code는 .mcp.json으로 자동 연결)
```

Claude Code에서 이 디렉터리를 열면 `.mcp.json`의 `design-kg` 서버가 뜬다. `/mcp`로 확인.
