# 승격 로그

Task 8(4단계) 1차 승격. 후보 표는 `.evidence/candidates.md`(영상 3개 이상)와
`.evidence/candidates-min2.md`(2개 이상, 아깝게 못 넘은 것 확인용)이다.
게이트는 `docs/plan.md`의 승격 게이트 절을 따랐고, 실제로 적용한 형태는 `docs/schema.md`에 적었다.

2026-09-11 2차: `RealizedBy.direction`이 `other`를 받도록 스키마를 고쳤다(컨트롤러 판정).
`structure` 계열 조언도 Quality 지식이라는 이유다. 이 변경으로만 달라진 행은 아래 Quality 표에
"2차"로 표시했다. Rule · Option 결정은 그대로다.

이번 라운드는 사람 확정 없이 실행 에이전트가 게이트 규칙대로 판정했다. 행마다 이유를 남겼으니
검수자가 뒤집을 수 있다. 애매하면 Rule보다 Option, Option보다 보류로 내렸다.

## Rule / Option

| 날짜 | 후보 key | 결정 | 목적지 | 이유 |
|---|---|---|---|---|
| 2026-09-11 | image\|structure\|other | 승격 | option-001 · option-002 | 영상 7개, P 2/3/3 → Option. 썸네일 비율(410 302 411 1613 1214)과 이미지 위 오버레이가 서로 다른 질문이라 둘로 쪼갰고, 오버레이 쪽은 image\|color 후보와 합쳐 option-002로 냈다. 1007 · 802 · 1704(3D 구도)는 어느 질문에도 안 붙어 미채택 |
| 2026-09-11 | layout\|structure\|other | 승격 | option-003 | 영상 7개, P 1/2/6 → Option. "쪼갤까 합칠까"에 답하는 412 · 1313 · 1607 · 1410만 담았다. 406(정렬축) · 1508(라인 컨셉) · 1510 · 1702(공통 모듈) · 305(그룹핑)는 각각 다른 질문이라 미채택 |
| 2026-09-11 | nav\|structure\|other | 승격 | option-004 · option-005 | 영상 7개, P 2/2/4 → Option. GNB·탭 합치기(402 1505 509 201)와 필터 위치(011)가 다른 질문이라 둘로 쪼갰다. 011은 Case 하나가 상단형·좌측형 장단점을 다 말해서 두 choice가 같은 Case를 인용한다. 407 · 1006 · 1603은 미채택 |
| 2026-09-11 | card\|structure\|other | 강등 | option-006 | 영상 6개, P 4/1/2 → PRESCRIPTIVE가 나머지 합보다 1 많아 팽팽. Rule 후보였지만 Option으로 내렸다. 카드로 감쌀지(507 1606)만 선택지가 되고 512 · 1402 · 1513 · 905 · 303은 각각 단독 주장이라 미채택 |
| 2026-09-11 | typo\|type-scale\|up | 승격 | option-008 | 영상 6개, P 1/0/6 → Option. measured 13 · 14 · 16 · 16px 불일치라 CHECKABLE 불가. 역할별 목표 크기 세 갈래로 정리했고, 히어로 타이틀 쪽은 PRESCRIPTIVE(1701)가 받쳐서 recommended |
| 2026-09-11 | avatar\|size\|down | 승격 | option-011 | 영상 4개, P 0/0/4 → Option. 24px로 줄이라는 1210과 24px로 키우라는 2504(avatar\|size\|up, PREFERRED)가 같은 값을 가리켜 한 choice로 묶었다. 방향은 반대지만 목표값이 같은 주장이다 |
| 2026-09-11 | typo\|alignment\|other | 승격 | option-010 | 영상 4개, P 0/3/1 → Option. PREFERRED 3건(1011 710 904)이 전부 좌측 정렬이라 그쪽에 recommended. 가운데 정렬 choice는 608이 "폭이 다를 때 가운데 정렬이 깨진다"고 한 것을 뒤집어 조건으로 적었다 |
| 2026-09-11 | typo\|type-scale\|down | 승격 | option-009 | 영상 4개, P 1/1/4 → Option. measured 15 · 20 · 18 · 14px 불일치. 크기를 낮추는 쪽(PREFERRED 711 포함)에 recommended, 굵기·색으로 힘 빼는 쪽을 대안으로 뒀다 |
| 2026-09-11 | any\|structure\|other | 보류 | - | 영상 3개, P 3/1/0으로 게이트상 Rule JUDGMENT였다. 그런데 네 Case가 서로 다른 주장이다 — 1602 · 1610은 상품 상세 정보 누락(같은 영상), 607은 공통 컴포넌트 통일, 909는 흐름선을 곡선으로. 하나의 statement로 묶으면 지어내는 것이 되고, 주장별로 쪼개면 영상 1개짜리다. 반복 3회가 같은 주장의 반복이 아니라 `any` 버킷에 모인 결과라 보류했다 |
| 2026-09-11 | button\|structure\|other | 승격 | option-012 | 영상 3개, P 0/0/4 → Option. 네 Case 모두 "버튼 요소를 줄이거나 낮춘다"는 같은 방향이라 세 갈래로 담았다. recommended 없음(PREFERRED·PRESCRIPTIVE 근거 없음) |
| 2026-09-11 | card\|alignment\|other | 보류 | - | 영상 3개, P 0/2/1로 Option 자격은 됐다. 그런데 208(가운데→좌측 정렬) · 1905(라운드 안쪽 들여쓰기) · 1706(마무리 정렬 점검)이 서로 다른 질문에 답한다. 정렬 방향 주장은 option-010과 같은 내용이라 typo 쪽에서 다루고, 나머지 둘은 선택지가 아니라 단독 주장이다 |
| 2026-09-11 | card\|whitespace\|up | 강등 | option-007 | 영상 3개, P 2/0/1 → PRESCRIPTIVE가 나머지보다 1 많아 팽팽. Option으로 내렸다. 606이 한 문장 안에서 "여백을 과감하게 넓히거나 아니면 카드를 쪼개라"고 두 갈래를 제시해 그대로 choice가 됐다 |
| 2026-09-11 | image\|color\|other | 승격 | option-002 | 영상 3개, P 0/1/2 → Option. image\|structure의 오버레이 Case와 합쳐 한 Option으로 냈다. PREFERRED 1207이 받치는 그라디언트 쪽에 recommended |
| 2026-09-11 | layout\|whitespace\|up | 승격 | option-013 | 영상 3개, P 2/0/2 → PRESCRIPTIVE가 나머지와 같아 팽팽, Option. 여백 그룹핑(1907 1908 1705) · 라인/카드 그룹핑(1907) · 요소 축소(304) 세 갈래 |
| 2026-09-11 | (standard) | 추가 | rule-001 · rule-002 · rule-003 | WCAG 2.2 SC 1.4.3 · SC 2.5.8(+Apple HIG) · SC 2.4.7. 코퍼스 일치 여부와 무관하게 추가하는 세 건이다. 6단계 기본기 판정이 이걸 쓴다 |

`source: corpus` Rule은 0개다. 코퍼스에서 Rule 목적지가 나온 후보 3건 중 둘(card\|structure,
card\|whitespace)은 팽팽으로 강등됐고 하나(any\|structure)는 주장이 안 묶여 보류됐다.
CHECKABLE은 아예 나올 수 없었다 — 영상 3개 이상 후보 가운데 `measured` 값이 일치한 그룹이 하나도 없다.

## 명문 규격 Rule의 코퍼스 인용

| rule | promoted_from | 인용 근거 |
|---|---|---|
| rule-001 (WCAG 1.4.3) | case-2503 · case-1304 | 2503은 "배너 본문 텍스트 컬러의 접근성이 맞지 않는다"로 조항과 직접 맞고, 1304는 옅은 회색 캡션이 거의 안 보인다는 지적이다. 둘 다 대비 수치를 말하지는 않았다 |
| rule-002 (WCAG 2.5.8 + HIG) | case-2103 · case-2104 · case-1903 · case-2007 | 모바일에서 "작아서 누르기 불편하다"는 지적 넷. 다만 **화자가 제시한 값은 28px(2104 · 2501)로 규격의 44px보다 작다.** Rule 값은 규격을 따르고, 이 불일치는 아래 주의에 남긴다 |
| rule-003 (WCAG 2.4.7) | (없음) | 코퍼스에 키보드 포커스를 다룬 Case가 없다. `affordance` Case(1009 · 2304 · 012)는 선택·활성 상태 표시이지 포커스 링이 아니라 인용하지 않았다. `confidence: 0` |

주의: 채널이 말하는 터치 타겟 최소치(28px)와 WCAG 2.5.8(44px)이 어긋난다. `design_check`는 44px로
판정하므로, 이 채널의 28px 조언을 그대로 따른 결과물은 rule-002를 위반한다. 6단계 기본기 지표가
이 충돌을 그대로 드러낼 것이다.

## Quality

동의어 묶기는 아래 표대로 했고, 묶은 뒤 `(property, direction)`별로 서로 다른 영상 수를 다시 셌다.
승격 문턱은 묶은 뒤에도 영상 3개 이상이다.

| 날짜 | 후보 key | 결정 | 목적지 | 이유 |
|---|---|---|---|---|
| 2026-09-11 | problem 큰\|size\|down | 승격 | quality-oversized · realized_by[0] | 영상 7개, weight 9. `부담스러운`을 alias로 묶으면서 case-1401이 붙어 weight 10 |
| 2026-09-11 | problem 큰\|type-scale\|down | 승격 | quality-oversized · realized_by[1] | 영상 4개, weight 6. `부담스러운\|type-scale\|down`(1403 1212)은 이미 같은 Case라 수가 그대로다 |
| 2026-09-11 | problem 부담스러운\|type-scale\|down · size\|down | 병합 | quality-oversized의 alias | 1403 · 1212가 `큰`과 `부담스러운`을 한 Case에서 같이 쓴다. 화자가 같은 지적에 붙인 말이라 같은 노드로 묶었다 |
| 2026-09-11 | problem 작은\|size\|up | 승격 | quality-undersized · realized_by[0] | 영상 6개, weight 6 |
| 2026-09-11 | problem 작은\|type-scale\|up | 승격 | quality-undersized · realized_by[1] | 영상 3개, weight 4 |
| 2026-09-11 | problem 작은\|touch-target\|up | 보류 | - | 영상 2개(2501은 web, 2103 · 2104는 mobile). 묶어도 3개가 안 된다. 내용은 rule-002가 받는다 |
| 2026-09-11 | problem 답답한\|whitespace\|up | 승격 | quality-cramped · realized_by[0] | 영상 5개, weight 7. `빡빡한` · `타이트한` · `촘촘한`을 묶어 영상 6개 · weight 11이 됐다 |
| 2026-09-11 | problem 타이트한\|whitespace\|up | 병합 | quality-cramped | 영상 3개(1509 1901 701)로 단독 승격도 가능했지만 `답답한`과 같은 뜻·같은 (property, direction)이라 한 노드로 합쳤다. 나누면 뜻이 같은 노드가 둘이 된다 |
| 2026-09-11 | problem 빡빡한 · 촘촘한 (whitespace\|up) | 병합 | quality-cramped | 각각 영상 1개였다. 병합으로 1906 · 1908이 추가됐다 |
| 2026-09-11 | problem 빡빡한\|structure\|other | 보류 | - | 영상 2개(case-1607 · case-2101)로 문턱 미달. 2차 스키마 변경 뒤에도 수가 그대로다. `빡빡한`은 quality-cramped의 alias라 그쪽에 항목을 붙이려 해도 영상 2개다 |
| 2026-09-11 | problem 넓은\|whitespace\|down | 승격 | quality-loose · realized_by[0] | 영상 3개, weight 4. `벙벙한`(605)은 alias로만 넣었다 — direction이 `other`라 항목이 못 된다 |
| 2026-09-11 (2차) | problem 복잡한\|structure\|other | 승격 | quality-cluttered · realized_by[0] | 영상 4개, weight 4. 1차에서는 `realized_by.direction`에 `other`가 없어 보류했다. 스키마가 `other`를 받게 되어 승격했다. `혼란스러운`을 묶어 영상 5개 · weight 5 |
| 2026-09-11 (2차) | problem 혼란스러운\|structure\|other | 병합 | quality-cluttered | case-901("오브젝트가 산만하게 떠 있다 → 걷어내고 하나만 남긴다")이 요소를 줄여 구조를 단순화하는 같은 주장이다. 같은 Case의 `약한`은 "힘이 있어 보여야 하는데"라는 다른 읽기라 묶지 않았다. `불분명한`(case-1704)은 이미 같은 Case가 들어와 있어 alias로도 넣지 않았다 |
| 2026-09-11 (2차) | problem 복잡한\|density\|down | 보류 | - | 영상 2개(case-401 · case-613). 방향이 `down`이라 스키마 제약과는 무관하게 문턱 미달이다. 넘겼으면 quality-cluttered가 항목 2개가 됐을 자리다 |
| 2026-09-11 (2차) | target 깔끔한 · 심플한 · 간결한 · 단순한 | 보류 | - | 병합을 검토했다. 묶어도 `hierarchy\|down` 2개(503 307), `color` 2개(910은 down · 2001은 other로 방향도 다름), `size\|down` 1개, `density\|down` 1개, `shadow\|down` 1개, `structure\|other` 1개로 어느 (property, direction)도 영상 3개를 못 넘는다. 형용사는 겹치는데 손대는 속성이 매번 달라서 병합이 수를 못 늘렸다 |
| 2026-09-11 (2차) | target 과감한 · 통일된 · 균형 잡힌 · 타이트한 | 보류 | - | 각각 영상 2개. 1차에서 `통일된\|structure\|other` · `균형 잡힌\|alignment\|other`는 direction 제약에도 걸렸는데, 그 제약이 풀린 뒤에도 영상 수가 모자라 그대로 보류다 |
| 2026-09-11 | problem 강조된 · 두꺼운 · 복잡한(density) | 보류 | - | 각각 영상 2개 |

위 표에서 `깔끔한` 계열은 2차에서 다시 셌다. `other`가 풀리면서 `깔끔한\|alignment\|other`(1) ·
`깔끔한\|structure\|other`(1) · `심플한 · 간결한\|color\|other`(1) · `단순한\|weight\|other`(1)이
후보로 들어왔지만 전부 영상 1개라 결론은 그대로다. `복잡한 ↔ 심플한/깔끔한`이 자연스러운 반대 쌍인데
target 쪽 노드가 없어 quality-cluttered에는 `opposes`를 달지 못했다.

`강한 · 센` 병합은 대상이 없었다. `센`은 saturation·weight에 각 1건, `강한`은 contrast·radius에 각
1건으로 전부 영상 1개이고 (property, direction)도 서로 달라, 묶어도 어떤 항목도 문턱을 못 넘는다.

`opposes`: `quality-oversized ↔ quality-undersized`(size · type-scale의 반대 방향),
`quality-cramped ↔ quality-loose`(whitespace의 반대 방향). 둘 다 polarity가 problem끼리다.
문제 형용사와 짝이 될 target 형용사가 승격되지 않아 problem끼리 이었다.
`quality-cluttered`는 짝이 없다 — 반대는 `심플한`/`깔끔한`인데 그 노드가 안 만들어졌다.

## 반대 방향 쌍과 conflicts_with

찾은 반대 방향 쌍은 셋이다.

| 쌍 | 어디에 있나 |
|---|---|
| `typo\|type-scale\|up` ↔ `typo\|type-scale\|down` | option-008 ↔ option-009 |
| `card·layout\|whitespace\|up` ↔ `card·layout\|whitespace\|down`(영상 2개, 미승격) | option-007 · option-013 ↔ 미승격 |
| `size\|up` ↔ `size\|down` | quality-undersized ↔ quality-oversized (`opposes`로 연결) |

`conflicts_with`는 `Rule`에만 있는 필드다. 이번 라운드의 반대 쌍은 전부 Option 쪽이거나 Quality
쪽이어서 연결할 자리가 없었다. Quality 쌍은 `opposes`로 이었고, Option 쌍은 이 표로만 남긴다.
Option 사이의 충돌을 그래프에 담으려면 `Option.conflicts_with`가 필요하다 — 스키마 확장 후보다.

## 문턱 판정

`docs/plan.md` 4단계 통과 조건은 "Quality 5개 이상, 각각 `realized_by` 2개 이상"이다.
아래는 2차(`direction: other` 허용) 반영 값이다.

| | 1차 | 2차 |
|---|---|---|
| Quality 노드 | 4개 | **5개** (oversized · undersized · cramped · loose · cluttered) |
| `realized_by` 2개 이상 | 2개 | **2개** (oversized · undersized) |
| polarity | problem 4 / target 0 | problem 5 / target 0 |

**노드 수 조건은 넘었고, 항목 수 조건은 여전히 미달이다.** cramped · loose · cluttered가 각 1항목이다.
채우려면 근거 없는 항목을 지어내야 해서 채우지 않았다.

세 노드가 두 번째 항목을 못 채운 사정은 각각 다르다.

- cramped: 동의어 넷을 다 묶어도 두 번째 조합이 `spacing\|up` 영상 2개, `structure\|other` 영상 2개로
  둘 다 하나가 모자란다
- loose: 두 번째 조합이 `line-height\|down` 영상 1개뿐이다
- cluttered: `density\|down`이 영상 2개(case-401 · case-613)로 하나가 모자란다. 스키마 제약이 아니라
  근거 수 문제다

항목 문턱을 영상 2개로 낮춰 다시 계산해도 `realized_by` 2개 이상인 노드는 4개(oversized ·
undersized · cramped · cluttered)로 5개에 못 미친다. 문턱 해석을 바꿔서 넘길 수 있는 상황이 아니다.

`direction: other`를 연 효과는 분명하다. 노드가 하나 늘었고, 코퍼스에서 형용사가 가장 많이 달리는
property(`structure`, Case 60건)가 Quality로 들어올 길이 생겼다. 다만 `structure` 형용사가
영상 3개 이상에서 반복된 조합은 `복잡한` 하나뿐이라, 이번 코퍼스에서 이 변경이 살려낸 후보는 한 건이다.
나머지(`통일된` · `균형 잡힌` · `빡빡한\|structure`)는 제약이 아니라 영상 수에서 걸린다.

후속 판단은 `docs/schema.md`의 "이 코퍼스가 말하는 것과 말하지 않는 것"에 적었다.
