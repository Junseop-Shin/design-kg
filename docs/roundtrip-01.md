# 왕복 기록 01 — 히어로 섹션 "답답한→여유로운"

날짜: 2026-09-11 · KG: cases 242 · rules 3 · options 12 · qualities 5 (`npm run validate` 결과: 25 videos, 242 cases (qualities 111, measured 37), 3 rules, 12 options, 5 qualities)

## 0. 진행 방식에 대한 컨트롤러 조정

Task 13 브리프의 Step 2는 새 Claude Code 세션을 열어 `design_qualities("과감한", ...)`을 조회하는
순서를 가정한다. 두 가지가 실제와 달랐다.

1. 새 Claude Code 세션을 열 수 없어, `@modelcontextprotocol/sdk`로 만든 얇은 클라이언트
   (`.evidence/roundtrip-01/client.ts`, 커밋 대상 아님)로 `npm run mcp` stdio 서버에 직접 붙어
   내가 에이전트 역할로 툴을 호출하고 결과를 읽어 다음 호출을 정했다.
2. `docs/schema.md`가 명시하듯 이번 코퍼스에서 승격된 Quality 5개는 전부 `polarity: problem`이고
   "과감한"은 노드로 존재하지 않는다(target 형용사는 문턱을 못 넘었다). 그래서 조회 대상을
   `design_qualities("답답한", context: hero, platform: web)`으로 바꾸고, 여기에 더해
   `design_options` · `design_rules`를 `{component: hero, platform: web, context: hero}`와
   `{component: button, platform: web}`로도 조회해 히어로 섹션 전체(제목·부제·버튼)의 근거를 모았다.

## 1. 조회

### 1-0. 클라이언트 동작 확인 (sanity check)

`design_rules({component: "button", platform: "web"})`

```json
[
  {
    "id": "rule-001",
    "statement": "본문 텍스트와 배경의 대비는 4.5:1 이상이어야 한다",
    "grade": "CHECKABLE",
    "source": "standard",
    "standard_ref": "WCAG 2.2 SC 1.4.3",
    "scope": { "component": "any", "platform": "any", "size": "any", "variant": "any", "context": "any" },
    "property": "contrast",
    "state": "default",
    "check": "contrast(el.style.color, el.style['background-color']) >= 4.5",
    "promoted_from": ["case-2503", "case-1304"],
    "confidence": 2,
    "conflicts_with": [],
    "conflicts": []
  },
  {
    "id": "rule-003",
    "statement": "키보드 포커스를 받은 요소는 포커스 상태가 눈에 보여야 한다",
    "grade": "CHECKABLE",
    "source": "standard",
    "standard_ref": "WCAG 2.2 SC 2.4.7",
    "scope": { "component": "any", "platform": "any", "size": "any", "variant": "any", "context": "any" },
    "property": "focus",
    "state": "focus-visible",
    "check": "num(el.style['outline-width']) >= 2 && el.style['outline-style'] !== 'none'",
    "promoted_from": [],
    "confidence": 0,
    "conflicts_with": [],
    "conflicts": []
  }
]
```

**rule-002(모바일 터치 타겟 44px)가 빠진 건 버그가 아니다.** `rule-002.scope = { platform: mobile }`고
질의는 `platform: web`이라 `matchesScope`가 정확히 걸러낸다. "표준 Rule 3개가 나와야 한다"는 순진한
기대와 실제 scope 필터링이 부딪히는 지점이라 §관찰에 적어 둔다.

### 1-1. `design_qualities("답답한", context: hero, platform: web)`

```json
{
  "found": true,
  "quality": {
    "id": "quality-cramped",
    "label": "답답한",
    "aliases": ["빡빡한", "촘촘한"],
    "polarity": "problem",
    "realized_by": [
      {
        "property": "whitespace",
        "direction": "up",
        "weight": 9,
        "cases": ["case-404", "case-1504", "case-1901", "case-1904", "case-1906", "case-1907", "case-1908", "case-606", "case-304"]
      }
    ],
    "opposes": "quality-loose"
  },
  "realized_by": "…(quality.realized_by와 동일 — 생략, 위 참조)",
  "opposes": {
    "id": "quality-loose",
    "label": "넓은",
    "aliases": ["벙벙한"],
    "polarity": "problem",
    "realized_by": [
      { "property": "whitespace", "direction": "down", "weight": 4, "cases": ["case-1004", "case-1010", "case-805", "case-908"] }
    ],
    "opposes": "quality-cramped"
  },
  "rules": "…(2 lines omitted — §1-0 sanity check의 design_rules 출력과 동일: rule-001, rule-003)"
}
```

`realized_by` 항목이 하나(`whitespace, up, weight 9`)뿐이다. `답답한`은 `polarity: problem`이라
이 방향(`up`)을 적용하면 답답함을 없애는 쪽으로 간다.

### 1-2. `design_options({component: hero, platform: web, context: hero})`

```json
[]
```

빈 배열. `hero`를 `component`로 지목한 Option이 그래프에 하나도 없다(`docs/schema.md`의 컴포넌트
표에서도 `hero`는 my-ui-lib에 매핑되지 않는 11건짜리 버킷이다).

### 1-3. `design_rules({component: hero, platform: web, context: hero})`

```json
"…(생략 — §1-0과 완전히 동일한 rule-001 · rule-003 두 건)"
```

`hero` scope로 좁혀도 결과가 안 바뀐 이유는 두 Rule의 `scope.component`가 둘 다 `any`라서다.

### 1-4. `design_options({component: button, platform: web})`

```json
[
  {
    "id": "option-012",
    "question": "한 화면에 버튼이 여럿일 때 어떻게 정리할까",
    "scope": { "component": "button", "platform": "any", "size": "any", "variant": "any", "context": "any" },
    "choices": [
      { "label": "세로로 하나씩 쌓는다", "when": "선택지가 서로 동등하고 세로 영역이 충분할 때", "recommended": false, "cases": ["case-706"] },
      { "label": "인접 요소와 합쳐 버튼 수를 줄인다", "when": "검색 인풋처럼 입력과 실행이 한 동작이거나, 버튼처럼 보이는 요소가 이미 여럿일 때", "recommended": false, "cases": ["case-601", "case-801"] },
      { "label": "텍스트형 버튼에서 아이콘·언더라인을 뺀다", "when": "문구만으로 뜻이 분명할 때", "recommended": false, "cases": ["case-707"] }
    ]
  }
]
```

`option-012`는 버튼이 **여럿일 때**의 정리법이라 브리프가 요구한 "버튼 하나"에는 전제 자체가
성립하지 않는다. → 적용하지 않음(아래 "고르지 않은 것" 참조).

### 1-5. `design_options({component: typo, platform: web, context: hero})`

```json
[
  {
    "id": "option-008",
    "question": "텍스트를 키울 때 어디까지 키울까",
    "scope": { "component": "typo", "platform": "any", "size": "any", "variant": "any", "context": "any" },
    "choices": [
      { "label": "13~14px", "when": "카드·리스트 캡션이나 보조 설명일 때", "recommended": false, "cases": ["case-1208", "case-1213"] },
      { "label": "16px", "when": "모바일 본문이나 히어로 서브 텍스트일 때", "recommended": false, "cases": ["case-704", "case-807", "case-1503"] },
      { "label": "28~32px 이상", "when": "들어오자마자 읽혀야 하는 페이지·히어로 타이틀일 때", "recommended": true, "cases": ["case-204", "case-1701"] }
    ]
  },
  {
    "id": "option-009",
    "question": "텍스트가 과하게 커 보일 때 어디까지 줄일까",
    "scope": { "component": "typo", "platform": "any", "size": "any", "variant": "any", "context": "any" },
    "choices": [
      { "label": "14~15px", "when": "카드 브랜드·상품명이나 히어로 라벨처럼 보조 텍스트일 때", "recommended": false, "cases": ["case-1601", "case-005"] },
      { "label": "18~20px", "when": "섹션 타이틀·헤드라인이라 위계는 남겨야 할 때", "recommended": false, "cases": ["case-1206", "case-1212"] },
      { "label": "타이틀·본문을 한 단계씩 같이 낮춘다", "when": "타이틀만이 아니라 화면 전체 폰트가 커 보일 때", "recommended": true, "cases": ["case-711", "case-1608"] }
    ]
  },
  {
    "id": "option-010",
    "question": "본문 텍스트를 어느 쪽으로 정렬할까",
    "scope": { "component": "typo", "platform": "any", "size": "any", "variant": "any", "context": "any" },
    "choices": [
      { "label": "좌측 정렬", "when": "두세 줄이 넘거나 목록·카드 본문일 때", "recommended": true, "cases": ["case-1011", "case-710", "case-904"] },
      { "label": "가운데 정렬", "when": "이어지는 요소들의 폭이 서로 다르지 않을 때. case-608은 폭이 다른 요소를 계속 가운데로 맞추면 좌우 여백이 들쭉날쭉해져 시선이 지그재그로 흐른다고 지적한다", "recommended": false, "cases": ["case-608"] }
    ]
  }
]
```

`context: hero`로 걸었지만 세 Option 모두 `scope.context: any`라 실제로는 필터링되지 않았다.
`option-008`의 세 번째 choice(`when`에 "히어로 타이틀"이 직접 명시됨)와 두 번째 choice(`when`에
"히어로 서브 텍스트"가 명시됨)만 히어로에 실제로 맞는 근거다. `option-010`(정렬)의 근거 Case는
전부 목록·카드 "본문" 상황이라 히어로 타이틀/부제에 그대로 옮기기 어렵다 → 적용하지 않음.

### 1-6. `design_cases("quality-cramped")` — 근거 확인용

```json
{
  "kind": "quality",
  "node": "…(§1-1의 quality 노드와 동일 — 생략)",
  "cases": [
    {
      "id": "case-1901",
      "video": "YNDhbNQo_io", "t": "1:24", "url": "https://youtu.be/YNDhbNQo_io?t=84",
      "problem": "화면 전체 여백이 굉장히 타이트해서 촘촘하고 빡빡해 보이고, 가독성이 떨어지고 콘텐츠 간 그룹핑도 전혀 되어 보이지 않는다.",
      "fix": "여백은 너무 타이트하게 잡기보다는 넓게, 널찍하게 뛴다. 처음부터 좁게 뛰고 넓히기보다는 애초에 과감하게 넓게 뛴 다음 조금씩 좁혀 가는 방식이 낫다.",
      "stance": "PREFERRED",
      "quote": "여백은 너무 타이트하기보다는 조금 넓게 넓게 넓직 널찍 뛰시는게 좋습니다."
    },
    {
      "id": "case-1908",
      "video": "YNDhbNQo_io", "t": "8:14", "url": "https://youtu.be/YNDhbNQo_io?t=494",
      "problem": "타이틀, 본문, 하단 버튼이 여백 없이 촘촘하게 붙어 있으면 그룹핑이 전혀 되어 보이지 않고 하나의 뭉텅이로 보여, 정작 사용자가 보고자 하는 타이틀과 버튼을 빠르게 찾지 못하고 혼란을 겪는다.",
      "fix": "타이틀과 본문과 버튼 사이의 여백을 충분히 확보해서, 사용자가 보고자 하는 부분(타이틀 → 버튼)만 딱딱 짚어 볼 수 있도록 그룹핑해 준다.",
      "stance": "OPTION",
      "quote": "그래서 이처럼 타이틀과 본문과 버튼에 대한 여백을 충분히 확보해서 사용자가 보고자 하는 부분만 딱딱 보게끔 우리가 그룹핑을 해주는 거예요."
    }
  ]
}
```

…(70 lines omitted — 나머지 7개 case: case-404, case-1504, case-1904, case-1906, case-1907,
case-606, case-304. 전부 "여백을 넓힌다"는 같은 주장을 다른 화면에서 반복한다. 전문은
`.evidence/roundtrip-01/out/07-cases-quality-cramped.json`에 있다)

`case-1908`은 정확히 이 태스크의 히어로 구조(타이틀→본문→버튼)를 지적한 사례라 hero.html의
gap 결정에 직접 인용했다.

### 1-7. `design_cases("option-008")` — 근거 확인용

```json
{
  "kind": "option",
  "node": "…(§1-5의 option-008 노드와 동일 — 생략)",
  "cases": [
    {
      "id": "case-204",
      "video": "MJKb-4dqjVg", "t": "6:57", "url": "https://youtu.be/MJKb-4dqjVg?t=417",
      "problem": "상단 페이지 타이틀 텍스트가 24px로, 헤더의 다른 요소에 비해 존재감이 약하다.",
      "fix": "타이틀 사이즈를 28~32px 정도로 키운다.",
      "stance": "OPTION",
      "quote": "그리고 요거 타이틀 사이즈 몇이지? 24. 타이틀 사이즈 나쁘지 않은데 제가 볼 때는 28이나 32까지 키워도 돼요."
    },
    {
      "id": "case-1701",
      "video": "pCc9GspeYfg", "t": "1:00", "url": "https://youtu.be/pCc9GspeYfg?t=60",
      "problem": "사용자가 접속하자마자 서비스가 무엇인지 단번에 이해해야 하는데, 타이틀 사이즈를 줄이거나 너무 얇게 쓰거나 낯선 폰트를 쓰면 오히려 안 넣느니만 못한 타이틀이 된다.",
      "fix": "타이틀은 약간 투박해 보이더라도 큼지막하고 사용자 눈에 잘 보이도록, 크고 잘 읽히게 넣는다.",
      "stance": "PRESCRIPTIVE",
      "quote": "약간 투박해도 큼지막하고 사용자의 눈에 잘 보이도록 타이틀을 강하게 넣어 줘야 되는데요."
    },
    {
      "id": "case-807",
      "video": "veHfyFTaw9Y", "t": "8:10", "url": "https://youtu.be/veHfyFTaw9Y?t=490",
      "problem": "히어로 타이틀 밑 서브 텍스트 크기가 14px로, 커진 타이틀에 비해 작다.",
      "fix": "서브 텍스트 크기를 16px 정도로 키운다.",
      "stance": "OPTION",
      "quote": "그다음 밑에 폰트 사이즈 14는 좀 작지. 왜냐면 이게 이제 커졌으니까 거기에 대한 밸런스를 좀 맞춰 줘야 되니까 16 정도에 그냥 레귤러 정도.",
      "measured": { "prop": "type-scale", "value": 16, "unit": "px" }
    }
  ]
}
```

…(74 lines omitted — 나머지 4개 case: case-1208, case-1213, case-704, case-1503. 히어로가 아닌
카드 캡션·온보딩 본문 사례라 이번 결정에는 직접 쓰지 않았다. 전문은
`.evidence/roundtrip-01/out/08-cases-option-008.json`에 있다)

### 1-8. `design_cases("rule-001")` — 근거 확인용

```json
{
  "kind": "rule",
  "node": "…(§1-0의 rule-001 노드와 동일 — 생략)",
  "cases": [
    {
      "id": "case-2503",
      "video": "aVEyY--6S2g", "t": "2:57", "url": "https://youtu.be/aVEyY--6S2g?t=177",
      "problem": "배너 본문 텍스트 컬러의 접근성(대비)이 맞지 않는다.",
      "fix": "본문 사이즈를 13에서 14까지 키우고, 컬러도 거의 화이트에 가깝게 되돌린다.",
      "stance": "PRESCRIPTIVE",
      "quote": "본문 컬러 일단 접근성이 안 맞아요. 컬러가 사이즈도 13 말고 14까지 키워야 되고 컬러도 거의 화이트 같은 느낌으로 돌아와야 돼요.",
      "measured": { "prop": "size", "value": 14, "unit": "px" }
    },
    {
      "id": "case-1304",
      "video": "xMb3vvbUNyc", "t": "3:42", "url": "https://youtu.be/xMb3vvbUNyc?t=222",
      "problem": "리서치 결과 아래에 붙은 한 줄짜리 설명 캡션이 옅은 회색으로 거의 안 보일 정도로 흐리다.",
      "fix": "그냥 빼버리거나, 채도를 올리고 폰트 크기를 줄여서 살린다.",
      "stance": "OPTION",
      "quote": "흐려도 너무 어려요 이정도면 은 그냥 보지 말란 소리 거든요"
    }
  ]
}
```

## 2. 생성

`.evidence/roundtrip-01/hero.html` 전문 (주석에 근거 Case/Option/Quality/Rule ID 포함):

```html
<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<title>hero roundtrip-01</title>
<style>
  html, body { margin: 0; padding: 0; }
  body { font-family: system-ui, -apple-system, "Segoe UI", sans-serif; }

  /* section[data-context="hero"]: quality-cramped(답답한) realized_by property=whitespace
     direction=up weight=9 (case-1901, case-404, case-1504, case-1906...) — 답답함을 없애려면
     여백을 넉넉하게 준다. 페이지 배경 자체는 이 절의 조상 배경이라 대비 계산의 기준이 된다. */
  section[data-context="hero"] {
    background-color: #f7f6f3; /* graph silent — 명도 자체는 근거 없음. rule-001 대비 계산용으로만 선택 */
    padding: 96px 64px; /* quality-cramped realized_by(whitespace, up), case-1901 "여백은 너무
      타이트하기보다는 조금 넓게 넓게 넓직 널찍 뛰시는게 좋습니다" */
    display: flex;
    flex-direction: column;
    align-items: center; /* graph silent — option-010(정렬)은 목록·카드 "본문"용 근거(case-1011,
      case-710, case-904)라 히어로 타이틀에는 그대로 적용하지 않음. 관례적 판단으로 중앙 정렬 */
    gap: 32px; /* quality-cramped realized_by(whitespace, up)와 같은 근거를 요소 간 간격에도 적용,
      case-1908 "타이틀과 본문과 버튼에 대한 여백을 충분히 확보해서" */
    text-align: center;
    max-width: 960px;
    margin: 0 auto;
  }

  /* [data-ui="heading"]: option-008 choice "28~32px 이상", when: "들어오자마자 읽혀야 하는
     페이지·히어로 타이틀일 때", recommended:true, cases: case-204, case-1701 */
  [data-ui="heading"] {
    font-size: 32px; /* option-008 recommended choice 상한 */
    font-weight: 700; /* graph silent — option-008/009는 weight를 다루지 않음. 위계 표현을 위한 통상적 선택 */
    line-height: 1.25; /* graph silent — line-height 관련 Rule/Option 없음(스키마상 line-height는
      Case 2건뿐이고 이번 조회 범위 밖) */
    color: #14110d; /* rule-001(contrast >= 4.5) 근거. #f7f6f3 배경 대비 계산상 여유 있게 확보 */
    margin: 0;
  }

  /* [data-ui="text"] (subtitle): option-008 choice "16px", when: "모바일 본문이나 히어로 서브
     텍스트일 때", cases: case-704, case-807, case-1503 */
  [data-ui="text"] {
    font-size: 16px; /* option-008 두 번째 choice, recommended는 아니지만 scope가 히어로 서브 텍스트를
      직접 지목한 유일한 choice */
    line-height: 1.5; /* graph silent */
    color: #4b473f; /* rule-001(contrast >= 4.5) 근거. #f7f6f3 배경 대비 확보 */
    margin: 0;
    max-width: 640px;
  }

  /* [data-ui="button"][data-variant="primary"][data-size="lg"]: option-012(button 다중 배치)는
     버튼이 하나뿐인 이 화면에는 해당 조건("여럿일 때")이 성립하지 않아 적용하지 않음 — graph silent로
     남기고 크기·색만 rule-001로 확보 */
  [data-ui="button"] {
    font-size: 16px; /* graph silent — 버튼 폰트 크기를 다루는 Option/Rule 없음. subtitle과 같은
      스케일로 통일 */
    font-weight: 600; /* graph silent */
    padding: 16px 32px; /* graph silent — rule-002(터치 타겟 44px)는 scope.platform: mobile이라
      platform: web 질의에는 매칭되지 않아 적용 대상이 아님(design_rules button/web 결과에 rule-002
      없음). 다만 값 자체는 44px를 넘겨 두어 충돌 소지를 없앰 */
    border: none;
    border-radius: 8px; /* graph silent — radius를 다루는 Rule/Option이 이 scope에 없음 */
    background-color: #1d4ed8; /* rule-001(contrast >= 4.5) 근거. 흰 글자와의 대비 확보 */
    color: #ffffff;
    cursor: pointer;
  }
  /* rule-003 (focus-visible 상태에서 포커스 링이 보여야 한다), scope: any, promoted_from: []
     (규격 Rule, confidence 0 — 코퍼스 근거는 없지만 WCAG 2.2 SC 2.4.7 표준 근거) */
  [data-ui="button"]:focus-visible {
    outline: 3px solid #1d4ed8;
    outline-offset: 2px;
  }
</style>
</head>
<body>
  <section data-context="hero">
    <h1 data-ui="heading">여유로운 시작, 필요한 만큼만</h1>
    <p data-ui="text">복잡한 설정 없이 바로 시작하세요. 지금 필요한 기능만 남겨 두었습니다.</p>
    <button type="button" data-ui="button" data-variant="primary" data-size="lg">지금 시작하기</button>
  </section>
</body>
</html>
```

**에이전트가 realized_by 중 고른 것**

- `quality-cramped.realized_by[0]`: `property: whitespace, direction: up` — 이게 유일한 후보였다
  (이 Quality는 `realized_by`가 하나뿐이다). section padding 96px/64px와 요소 간 gap 32px로
  적용. 근거: case-1901, case-1908 등 9개 사례.
- `option-008` 세 번째 choice(28~32px, 히어로 타이틀): heading font-size 32px. 근거: case-204,
  case-1701.
- `option-008` 두 번째 choice(16px, 히어로 서브 텍스트): text font-size 16px. 근거: case-704,
  case-807, case-1503.
- `rule-001`(대비 4.5:1 이상): heading·text·button 세 요소 모두 색상 대비를 넉넉히 확보.
- `rule-003`(focus-visible 포커스 링): button `:focus-visible`에 outline 3px solid.

**고르지 않은 것과 이유**

- `option-012`(버튼 여럿 정리법): 전제인 "버튼이 여럿일 때"가 이 화면(버튼 1개)에 성립하지 않는다.
- `option-009`(텍스트 축소): 이 화면은 텍스트를 줄이는 게 아니라 키우는 방향이라 반대 축.
- `option-010`(본문 정렬): 근거 Case가 전부 목록·카드 "본문"용이라 히어로 타이틀/부제에 그대로
  가져다 쓰면 근거를 벗어난다. 중앙 정렬은 그래프 근거가 아니라 관례적 선택으로 남겨 뒀다(주석에
  "graph silent"로 명시).
- `rule-002`(모바일 터치 타겟 44px): `scope.platform: mobile`이라 이번 `platform: web` 질의
  scope 자체에 안 걸린다. 버튼 padding은 넉넉히 뒀지만 이건 그래프가 시킨 게 아니라 상식적 선택이다.
- `design_qualities("과감한")`은 애초에 그래프에 노드가 없어(§0 참조) 시도하지 않았다.

## 3. `design_check` 1회차

`design_check({snapshot_path: ".evidence/roundtrip-01/hero.json"})`

```json
{
  "violations": [],
  "judgments": [],
  "errors": [],
  "evaluated": 4
}
```

`evaluated: 4` — 스냅샷에 담긴 요소 4개(heading·text·button-default·button-focus-visible)
전부에 대해 매칭되는 CHECKABLE Rule을 판정했고 위반이 없었다. `judgments`가 비어 있는 건 이
그래프에 JUDGMENT 등급 Rule이 아예 없기 때문이다(`npm run validate` 결과: 3 rules 전부
CHECKABLE). Option·Quality는 애초에 `design_check`가 판정하지 않는다.

## 4. 수정 · 2회차

1회차에서 violations가 0이라 2회차는 수행하지 않았다(브리프의 "violations가 있으면 고치고
반복" 조건이 성립하지 않음).

## 관찰

- **툴 설명이 부족해 에이전트가 헤맨 지점**: `design_qualities` 설명은 "모르는 형용사면
  found:false와 아는 형용사 목록을 준다"고 적혀 있지만, 실제로 헤매게 만드는 지점은 그 이전
  단계다 — "과감한"처럼 흔히 쓰일 법한 형용사가 그래프에 아예 없다는 사실을 알기 전까지는
  `design_qualities("과감한", ...)`을 그냥 호출해 보는 것 말고는 알아낼 방법이 없다. 5개뿐인
  Quality 목록(그리고 전부 problem 극성이라는 것)을 서버가 리소스나 프롬프트로 미리 노출했다면
  이런 헛질을 막을 수 있었다.
- **조회 결과에 있었으면 좋았을 것**: `design_options`/`design_rules`가 scope로 필터링했다고
  주장하지만, 실제로 컴포넌트 축만 의미 있게 필터링되고(`hero`로 걸었더니 빈 배열, `typo`로
  걸었더니 3개) `context`·`platform` 축은 거의 모든 Option/Rule의 scope가 `any`라 사실상
  무의미했다. 응답에 "이 scope 축은 이 노드에서 `any`라 사실상 안 걸렸다"는 신호가 있었으면
  질의를 좁혀야 하는지 헛수고인지 바로 알 수 있었을 것이다. 또한 `design_options` 응답이
  `[]`일 때 "이 컴포넌트엔 후보가 없다"인지 "scope를 잘못 짰다"인지 구분이 안 된다 — 알려진
  component 어휘 목록이나 근접 매치 제안이 있으면 좋겠다.
- **`design_check`가 잡지 못한 것**: (1) 이 그래프엔 JUDGMENT Rule이 하나도 없어서(§3) 이번
  왕복에서는 judgments 경로 자체가 한 번도 실행되지 않았다 — Option 12개·Quality 5개가 만든
  디자인 결정 대부분(정렬, 여백, 버튼 배치, 텍스트 스케일 방향)을 기계도 사람도 사후 검증할
  방법이 없다. `design_check`는 "규격 위반이 없다"만 확인해 줄 뿐, 여백이 실제로 92px인지
  96px인지, 형용사 "답답한→여유로운"이라는 원래 지시가 실현됐는지는 전혀 보증하지 않는다.
  (2) rule-002(터치 타겟)는 platform 스코프가 안 맞으면 조용히 스킵되는데, 이게 "이 플랫폼엔
  해당 없음"인지 "규칙이 하나 빠졌다"인지 evaluated 카운트만으로는 구분이 안 된다.
- **다음 왕복 전에 고칠 것 (Task 번호로)**:
  - Task 8(승격) 후속: target 극성 Quality가 전부 문턱 미달이라 "과감한·깔끔한·시원한" 같은
    실제 사용자 지시어에 그래프가 답을 못 준다(`docs/schema.md` "승격된 형용사는 전부 problem
    쪽이다" 절과 동일 결함). 코퍼스를 늘리거나 문턱을 낮추는 논의가 필요하다.
  - Task 12(MCP 서버) 후속: `design_options`/`design_rules` 응답에 "이 scope 축은 매칭된
    노드들에서 사실상 `any`뿐이었다"는 메타 정보를 추가하면 좋겠다.
  - Task 12 후속: 알려진 `component` 어휘(`kg/components.yaml`)를 `design_options`/
    `design_rules`의 빈 결과에 힌트로 얹거나, 별도로 조회할 수 있는 툴/리소스로 노출한다.
  - 다음 승격 라운드 후속: JUDGMENT 등급 Rule을 최소 1개 이상 승격해야 `design_check`의
    judgments 경로가 실제로 검증된다(현재는 코드 경로만 있고 왕복으로 확인된 적이 없다).

---

## 부록 — `claude mcp list` (Claude Code 등록 확인)

design-kg 디렉터리에서 비대화형으로 실행한 결과 중 관련 줄:

```
design-kg: npm run -s mcp - ⏸ Pending approval (run `claude` to approve)
```

`.mcp.json`(`/Users/js/Documents/Work/Projects/design-kg/.mcp.json`)은 정상적으로 읽혔고
`design-kg` 서버가 목록에 뜬다. 다만 비대화형 세션이라 프로젝트 MCP 신뢰 승인 프롬프트를
넘길 수 없어 "Pending approval" 상태로 남았다 — 대화형으로 `claude`를 실행해 승인해야
"Connected"로 바뀐다. (참고로 같은 출력에 `/Users/js/Documents/Work/.mcp.json`의 `github` 서버가
`GITHUB_PERSONAL_ACCESS_TOKEN` 누락 경고를 내는데, 이건 이 태스크와 무관한 기존 설정이다.)
