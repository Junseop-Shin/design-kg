# 승격 로그

Task 8(4단계) 1차 승격. 후보 표는 `npm run candidates`(영상 3개 이상)와
`npm run candidates kg 2`(2개 이상, 아깝게 못 넘은 것 확인용)로 다시 뽑는다.
게이트는 `docs/plan.md`의 승격 게이트 절을 따랐고, 실제로 적용한 형태는 `docs/schema.md`에 적었다.

2026-09-11 3차: 리뷰에서 "근거가 뒤집히거나 없는 choice"가 넷 지적돼 고쳤다. 해당 행에 "3차"로
표시했다. 고친 방향은 하나다 — choice의 `label`·`when`이 인용한 Case가 실제로 말한 것을 넘어서면,
choice를 다시 쓰거나 지운다. 지워서 choice가 하나만 남으면 Option 자체를 보류한다.

2026-09-11 2차: `RealizedBy.direction`이 `other`를 받도록 스키마를 고쳤다(컨트롤러 판정).
`structure` 계열 조언도 Quality 지식이라는 이유다. 이 변경으로만 달라진 행은 아래 Quality 표에
"2차"로 표시했다. Rule · Option 결정은 그대로다.

이번 라운드는 사람 확정 없이 실행 에이전트가 게이트 규칙대로 판정했다. 행마다 이유를 남겼으니
검수자가 뒤집을 수 있다. 애매하면 Rule보다 Option, Option보다 보류로 내렸다.

## Rule / Option

| 날짜 | 후보 key | 결정 | 목적지 | 이유 |
|---|---|---|---|---|
| 2026-09-11 (3차 정정) | image\|structure\|other | 승격 | option-001 | 영상 7개, P 2/3/3 → Option. 썸네일 비율을 묻는 410 · 302 · 411 · 1613 · 1214만 담았다. 1007(지도 위 텍스트) · 802(이미지 위 오브젝트) · 1704(3D 구도)는 **미채택**이다 — 셋 다 "이미지 위에 뭘 겹칠까"를 말하지만 그 질문에 답이 한쪽(겹치지 마라)뿐이라 선택지가 안 된다. 1차 로그에 이 셋이 option-002로 갔다고 적었던 것은 오기다. option-002는 image\|color Case만으로 만들었다 |
| 2026-09-11 | layout\|structure\|other | 승격 | option-003 | 영상 7개, P 1/2/6 → Option. "쪼갤까 합칠까"에 답하는 412 · 1313 · 1607 · 1410만 담았다. 406(정렬축) · 1508(라인 컨셉) · 1510 · 1702(공통 모듈) · 305(그룹핑)는 각각 다른 질문이라 미채택 |
| 2026-09-11 (3차) | nav\|structure\|other | 승격 | option-004 · option-005 | 영상 7개, P 2/2/4 → Option. GNB·탭 합치기(402 1505 509 201)와 필터 위치(011)가 다른 질문이라 둘로 쪼갰다. 407 · 1006 · 1603은 미채택 |
| 2026-09-11 (3차) | (option-005 단독) | 문턱 미만 유지 | option-005 | option-005는 Case 하나(case-011, 영상 1개)에 기대고 두 choice가 같은 Case를 인용한다. 승격 문턱(영상 3개)을 넘지 못한다. option-004로 접는 것도 검토했는데 "필터를 어디 둘까"는 "GNB와 탭을 합칠까"의 대안이 아니라 다른 질문이라, 접으면 한 Option 안에 서로 대안이 아닌 choice가 섞인다. `question`에 "(영상 1개 · 문턱 미만, 선택지 서술용)"을 적어 두고 남긴다. 조회 결과를 근거로 쓸 때 이 표시를 봐야 한다 |
| 2026-09-11 (3차) | card\|structure\|other | 강등 후 보류 | - (option-006 결번) | 영상 6개, P 4/1/2 → 팽팽(4 대 3)으로 Rule에서 Option으로 내렸고, 3차에서 Option도 접었다. option-006의 "카드로 감싼다" choice가 인용한 case-507은 정반대를 말한다("카드 디자인 자체가 깔끔한 디자인은 아니다. 카드 UI가 아닌 형태로 가도 된다"). 507을 빼면 그 choice에 근거가 0건이고, 이 후보 안에 카드로 감싸라는 Case가 없다. 남은 choice 하나로는 Option이 성립하지 않아 Case로만 보관한다. 512 · 1402 · 1513 · 905 · 303도 각각 단독 주장이라 미채택 |
| 2026-09-11 | typo\|type-scale\|up | 승격 | option-008 | 영상 6개, P 1/0/6 → Option. measured 13 · 14 · 16 · 16px 불일치라 CHECKABLE 불가. 역할별 목표 크기 세 갈래로 정리했고, 히어로 타이틀 쪽은 PRESCRIPTIVE(1701)가 받쳐서 recommended |
| 2026-09-11 | avatar\|size\|down | 승격 | option-011 | 영상 4개, P 0/0/4 → Option. 24px로 줄이라는 1210과 24px로 키우라는 2504(avatar\|size\|up, PREFERRED)가 같은 값을 가리켜 한 choice로 묶었다. 방향은 반대지만 목표값이 같은 주장이다 |
| 2026-09-11 (3차) | typo\|alignment\|other | 승격 | option-010 | 영상 4개, P 0/3/1 → Option. PREFERRED 3건(1011 710 904)이 전부 좌측 정렬이라 그쪽에 recommended. 가운데 정렬 choice의 `when`은 3차에서 다시 썼다 — 1차에는 "폭이 비슷하고 한두 줄로 짧을 때"라고 적었는데 case-608은 그렇게 말한 적이 없다. 지금은 608이 실제로 지적한 것(폭이 다른 요소를 계속 가운데로 맞추면 좌우 여백이 들쭉날쭉해진다)을 그대로 적고, 그 반대 조건을 `when`으로 둔다 |
| 2026-09-11 (3차) | typo\|type-scale\|down | 승격 | option-009 | 영상 4개, P 1/1/4 → Option. 1차의 두 번째 choice("크기는 두고 굵기와 색으로 힘을 뺀다", 1206 · 1212)는 근거가 없었다 — 두 Case 다 크기와 굵기를 **같이** 낮추라고 하고 이미 첫 choice에 들어 있었다. 지웠다. 대신 option-008과 같은 방식으로 목표 크기를 세 갈래로 다시 짰다(14~15px / 18~20px / 전체 한 단계씩). 세 갈래 전부 그 Case의 measured 값에서 나온다. 대안 후보였던 `typo\|weight\|down`(1002 · 703)은 버튼 텍스트 굵기 이야기라 이 질문에 안 맞아 쓰지 않았다 |
| 2026-09-11 | any\|structure\|other | 보류 | - | 영상 3개, P 3/1/0으로 게이트상 Rule JUDGMENT였다. 그런데 네 Case가 서로 다른 주장이다 — 1602 · 1610은 상품 상세 정보 누락(같은 영상), 607은 공통 컴포넌트 통일, 909는 흐름선을 곡선으로. 하나의 statement로 묶으면 지어내는 것이 되고, 주장별로 쪼개면 영상 1개짜리다. 반복 3회가 같은 주장의 반복이 아니라 `any` 버킷에 모인 결과라 보류했다 |
| 2026-09-11 (3차) | button\|structure\|other | 승격 | option-012 | 영상 3개, P 0/0/4 → Option. 세 갈래다 — 706은 가로로 나란한 버튼을 **세로로 쌓으라**는 것이고(1차 로그에 "축소"로 뭉뚱그린 것은 오기), 601 · 801은 인접 요소와 합쳐 버튼 수를 줄이는 것, 707은 텍스트형 버튼에서 아이콘·언더라인을 빼는 것이다. 707 choice의 label도 3차에서 Case 내용에 맞게 고쳤다. recommended 없음 |
| 2026-09-11 | card\|alignment\|other | 보류 | - | 영상 3개, P 0/2/1로 Option 자격은 됐다. 그런데 208(가운데→좌측 정렬) · 1905(라운드 안쪽 들여쓰기) · 1706(마무리 정렬 점검)이 서로 다른 질문에 답한다. 정렬 방향 주장은 option-010과 같은 내용이라 typo 쪽에서 다루고, 나머지 둘은 선택지가 아니라 단독 주장이다 |
| 2026-09-11 | card\|whitespace\|up | 강등 | option-007 | 영상 3개, P 2/0/1 → PRESCRIPTIVE가 나머지보다 1 많아 팽팽. Option으로 내렸다. 606이 한 문장 안에서 "여백을 과감하게 넓히거나 아니면 카드를 쪼개라"고 두 갈래를 제시해 그대로 choice가 됐다 |
| 2026-09-11 (3차 정정) | image\|color\|other | 승격 | option-002 | 영상 3개, P 0/1/2 → Option. 009 · 1507(오버레이를 걷어낸다)과 1207(텍스트가 얹히는 만큼만 그라디언트)로 두 갈래. PREFERRED 1207 쪽에 recommended. image\|structure Case를 합쳤다고 적었던 1차 기록은 오기다 |
| 2026-09-11 | layout\|whitespace\|up | 승격 | option-013 | 영상 3개, P 2/0/2 → PRESCRIPTIVE가 나머지와 같아 팽팽, Option. 여백 그룹핑(1907 1908 1705) · 라인/카드 그룹핑(1907) · 요소 축소(304) 세 갈래 |
| 2026-09-11 | (standard) | 추가 | rule-001 · rule-002 · rule-003 | WCAG 2.2 SC 1.4.3 · SC 2.5.8(+Apple HIG) · SC 2.4.7. 코퍼스 일치 여부와 무관하게 추가하는 세 건이다. 6단계 기본기 판정이 이걸 쓴다 |

집계(3차 기준): 후보 14건 중 **승격 10 · 강등 1 · 보류 3**이다. 강등은 card\|whitespace(→option-007)
하나이고, 보류는 any\|structure · card\|alignment · card\|structure(강등 후 보류) 셋이다.
여기에 규격 Rule 3건을 더한다. Option 12개의 출처는 승격 10건이 만든 11개(nav 후보 하나가 둘을
낳았다)에 강등 1건이 만든 option-007을 더한 것이다.

`source: corpus` Rule은 0개다. 코퍼스에서 Rule 목적지가 나온 후보 3건 중 하나(card\|whitespace)는
팽팽으로 강등돼 Option이 됐고, 나머지 둘(card\|structure · any\|structure)은 보류됐다.
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
| 2026-09-11 (3차) | problem 답답한\|whitespace\|up | 승격 | quality-cramped · realized_by[0] | 영상 5개, weight 7. `빡빡한` · `촘촘한`을 묶어 영상 5개 · weight 9다. 1차에는 `타이트한`까지 묶어 영상 6개 · weight 11이었는데, 3차에서 `타이트한`을 빼면서 case-1509 · case-701이 빠졌다 |
| 2026-09-11 (3차) | problem 타이트한\|whitespace\|up | 보류 | - | 영상 3개(1509 1901 701)로 문턱은 넘는다. 그런데 `타이트한`은 이 코퍼스에서 문제 쪽(타이트한→?)과 목표 쪽(넓은→타이트한, case-1010 · case-805) 양쪽으로 쓰인다. 1차에서 quality-cramped의 alias로 묶었다가 3차에서 뺐다 — 그대로 두면 "타이트하게 해 주세요"라는 목표 지시에 여백을 넓히라는 정반대 답이 나간다. 목표 쪽으로 노드를 만들자니 `타이트한\|whitespace\|down`이 영상 2개(1010 805)로 문턱 미달이다. 양쪽 다 승격하지 않고 Case로만 보관한다 |
| 2026-09-11 | problem 빡빡한 · 촘촘한 (whitespace\|up) | 병합 | quality-cramped | 각각 영상 1개였다. 병합으로 1906 · 1908이 추가됐다. 둘 다 문제 쪽으로만 쓰여 `타이트한`과 달리 극성 충돌이 없다 |
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
`넓은 ↔ 타이트한`이 코퍼스에서 실제로 쓰인 짝인데(case-1010 · case-805의 `넓은→타이트한`)
`타이트한`이 승격되지 않아 `quality-loose`의 반대는 `quality-cramped`로 뒀다.
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
아래는 3차까지 반영한 값이다.

| | 1차 | 2차 (`other` 허용) | 3차 (`타이트한` 분리) |
|---|---|---|---|
| Quality 노드 | 4개 | 5개 | **5개** (oversized · undersized · cramped · loose · cluttered) |
| `realized_by` 2개 이상 | 2개 | 2개 | **2개** (oversized · undersized) |
| polarity | problem 4 / target 0 | problem 5 / target 0 | problem 5 / target 0 |
| cramped 근거 | 영상 6 · weight 11 | 영상 6 · weight 11 | **영상 5 · weight 9** |

3차에서 노드 수와 항목 수는 그대로이고 cramped의 근거만 줄었다. `타이트한`(case-1509 · case-701)이
빠졌기 때문이다.

**노드 수 조건은 넘었고, 항목 수 조건은 여전히 미달이다.** cramped · loose · cluttered가 각 1항목이다.
채우려면 근거 없는 항목을 지어내야 해서 채우지 않았다.

세 노드가 두 번째 항목을 못 채운 사정은 각각 다르다.

- cramped: 동의어 셋(`답답한` · `빡빡한` · `촘촘한`)을 다 묶어도 두 번째 조합이 `spacing\|up` 영상 2개,
  `structure\|other` 영상 2개로 둘 다 하나가 모자란다. `타이트한`을 뺀 것은 여기에 영향이 없다 —
  그 Case(501)는 `빡빡한` · `촘촘한`으로도 들어와 있다
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
