# Case coverage — round 1 (Task 6d)

목표: case coverage ≥ 70% (34/48). 이번 라운드에서 5편 추가 후 83% (40/48)로 목표를 초과 달성했다.

> 리뷰 반영: 최초 집계에서 `progress`(캐러셀 페이지 인디케이터를 Progress/Meter/Slider로 오분류)와 `tabs`(하단 내비게이션 아이콘 바를 Tabs로 오분류) 2건을 과대 계상했었다. 프레임을 다시 확인해 해당 Case들의 `scope.component`를 `structure`/`nav`로 정정했고, 아래 수치는 정정 이후 값이다.

## Before / after

| | case coverage | uncovered |
|---|---|---|
| before (Task 6c 종료 시점) | 63% (30/48) | Select, DropdownMenu, ContextMenu, Menubar, Checkbox, CheckboxGroup, RadioGroup, Switch, Progress, Meter, Slider, Accordion, Collapsible, Popover, Tooltip, Tabs, Toaster, Separator |
| after (round 1, 5편 추가, 정정 반영) | **83% (40/48)** | Progress, Meter, Slider, Popover, Tooltip, Tabs, Toaster, Separator |

## Coverage 표 (round 1 이후, 정정 반영)

| kg | ui | cases | videos | promoted |
|---|---|---|---|---|
| button | Button Toggle ToggleGroup | 19 | 12 | - |
| input | Input Textarea NumberField OtpField Autocomplete Combobox Label Fieldset | 6 | 5 | - |
| select | Select DropdownMenu ContextMenu Menubar | 4 | 3 | - |
| checkbox | Checkbox CheckboxGroup RadioGroup Switch | 6 | 3 | - |
| card | Card StatCard PreviewCard | 43 | 17 | - |
| list | ScrollArea | 8 | 5 | - |
| table | Table DataTable | 2 | 1 | - |
| nav | Header Sidebar NavigationMenu Toolbar | 18 | 9 | - |
| modal | Dialog AlertDialog Drawer | 4 | 2 | - |
| popover | Popover | 0 | 0 | - |
| tooltip | Tooltip | 0 | 0 | - |
| tabs | Tabs | 0 | 0 | - |
| accordion | Accordion Collapsible | 3 | 2 | - |
| badge | Badge Tag | 5 | 3 | - |
| avatar | Avatar | 5 | 5 | - |
| progress | Progress Meter Slider | 0 | 0 | - |
| toast | Toaster | 0 | 0 | - |
| form | Form | 2 | 1 | - |
| chart | PieChart | 6 | 3 | - |
| separator | Separator | 0 | 0 | - |
| icon | Icon | 12 | 6 | - |
| hero | - | 11 | 5 | - |
| typo | - | 35 | 19 | - |
| color | - | 0 | 0 | - |
| layout | - | 22 | 12 | - |
| image | - | 18 | 11 | - |
| structure | - | 4 | 2 | - |

case coverage: 83% (40/48)
promoted coverage: 0% (0/48)

## 추가한 5편과 실제로 새로 커버한 컴포넌트

| video | 제목 | 애초 겨냥 | 정정 후 실제 기여 |
|---|---|---|---|
| `x_PIbVmQTh8` | 일주일 만에 다시 컨펌 요청한 2년 차 디자이너 [대략 난감..] [시청자컨펌] #03 | checkbox · select · accordion | checkbox(체크박스 vs 라디오버튼 구조, 터치 타겟), select(터치 타겟), accordion(구조·상호작용), icon(스트로크 두께) |
| `IcWw0O4SorU` | 11년차 디자이너가 리뷰하는 시청자 UXUI디자인..[1편] [시청자컨펌] [Figma] | select | select(누락 옵션, 밸런스), accordion(펼치기 구조), button(강조 위계), card(썸네일 크기, 정렬). **progress는 철회** — 캐러셀이 아니라 아코디언→슬라이드 전환 제안으로, 실제 드래그형 슬라이더가 아니라 `structure`로 재분류 |
| `Wx6xxacZiDY` | 언제까지 느낌으로 디자인을 하실 건가요? [시청자 컨펌] | checkbox · tabs | select(사이즈 일관성), checkbox(위계, 크기), typo(자간). **tabs는 철회** — 프레임 확인 결과 콘텐츠를 전환하는 탭 스트립이 아니라 하단 내비게이션 아이콘 바였기 때문에 `nav`로 재분류 |
| `ahElVueKyRI` | UI디자인을 예술작품으로 만들었네...? [시청자컨펌] [Figma] | progress | icon(사이즈, 불필요한 배경). **progress는 철회** — 프레임 확인 결과 Progress/Meter/Slider가 아니라 캐러셀 페이지 인디케이터(점)였기 때문에 `structure`로 재분류. 이 영상은 결과적으로 progress에 실질적으로 기여하지 못했다 |
| `aVEyY--6S2g` | UXUI 디자인이 망해가는 결정적인 신호 3가지 ｜시청자 디자인 컨펌 #208 | checkbox | checkbox(토글 터치 타겟, 다중 선택 구조), typo(대비/접근성), avatar(사이즈) |

5편에서 총 27개 Case를 추출했다 (video 21: 6, video 22: 7, video 23: 5, video 24: 5, video 25: 4). stance 분포: PRESCRIPTIVE 11 · PREFERRED 8 · OPTION 8. qualities 7건, measured 6건.

## 남은 uncovered: Progress, Meter, Slider, Popover, Tooltip, Tabs, Toaster, Separator

- **Progress/Meter/Slider, Tabs**는 이번 라운드에서 커버했다고 잘못 집계했다가 프레임 재검증으로 철회했다. 이 채널에서 화자가 "인디케이터"라고 부르는 대상은 실제로는 캐러셀/온보딩 페이지네이션 점이고, "탭"이라고 부르는 대상 중 하나는 실제로는 하단 내비게이션 아이콘 바였다 — 둘 다 KG의 좁은 컴포넌트 정의(Progress/Meter/Slider은 값 표시·입력용 바, Tabs는 콘텐츠를 전환하는 탭 스트립)에 맞지 않아 `structure`/`nav`로 재분류했다. 즉 이 채널에서 진짜 Progress/Meter/Slider나 Tabs를 다루는 장면은 이번 라운드에서 확인하지 못했다.
- **Popover, Tooltip, Toaster, Separator**는 라운드 1에서 후보 영상 80여 편의 자막을 `grep`으로 훑었지만 다루는 영상을 찾지 못했다.
  - **팝업(popup)**이라는 단어는 여러 번 나오지만, 문맥을 보면 전부 모달/바텀시트/풀스크린 오버레이(`modal`)를 가리켰다 — 트리거 옆에 붙는 작은 팝오버(Popover)를 가리키는 경우는 없었다.
  - **말풍선**이라는 단어도 몇 번 나오지만, UI 툴팁이 아니라 장식용 스피치버블 그래픽이나 채팅 아이콘을 가리켰다.
  - **토스트/스낵바**, **구분선/디바이더**는 채널 전체 검색에서 사실상 등장하지 않았다.

이 채널은 포트폴리오·앱 리뷰 위주라 폼 컨트롤(select/checkbox/accordion)과 시각 위계(icon/typo/card) 지적은 풍부하지만, 실제 Progress/Slider 입력 바, 콘텐츠 전환용 Tabs, 팝오버·툴팁·토스트·구분선처럼 좁게 정의된 마이크로 UI는 리뷰 대상 화면에 잘 등장하지 않거나 화자가 다른 이름(인디케이터, 탭, 팝업)으로 뭉뚱그려 부르는 경우가 많아 KG 값과 정확히 일치시키기 어려웠다. 다음 라운드에서 이 컴포넌트들을 노린다면 "설정 화면", "폼 유효성 검사 에러", "실제 드래그 슬라이더(가격 범위 등)", "알림/토스트" 같은 더 구체적인 키워드로 후보를 좁히고, 프레임으로 실제 컴포넌트 형태를 먼저 확인한 뒤 골라야 할 것으로 보인다.
