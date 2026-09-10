# Case 추출 가이드

영상 하나를 Case 여러 개로 바꾸는 절차. Task 6이 영상 20개에 이 절차를 반복한다.
추출은 LLM(실행 에이전트)이 초안을 만들고 사람이 검수한다. 자동화 툴을 만들지 않는다.

## 0. 준비

```bash
ID=<영상 ID>
URL="https://www.youtube.com/watch?v=$ID"
mkdir -p .evidence/$ID
```

## 1. 자막

```bash
yt-dlp --skip-download --write-auto-sub --write-sub --sub-lang ko --sub-format vtt \
  -o ".evidence/%(id)s/%(id)s" "$URL"
ls .evidence/$ID/          # <id>.ko.vtt 가 있어야 한다
npm run vtt2txt .evidence/$ID/$ID.ko.vtt > .evidence/$ID/transcript.txt
wc -l .evidence/$ID/transcript.txt
```

자막이 없으면(`ls`에 vtt가 없음) 이 영상은 건너뛰고 `kg/videos.yaml`의 `subtitles: none`으로 고친 뒤 Task 4의 후보 목록에서 대체 영상을 하나 고른다.

## 2. 영상 (프레임 캡처용)

```bash
yt-dlp -f "bv*[height<=720][ext=mp4]/bv*[height<=720]" -o ".evidence/%(id)s/%(id)s.%(ext)s" "$URL"
```

## 3. 지적 지점 찾기

`transcript.txt`를 처음부터 끝까지 읽는다. 다음 신호가 있는 줄을 후보로 표시한다.

| 신호 | 예 |
|---|---|
| 문제 지적 | "여기가 좀 아쉬워요", "이건 잘못됐어요", "답답해 보이죠" |
| 수정 지시 | "이렇게 바꾸면", "키우세요", "여백을 더" |
| 수치 | "44", "8픽셀", "1.5배", "16 정도" |
| 형용사 방향 | "밋밋한데 과감하게", "고급스럽게", "정돈되게", "무거워 보이니 가볍게" |
| 어조 단서 | "무조건", "반드시", "절대" / "~하는 게 좋아요", "낫죠" / "~해볼까요", "취향" |

한 영상에 보통 5~15개가 나온다. 지적 하나 = Case 하나. 같은 지적을 반복해서 말하면 첫 지점 하나만.

## 4. 프레임 캡처

후보마다 화자가 문제를 가리키는 시점(`t`)의 프레임을 뽑는다. before와 after가 다른 시점이면 둘 다.

```bash
T=4:12
ffmpeg -loglevel error -ss "$T" -i .evidence/$ID/$ID.mp4 -frames:v 1 -y .evidence/$ID/$(echo $T | tr -d :).png
```

프레임을 Read 툴로 열어 본다. 자막이 "여기를 이렇게"라고만 말하는 경우 프레임이 있어야 `problem` · `fix`를 쓸 수 있다.

프레임은 `problem`이 말하는 상태를 실제로 보여줘야 한다. 화자가 설명하는 상태(오버레이가 열린 화면 등)가 인용 시점과 다른 시점에 보이면 그 시점의 프레임을 잡고, `t`는 인용문 시점으로 둔다. 상태가 영상에 안 보이면 `problem`은 보이는 것만 쓰고 설명은 `rationale`로 보낸다.

## 5. Case 초안

`kg/cases/<ID>.yaml`에 리스트로 쓴다. ID는 전역 일련번호다. 기존 최댓값 다음 번호부터 쓴다:

```bash
grep -rho "case-[0-9]*" kg/cases | sort -t- -k2 -n | tail -1
```

각 항목:

```yaml
- id: case-NNN
  source: { video: <ID>, t: "m:ss" }
  scope:
    component: button      # button | input | card | list | nav | hero | form | modal | typo | color | layout | icon | image | any
    platform: mobile       # mobile | web | any
    size: any              # sm | md | lg | any
    variant: any           # primary | secondary | ghost | outline | any
    context: any           # list | hero | form | modal | nav | any
  property: touch-target   # spacing | size | color | contrast | hierarchy | touch-target | radius | shadow | motion | type-scale | line-height | alignment | density | whitespace | saturation | weight | structure | interaction | affordance | labeling
  direction: up            # up | down | set | other   — 화자가 값을 키우라/줄이라/특정값으로/구조 변경
  problem: <무엇이 문제였나. 프레임에서 본 것>
  fix: <어떻게 고쳤나 / 고치라고 했나>
  rationale: <왜. 화자가 말한 이유. 없으면 빈 문자열>
  stance: PRESCRIPTIVE     # PRESCRIPTIVE | PREFERRED | OPTION
  quote: <어조 판정 근거가 된 문장 그대로>
  qualities: [밋밋한→과감한]   # 화자가 쓴 형용사. 현재→목표. 없으면 []
  measured: { prop: touch-target, value: 44, unit: px }   # 수치 언급 시에만
  evidence: .evidence/<ID>/0412.png
```

`structure`(레이아웃·정보구조·패턴 선택 — 오버레이 vs 고정 패널, 상단 vs 좌측 필터) · `interaction`(동작·상태 전이·스크롤 등 UI 행동) · `affordance`(눌림·선택 상태가 보이는가) · `labeling`(버튼·라벨 문구)은 JUDGMENT 전용이다. `measured`를 쓰지 않고 `direction`은 `other`로 둔다.

stance 판정 규칙:

| stance | 어미 |
|---|---|
| PRESCRIPTIVE | ~해야 됩니다 · ~하면 안 돼요 · 무조건 · 반드시 · 절대 · 필수 · ~있어야 돼요 · ~하셔야 돼요 · ~해야 돼요 · ~하면 안 되죠 |
| PREFERRED | ~하는 게 좋아요 · 훨씬 낫죠 · 추천드려요 · ~하면 더 · ~하시는 게 · ~하는 게 맞아요/맞죠 · ~하면 좋겠어요 · ~가 낫죠 · ~하시면 돼요 |
| OPTION | ~해볼까요 · ~해도 되고 · 취향이에요 · 이럴 수도 있고 · 상황에 따라 · ~정도로만 · ~해 볼게요/줄여 볼게요 · ~하도록 하고요 · -겠-…-구나(혼잣말, 지시 아님) |

`quote`에 어미가 그대로 들어 있어야 한다. 헷갈리면 낮은 쪽(OPTION)으로 둔다. 규칙이 되기보다 선택지로 남는 게 안전하다.

`~해야겠구나`처럼 -겠-이 붙은 혼잣말은 PRESCRIPTIVE가 아니다. `~해야 돼요`만 PRESCRIPTIVE다.

`qualities`는 화자가 실제로 쓴 평가어만 적는다. 서술형도 센다 — "답답해 보여요" → `답답한`, "정보 계층이 안 잡혀 있다" → `안 잡힌`, "깔끔하게만 잡아 주시면" → `?→깔끔한`. 범위는 같은 지적을 말하는 동안(같은 화제, 인용문 앞뒤 30초 안). 추출자가 느낀 형용사는 적지 않는다. 현재 상태를 안 말했으면 `?→목표`.

`direction`: `measured`가 있고 화자가 "이 값으로"라고 했으면 `set`. "키워라/줄여라"면 `up/down`. 구조·배치 변경이면 `other`.

한 Case = 한 지적. 한 인용문 안에서 크기와 굵기를 같이 말하면(case-013처럼) 하나로 두고 주된 property를 적는다. 한 호흡에 두 지적을 하면(아이콘 크기 + 라벨 문구) 둘로 나눈다. 각 Case의 `fix`는 자기 `quote`에 근거가 있어야 한다.

## 6. 검수 체크리스트

파일을 저장하기 전에 항목마다 확인한다.

- [ ] `t`가 transcript의 해당 줄과 ±5초 안에 있다
- [ ] `quote`가 transcript에 실제로 있는 문장이다 (요약 금지)
- [ ] `problem`은 프레임에서 확인한 것이다. 자막만으로 추정하지 않았다
- [ ] `stance`의 근거 어미가 `quote`에 있다
- [ ] `measured`가 있으면 `quote`에 그 숫자가 있다
- [ ] `qualities`의 형용사가 `quote` 또는 인접 자막에 있다
- [ ] `scope.component`가 목록의 값이다. 모르면 `any`

```bash
npm run validate
```

통과하면 커밋한다. 커밋에 `.evidence/`가 딸려 오지 않았는지 `git status`로 본다.

## 7. 커밋

```bash
git add kg/cases/$ID.yaml
git commit -m "feat(corpus): $ID Case N개 추출"
```
