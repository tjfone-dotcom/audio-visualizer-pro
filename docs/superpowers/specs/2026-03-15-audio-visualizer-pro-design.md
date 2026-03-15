# Audio Visualizer Pro - Design Specification

## Context

사용자가 음원 파일을 업로드하면 전문 오디오 플레이어 스타일의 시각화 화면과 디지털 믹싱 콘솔 스타일의 라이브 비주얼라이저를 보여주는 웹 애플리케이션. 시각화 영역을 HD 동영상(1280x720, 24fps)으로 녹화하는 기능도 포함한다.

## Tech Stack

| 영역 | 기술 |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS |
| Audio | Web Audio API (AnalyserNode) |
| Player UI | HTML/CSS 애니메이션 (평시) + Canvas 2D (녹화시) |
| Visualizers | Canvas 2D |
| Recording | MediaRecorder API (WebM) + FFmpeg WASM (MP4 변환) |
| AI Album Art | Google Gemini Imagen API (음악 특성 분석 기반 프롬프트 자동 생성) |
| State | useReducer + React Context |

## Layout

전체 시각화 영역은 1280x720 (16:9 HD) 크기이며 좌우 50:50으로 분할한다.

```
┌───────────────────┬───────────────────┐
│  MAIN PLAYER      │  MIXING CONSOLE   │
│  (640 x 720)      │  (640 x 720)      │
│                   │                   │
│  ┌─────────────┐  │ ┌───────┬───────┐ │
│  │   Album     │  │ │ Level │  RTA  │ │
│  │    Art      │  │ │ Meter │ Graph │ │
│  │   Record    │  │ │       │       │ │
│  │  (spinning) │  │ ├───────┼───────┤ │
│  └─────────────┘  │ │Spectro│ Wave  │ │
│                   │ │ gram  │ form  │ │
│  ┌────────┐       │ │       │       │ │
│  │Tonearm │       │ └───────┴───────┘ │
│  └────────┘       │                   │
│                   │                   │
│  [Track Info]     │ [Console Labels]  │
└───────────────────┴───────────────────┘
         1280px x 720px

┌─────────────────────────────────────────┐
│  USER CONTROLS (녹화 영역 외부)           │
│  [파일업로드] [자켓업로드] [스타일선택]     │
│  [▶ Play][⏸ Pause][⏹ Stop] [🔊 Vol] [🎥 Rec]│
│  [AI 앨범아트 생성] [MP4 변환] [다운로드]       │
└─────────────────────────────────────────┘
```

- 왼쪽 640x720: 메인 플레이어 시각화 (턴테이블 / CD / 카세트)
- 오른쪽 640x720: 믹싱 콘솔 비주얼라이저 (2x2 그리드, 각 320x360)
- 하단: 사용자 컨트롤 (녹화 영역에 포함되지 않음)

### Track Info (플레이어 영역 하단)

파일명, 현재 시간 / 전체 시간, 프로그레스 바 표시.

### Console Labels (콘솔 영역)

각 비주얼라이저 셀의 좌상단에 작은 라벨: "LEVEL", "RTA", "SPECTROGRAM", "WAVEFORM". 디지털 콘솔 폰트 스타일 (monospace, 밝은 색상).

### Visual Theme

- **기본 테마**: 다크 배경 (`#0a0a0a` ~ `#1a1a1a`)
- **콘솔 색상**: Level Meter (초록→노랑→빨강 그라데이션), RTA (시안), Spectrogram (viridis 컬러맵), Waveform (라임그린)
- **플레이어 색상**: 각 스타일에 맞는 리얼리스틱 색상 (턴테이블 우드톤, CD 실버/블루, 카세트 블랙/크롬)
- **폰트**: 시스템 모노스페이스 + sans-serif

### Responsive Strategy

1280x720 시각화 영역은 고정 크기. 뷰포트가 작으면 `transform: scale()`로 축소하여 화면에 맞춘다. 컨트롤 패널은 시각화 영역 아래에 자연스럽게 배치. 최소 뷰포트: 800px 너비.

## Architecture: Dual-Mode Rendering

### 핵심 개념

평소 사용자가 음악을 재생할 때는 HTML/CSS 애니메이션으로 플레이어 UI를 표시하고 (GPU 가속, 부드러운 CSS 트랜지션), 녹화 시에는 전체 1280x720 Canvas로 전환하여 `captureStream(24)`로 안정적으로 녹화한다.

```
                     ┌─ Normal Mode ─→ HTML/CSS Player + Canvas Console
PlayerGeometry ──────┤
(공유 좌표/크기/각도) └─ Record Mode ──→ Full Canvas (Player + Console)
```

### 왜 듀얼 모드인가

| 비교 | Canvas-Only | DOM 래스터화 | **듀얼 모드** |
|---|---|---|---|
| 플레이어 UI 품질 | 중 | 상 | **상** |
| 녹화 안정성 | 상 | 하 | **상** |
| 개발 효율 | 하 | 상 | 중 |
| 성능 | 상 | 하 | **상** |

## Application State

```typescript
interface AppState {
  playbackState: 'idle' | 'loading' | 'playing' | 'paused' | 'stopped';
  playerStyle: 'turntable' | 'cd' | 'cassette';
  animationPhase: 'closed' | 'opening' | 'open' | 'playing' | 'closing';
  animationProgress: number; // 0-1
  audioFile: File | null;
  audioDuration: number;
  currentTime: number;
  volume: number; // 0-1
  albumArtUrl: string | null;
  albumArtSource: 'user' | 'ai' | null;
  recordingState: 'idle' | 'recording' | 'processing' | 'done';
  recordedBlob: Blob | null;
  aiPrompt: string;
  aiGenerating: boolean;
  error: { type: 'audio' | 'recording' | 'ai' | 'ffmpeg'; message: string } | null;
}
```

`useReducer` + React Context로 관리. 별도 상태 관리 라이브러리 불필요.

### Animation Phase 상태 전이

```
closed ──[Play]──→ opening ──[auto]──→ open ──[auto]──→ playing
                                                           │
playing ──[Pause]──→ open (회전 정지, 위치 유지)             │
open ────[Play]───→ playing (다시 회전 시작)                 │
playing ──[Stop]──→ closing ──[auto]──→ closed              │
open ────[Stop]───→ closing ──[auto]──→ closed              │
*any* ──[Style변경]──→ closing ──[auto]──→ closed ──→ (새 스타일로 시작)
```

### Error Handling

- **오디오 디코딩 실패**: error state 설정 + "지원하지 않는 오디오 형식" 메시지 표시
- **녹화 실패**: MediaRecorder 에러 시 녹화 중단 + error state
- **AI API 에러**: error state + 구체적 에러 메시지 (401/429/500)
- **FFmpeg 실패**: 변환 중단 + error state, WebM 원본은 유지

## Audio Processing Pipeline

```
User uploads file
  → URL.createObjectURL(file) → <audio> element (hidden)
  → createMediaElementSource()
  → AnalyserNode(s) → GainNode → AudioContext.destination
                          ↓
            getFrequencyData() / getTimeDomainData()
                          ↓
            AnimationController (rAF loop)
                          ↓
          ┌───────────────┴───────────────┐
          ↓                               ↓
  ConsoleRenderer                 Player animation
  (Canvas 2D)                     state update
```

### AudioEngine (standalone class)

**`<audio>` 엘리먼트 + `createMediaElementSource` 방식 채택.** `AudioBufferSourceNode`는 일회용이라 pause/seek가 불가능하므로, `<audio>` 엘리먼트를 소스로 사용하여 네이티브 pause/seek/loop를 지원한다.

```
<audio> element (hidden)
  → createMediaElementSource()
  → AnalyserNode (Level Meter, smoothing: 0.8)
  → AnalyserNode (RTA, smoothing: 0.5)
  → AnalyserNode (Spectrogram, smoothing: 0.0)
  → AnalyserNode (Waveform, time-domain)
  → GainNode (volume control)
  → AudioContext.destination
```

- 각 비주얼라이저는 자신의 전용 `AnalyserNode`에서 직접 데이터를 읽음 (공유 AudioData 객체 대신)
- `fftSize = 2048` (1024 frequency bins)
- `<audio>.play()` / `.pause()` / `.currentTime = n` 으로 재생 제어
- `GainNode.gain.value`로 볼륨 제어
- 녹화 시 오디오 스트림: `AudioContext.createMediaStreamDestination()`에 GainNode 출력도 연결

## Player Styles

### 1. Turntable (턴테이블)

**플레이 시퀀스:**
1. `closed → opening`: 레코드판이 아래에서 부드럽게 올라옴 (0.8s ease-out)
2. `opening → open`: 톤암이 레코드판 위로 이동 (0.6s ease-in-out)
3. `open → playing`: 레코드판 회전 시작 (1회전/5초, 느리고 우아한 회전)
   - CSS: `animation: spin 5s linear infinite`
   - Canvas: `discRotation += (360 / 5) * deltaTime` (초 단위)

**구성 요소:**
- 레코드판 (vinyl record): 앨범 아트가 중앙 라벨에 표시
- 톤암 (tonearm): 회전축 기준 호 운동
- 턴테이블 플래터 배경

### 2. CD Player (CD 플레이어)

**플레이 시퀀스:**
1. `closed → opening`: CD가 슬롯에서 부드럽게 올라옴 (0.8s ease-out)
2. `opening → open`: CD 주변 무드등 점등 (0.5s glow animation)
3. `open → playing`: CD 회전 시작 (1회전/5초, 느리고 우아한 회전), 무드등 유지
   - CSS: `animation: spin 5s linear infinite`
   - Canvas: `discRotation += (360 / 5) * deltaTime`

**구성 요소:**
- CD 디스크: 앨범 아트 표시, 홀로그래픽 반사 효과
- 무드등: CSS box-shadow glow, 색상은 앨범 아트에서 추출 가능
- CD 플레이어 바디

### 3. Cassette Player (카세트 플레이어)

**플레이 시퀀스:**
1. `closed → opening`: 카세트 테이프가 부드럽게 올라옴 (0.8s ease-out)
2. `opening → open`: 릴 베이스 무드등 점등 (0.5s glow)
3. `open → playing`: 릴 베이스 회전 시작, 좌측 릴에서 우측 릴로 테이프 이동 표현
   - 기본 속도: 1회전/2초 (30 RPM)
   - 공급 릴(좌): 시작 빠르게 → 점점 느리게 (테이프 소진)
   - 수용 릴(우): 시작 느리게 → 점점 빠르게 (테이프 감김)
   - `currentTime / duration` 비율로 속도 변화

**구성 요소:**
- 카세트 테이프 하우징: 앨범 아트 라벨
- 좌/우 릴 베이스: 회전 애니메이션
- 무드등: 릴 베이스 주변 glow

### Animation 공유 구조

```typescript
interface PlayerGeometry {
  // 공통 계산 결과 - CSS와 Canvas 양쪽에서 사용
  discPosition: { x: number; y: number };
  discRadius: number;
  discRotation: number; // degrees
  artPosition: { x: number; y: number; size: number };
  // 스타일별 추가 속성
  tonearmAngle?: number;
  glowIntensity?: number;
  reelLeftRotation?: number;
  reelRightRotation?: number;
}
```

## Mixing Console Visualizers

오른쪽 640x720 영역을 2x2 그리드로 분할 (각 320x360).

| 위치 | 비주얼라이저 | 설명 |
|---|---|---|
| 좌상 | Level Meter | 다채널 VU/Peak 미터. 세로 바 형태 |
| 우상 | RTA (Real-Time Analyzer) | 주파수 대역별 바 그래프 |
| 좌하 | Spectrogram | 시간-주파수 히트맵 (왼쪽으로 스크롤) |
| 우하 | Waveform | 오실로스코프 스타일 실시간 파형 |

### Visualizer Interface

```typescript
interface VisualizerRenderer {
  resize(width: number, height: number): void;
  render(ctx: CanvasRenderingContext2D, analyser: AnalyserNode, timestamp: number): void;
}
```

각 비주얼라이저는 자신의 전용 `AnalyserNode`를 직접 참조하여 데이터를 읽는다. 이렇게 하면 smoothing 설정이 다른 AnalyserNode를 각각 사용할 수 있다.

### Spectrogram 최적화

`ImageData` 버퍼를 사용해 매 프레임 왼쪽으로 1px 스크롤하고 오른쪽 끝에 새 컬럼을 그린다. 전체를 매 프레임 다시 그리는 것보다 효율적.

## Recording Pipeline

```
Record 버튼 클릭
  → RecordingManager.start()
  → VisualizationArea를 "recording mode"로 전환:
      - HTML 플레이어 레이어 숨김
      - 1280x720 풀 Canvas 표시
      - FullCanvasRenderer가 플레이어 + 콘솔 모두 그림
  → canvas.captureStream(24) → videoStream
  → AudioContext.createMediaStreamDestination() → audioStream
  → 합성: new MediaStream([
      ...videoStream.getVideoTracks(),
      ...audioStream.getAudioTracks()
    ])
  → MediaRecorder(combinedStream, { mimeType: 'video/webm;codecs=vp9,opus' })
  → VP9 미지원 시 폴백: 'video/webm;codecs=vp8,opus'
  → 정지 시 Blob 생성 → WebM 다운로드
  → 선택: FFmpegConverter.toMP4(blob) → MP4 다운로드
```

### FFmpeg WASM

- `@ffmpeg/ffmpeg` 사용, 지연 로딩 (dynamic import)
- WASM 바이너리 ~25MB, 첫 로드 시 프로그레스 표시
- `SharedArrayBuffer` 지원 시 멀티스레드, 아닐 시 싱글스레드 폴백
- `Cross-Origin-Isolation` 헤더 필요 (Vite 설정)

## AI Album Art (Google Gemini Imagen)

### 음악 특성 분석 → 프롬프트 자동 생성

Web Audio API의 AnalyserNode 데이터를 활용해 음악의 특성을 분석하고, 이를 기반으로 이미지 생성 프롬프트를 자동 작성한다.

**분석 항목:**
1. **에너지 레벨**: 주파수 데이터의 평균 진폭 → 활기찬/차분한
2. **저음 비중**: 저주파(20-250Hz) 대역 에너지 비율 → 베이스 중심/고음 중심
3. **주파수 분포**: 에너지가 집중된 대역 → 장르 힌트 (저음=힙합/EDM, 중음=보컬, 고음=클래식)
4. **다이내믹 레인지**: 음량 변화의 폭 → 드라마틱/일정한
5. **템포 추정**: 에너지 피크 간격 분석 → BPM 근사치

**프롬프트 생성 로직:**

```typescript
// ai/musicAnalyzer.ts
interface MusicCharacteristics {
  energy: 'high' | 'medium' | 'low';
  bassWeight: 'heavy' | 'balanced' | 'light';
  dominantRange: 'bass' | 'mid' | 'treble';
  dynamicRange: 'wide' | 'narrow';
  estimatedBPM: number;
  mood: string; // 분석 결과 종합
}

function analyzeMusicCharacteristics(analyserNode: AnalyserNode): MusicCharacteristics;
function generatePromptFromCharacteristics(chars: MusicCharacteristics, userHint?: string): string;
```

**프롬프트 예시:**
- 고에너지 + 헤비베이스 + 빠른 BPM → "Album cover art: Vibrant neon cityscape at night, electric energy, bold geometric shapes, dynamic movement, vivid colors"
- 저에너지 + 가벼운 베이스 + 느린 BPM → "Album cover art: Serene watercolor landscape, soft pastels, gentle morning light, minimalist composition"

**사용자 힌트**: 사용자가 선택적으로 키워드를 입력하면 분석 결과와 결합하여 프롬프트에 반영.

### Gemini Imagen API 호출

```typescript
// ai/albumArtGenerator.ts
async function generateAlbumArt(
  prompt: string,
  apiKey: string
): Promise<string> {
  // Google Gemini Imagen API (generateImages endpoint)
  // base64 응답으로 CORS 이슈 회피 (canvas taint 방지)
  // 반환: data:image/png;base64,... URL
}
```

- **API**: Google AI Studio의 Gemini Imagen (imagen-3.0-generate-002 등)
- API 키는 사용자가 UI에서 입력, 메모리에만 보관 (비저장)
- 보안 경고 UI 표시
- 이미지 크기: 1024x1024, 원형으로 clip하여 앨범 아트에 적용
- 분석은 재생 시작 후 수 초간의 오디오 데이터를 샘플링하여 수행

## File Structure

```
src/
  main.tsx
  App.tsx

  state/
    AppContext.tsx          // React Context + useReducer
    appReducer.ts          // Reducer, action types
    actions.ts             // Action creators

  audio/
    AudioEngine.ts         // Web Audio API wrapper
    audioUtils.ts          // Decode helpers

  animation/
    AnimationController.ts // rAF loop, 렌더링 조율
    PlayerGeometry.ts      // 공유 기하학 계산
    easings.ts             // Easing functions

  player/
    PlayerArea.tsx         // 플레이어 스타일 전환 컨테이너
    TurntablePlayer.tsx    // HTML/CSS 턴테이블
    CDPlayer.tsx           // HTML/CSS CD 플레이어
    CassettePlayer.tsx     // HTML/CSS 카세트
    playerAnimations.css   // 공통 키프레임

  console/
    ConsoleCanvas.tsx      // 콘솔 Canvas React wrapper
    ConsoleRenderer.ts     // 2x2 그리드 렌더링 조율
    visualizers/
      LevelMeter.ts
      RTA.ts
      Spectrogram.ts
      Waveform.ts

  canvas/
    FullCanvasRenderer.ts  // 녹화용 통합 캔버스 렌더러
    playerRenderers/
      TurntableRenderer.ts
      CDRenderer.ts
      CassetteRenderer.ts
    drawUtils.ts

  recording/
    RecordingManager.ts    // MediaRecorder wrapper
    FFmpegConverter.ts     // MP4 변환

  ai/
    musicAnalyzer.ts       // 음악 특성 분석 → 프롬프트 생성
    albumArtGenerator.ts   // Google Gemini Imagen API 호출

  controls/
    ControlPanel.tsx
    FileUpload.tsx
    AlbumArtControls.tsx
    StyleSelector.tsx
    TransportControls.tsx
    VolumeSlider.tsx
    RecordButton.tsx
    ExportControls.tsx

  ui/
    Layout.tsx
    VisualizationArea.tsx  // 1280x720 컨테이너

  types/
    audio.ts
    visualizer.ts
    player.ts
```

## Implementation Phases

1. **Phase 1 - 프로젝트 스캐폴드 + 오디오**: Vite 프로젝트 설정, Tailwind, AudioEngine, 파일 업로드, 재생 컨트롤
2. **Phase 2 - 믹싱 콘솔 비주얼라이저**: ConsoleCanvas, 4개 비주얼라이저 (LevelMeter, RTA, Spectrogram, Waveform)
3. **Phase 3 - 플레이어 UI (HTML/CSS)**: 턴테이블 → CD → 카세트 순서, CSS 애니메이션, 앨범 아트
4. **Phase 4 - 녹화 파이프라인**: Canvas 렌더러, RecordingManager, 오디오+비디오 병합, WebM 출력
5. **Phase 5 - 마무리**: FFmpeg WASM MP4 변환, AI 앨범아트, 에러 처리, 로딩 UI

## Risks and Mitigations

| 리스크 | 대응 |
|---|---|
| captureStream 브라우저 호환성 | 로드 시 지원 여부 확인, Safari 제한 문서화 |
| FFmpeg WASM의 SharedArrayBuffer 요구 | MP4 변환은 선택 기능, COOP/COEP 헤더 설정 |
| 플레이어 CSS/Canvas 시각적 차이 | PlayerGeometry 공유, Canvas 버전은 단순화 허용 |
| AI API 키 프론트엔드 노출 | 사용자 경고 UI, base64 응답으로 CORS 회피 |
| 음악 분석 정확도 한계 | 분석은 힌트 수준, 사용자 키워드 입력으로 보완 가능 |
| FFmpeg WASM 번들 크기 (~25MB) | 지연 로딩, 다운로드 프로그레스 표시 |

## Verification

1. `npm run dev`로 개발 서버 실행 후 브라우저에서 확인
2. 오디오 파일 업로드 → 재생 → 비주얼라이저 반응 확인
3. 3가지 플레이어 스타일 전환 및 애니메이션 시퀀스 확인
4. 녹화 시작/종료 → WebM 파일 다운로드 및 재생 확인
5. FFmpeg MP4 변환 정상 동작 확인
6. AI 앨범아트 생성 (API 키 필요) 확인
7. MCP Preview 도구로 브라우저에서 실시간 확인
