# DevAX: 랜딩 페이지 구현 계획 v2.2

# 목표 설명
현재의 임시 페이지를 "**DevAX**" (AI 기반 아이디어 시각화 플랫폼)을 위한 완성도 높은 랜딩 페이지로 전환합니다. "Why, What, How" 구조를 사용하여 설득력 있는 스토리를 전달하며, 스크롤에 따라 진화하는 인터랙티브 3D 파티클 엔진으로 시각적 경험을 극대화합니다.

## 사용자 검토 필요
- **컨셉 확인**: "Why(문제) -> 무질서(Chaos)"에서 "How(해결) -> 구조화(Structure)"로 이어지는 시각적 흐름이 의도와 맞는지 확인해 주세요.
- **성능**: 파티클 개수가 많을 경우(2000개 이상) 모바일에서 성능 이슈가 있을 수 있습니다. 우선 고사양으로 구현 후 최적화하겠습니다.

## 변경 제안

### 콘텐츠 레이어 (React/HTML)
`App.jsx`를 단일 화면에서 **스크롤 가능한 긴 페이지**로 변경하고, `framer-motion`을 사용해 텍스트 전환 효과를 적용합니다.

1.  **Hero (What: 무엇인가?)**:
    -   **메인 카피**: "DevAX: AI 기반 아이디어 시각화 플랫폼"
    -   **서브 카피**: "추상적인 생각을 단 몇 초 만에 구체적인 제안으로."
    -   **비주얼**: "이중 고리(Dual Ring)" 파티클 로고 (논리와 창의성의 결합 상징).
2.  **Section 1 (Why: 왜 필요한가?)**:
    -   **주제**: "제안 디자인 작업의 비효율성"
    -   **내용**: RFP의 불친절함 vs PPT 시안의 필요성. 반복적인 리서치와 시간 낭비 강조.
    -   **비주얼**: 파티클이 폭발하며 "**엔트로피/무질서(Chaos)**" 상태가 됨. 무작위 키워드("Research", "Reference", "Time??")가 떠다니는 "아이디어 수프" 연출.
3.  **Section 2 (How: 어떻게 해결하나?)**:
    -   **주제**: "시각화 자동화"
    -   **내용**: 데스크 리서치 자동화, UX 패턴 분석, 구조 정리, 컨셉 시각화.
    -   **비주얼**: 파티클이 다시 모여 "**구조(Structure)**"를 형성. 3D 그리드나 플로우차트 형태로 정렬되며 "혼돈에서 질서로"의 전환을 표현.
    -   **기능 강조**: `Creon` 플러그인 언급.
4.  **Footer**:
    -   CTA: "DevAX 시작하기"
5.  **Refinement Modal (Stitch Style)**:
    -   유저가 프롬프트 입력 시 즉시 이동하지 않고 모달 팝업.
    -   AI가 프롬프트를 분석하여 `Domain`, `Target`, `Style` 등을 미리 제안.
    -   유저가 이를 수정/확인 후 "Generate" 클릭 시 생성 페이지로 이동.

### Generator Page Layout (Stitch Style)
-   **좌측 (LNB) & 상단 (GNB)**: Dark Mode 유지.
-   **중앙 (Canvas/대지)**: Light Mode (White/Light Gray) 기본. 배경색 변경 기능 추가.


### 비주얼 레이어 (Canvas/WebGL)
`App.jsx`의 `ParticleEngine` 업데이트:
-   **스크롤 감지**: 엔진이 `window.scrollY`를 감지하여 현재 `phase`(단계)를 결정합니다.
-   **단계별 효과 (Phases)**:
    -   `Phase 0 (Hero)`: **이중 고리 (Dual Ring)**. 두 개의 고리가 "X"자 형태를 유지하며 함께 회전하도록 동기화.
    -   `Phase 1 (Why)`: **무질서 (Chaos Field)**. 파티클이 무작위로 흩어지며 복잡하게 얽힌 연결선 표현 (문제 상황).
    -   `Phase 2 (How)`: **청사진/그리드 (Blueprint)**. 파티클이 질서 정연한 3D 그리드 또는 플로우차트 형태로 정렬 (해결책).

### 파일 구조 변경
#### [수정] [App.jsx](file:///Users/wonhee.cho/.gemini/antigravity/scratch/sketchon/src/App.jsx)
- `LandingPage` 컴포넌트를 긴 스크롤 섹션 구조로 변경 (`section` 태그 및 `min-height` 활용).
- `ParticleEngine`에 스크롤 위치에 따른 단계 전환 로직(Phase transitions) 추가.
- `RefinementModal` 컴포넌트 추가 및 검색 핸들러에 통합.

#### [수정] [GeneratorPage.jsx](file:///Users/wonhee.cho/.gemini/antigravity/scratch/sketchon/src/pages/GeneratorPage.jsx)
- 레이아웃 구조 변경: Dark Sidebar + Light Canvas Area.

#### [수정] [PreviewCanvas.jsx](file:///Users/wonhee.cho/.gemini/antigravity/scratch/sketchon/src/components/PreviewCanvas.jsx)
- 캔버스 배경색 변경 기능 (`ColorPicker`) 추가.
- 기본 배경색을 밝은 색으로 변경.

#### [수정] [gemini.js](file:///Users/wonhee.cho/.gemini/antigravity/scratch/sketchon/src/lib/gemini.js)
- `analyzePrompt(prompt)`: 프롬프트 분석 및 설정값 추천 API 추가.

## 검증 계획
### 육안 검증
- **스크롤 부드러움**: 스크롤을 위아래로 움직일 때 파티클이 단계별로 부드럽게 전환되는지 확인.
- **반응형 동작**: 모바일 화면에서 섹션이 세로로 잘 쌓이는지, 텍스트 가독성이 유지되는지 확인.
- **테마 조화**: 파티클 배경 위에서도 텍스트가 명확하게 잘 읽히는지 확인.


