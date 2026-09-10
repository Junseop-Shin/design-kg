# Case coverage — round 1 (Task 6d)

목표: case coverage ≥ 70% (34/48). 이번 라운드에서 5편 추가 후 92% (44/48)로 목표를 초과 달성했다.

## Before / after

| | case coverage | uncovered |
|---|---|---|
| before (Task 6c 종료 시점) | 63% (30/48) | Select, DropdownMenu, ContextMenu, Menubar, Checkbox, CheckboxGroup, RadioGroup, Switch, Progress, Meter, Slider, Accordion, Collapsible, Popover, Tooltip, Tabs, Toaster, Separator |
| after (round 1, 5편 추가) | **92% (44/48)** | Popover, Tooltip, Toaster, Separator |

## Coverage 표 (round 1 이후)

| kg | ui | cases | videos | promoted |
|---|---|---|---|---|
| button | Button Toggle ToggleGroup | 19 | 12 | - |
| input | Input Textarea NumberField OtpField Autocomplete Combobox Label Fieldset | 6 | 5 | - |
| select | Select DropdownMenu ContextMenu Menubar | 4 | 3 | - |
| checkbox | Checkbox CheckboxGroup RadioGroup Switch | 6 | 3 | - |
| card | Card StatCard PreviewCard | 43 | 17 | - |
| list | ScrollArea | 8 | 5 | - |
| table | Table DataTable | 2 | 1 | - |
| nav | Header Sidebar NavigationMenu Toolbar | 17 | 8 | - |
| modal | Dialog AlertDialog Drawer | 4 | 2 | - |
| popover | Popover | 0 | 0 | - |
| tooltip | Tooltip | 0 | 0 | - |
| tabs | Tabs | 1 | 1 | - |
| accordion | Accordion Collapsible | 3 | 2 | - |
| badge | Badge Tag | 5 | 3 | - |
| avatar | Avatar | 5 | 5 | - |
| progress | Progress Meter Slider | 4 | 2 | - |
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
| structure | - | 0 | 0 | - |

case coverage: 92% (44/48)
promoted coverage: 0% (0/48)

## 추가한 5편과 겨냥 컴포넌트

| video | 제목 | 겨냥 | 실제로 친 컴포넌트 |
|---|---|---|---|
| `x_PIbVmQTh8` | 일주일 만에 다시 컨펌 요청한 2년 차 디자이너 [대략 난감..] [시청자컨펌] #03 | checkbox · select · accordion | checkbox(체크박스 vs 라디오버튼), select, accordion, icon |
| `IcWw0O4SorU` | 11년차 디자이너가 리뷰하는 시청자 UXUI디자인..[1편] [시청자컨펌] [Figma] | select | select, accordion, progress(슬라이더 제안), button, card |
| `Wx6xxacZiDY` | 언제까지 느낌으로 디자인을 하실 건가요? [시청자 컨펌] | checkbox · tabs | select, checkbox, tabs, typo |
| `ahElVueKyRI` | UI디자인을 예술작품으로 만들었네...? [시청자컨펌] [Figma] | progress | progress(배너/온보딩 인디케이터), icon |
| `aVEyY--6S2g` | UXUI 디자인이 망해가는 결정적인 신호 3가지 ｜시청자 디자인 컨펌 #208 | checkbox | checkbox(토글·다중선택), typo, avatar |

5편에서 총 27개 Case를 추출했다 (video 21: 6, video 22: 7, video 23: 5, video 24: 5, video 25: 4).

## 남은 uncovered: Popover, Tooltip, Toaster, Separator

라운드 1에서 후보 영상 80여 편의 자막을 `grep`으로 훑었지만(select·checkbox·tabs·accordion·progress 관련 키워드는 다수 확인, popover·tooltip·toast·separator 키워드는 채널 전체에서 거의 등장하지 않음) 이 네 컴포넌트를 다루는 영상을 찾지 못했다.

- **팝업(popup)**이라는 단어는 여러 번 나오지만, 문맥을 보면 전부 모달/바텀시트/풀스크린 오버레이(`modal`)를 가리켰다 — 트리거 옆에 붙는 작은 팝오버(Popover)를 가리키는 경우는 없었다.
- **말풍선**이라는 단어도 몇 번 나오지만, UI 툴팁이 아니라 장식용 스피치버블 그래픽이나 채팅 아이콘을 가리켰다.
- **토스트/스낵바**, **구분선/디바이더**는 채널 전체 검색에서 사실상 등장하지 않았다.

이 채널은 포트폴리오·앱 리뷰 위주라 폼 컨트롤(select/checkbox/tabs/accordion)과 온보딩 캐러셀(progress) 지적은 풍부하지만, 팝오버·툴팁·토스트·구분선처럼 순간적으로 나타났다 사라지는 마이크로 UI는 리뷰 대상 화면 스크린샷/프로토타입에 잘 남지 않아 화자가 짚을 기회 자체가 적은 것으로 보인다. 다음 라운드에서 이 네 컴포넌트를 노린다면 "설정 화면", "폼 유효성 검사 에러", "알림/토스트" 같은 키워드로 새 채널이나 이 채널의 실무 튜토리얼(강좌형) 영상까지 넓혀야 할 가능성이 있다.
