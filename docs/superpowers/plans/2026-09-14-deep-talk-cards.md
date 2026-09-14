# 深度對話卡牌 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 做一款單裝置、傳著玩的深度對話卡牌 web app，題目全部原創，依破冰／一星／二星／三星四層由淺入深。

**Architecture:** 所有遊戲邏輯是 `src/game/` 之下的純函式（建牌堆、狀態轉移、持久化），完全不碰 DOM，可獨立測試。React 只負責渲染與事件分派。無後端，進度存在 localStorage。

**Tech Stack:** Vite + React 18 + TypeScript + Vitest。純 CSS（CSS custom properties 做主題），不引入 UI 框架。

**Spec:** `docs/superpowers/specs/2026-09-14-deep-talk-cards-design.md`

## Global Constraints

- 介面文字一律繁體中文，不做多語系。
- 不新增執行期依賴。`dependencies` 只有 `react` 與 `react-dom`，其餘皆為 `devDependencies`。
- 層級順序恆為 `warmup → star1 → star2 → star3`，此常數定義於 `src/game/types.ts` 的 `TIER_ORDER`，任何地方都不得自行硬寫順序。
- 所有需要亂數的函式必須接受注入的 `Rng` 參數，不得直接呼叫 `Math.random()`（呼叫端才傳入）。
- 題庫張數固定：warmup 20、star1 20、star2 20、star3 15，共 75。
- 題目 id 前綴：`w-`、`s1-`、`s2-`、`s3-`，序號兩位數補零。
- `src/game/` 之下的檔案不得 import React 或任何瀏覽器 API（`localStorage` 以參數注入）。

---

### Task 1: 專案骨架、型別與牌堆建構

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`
- Create: `src/game/types.ts`
- Create: `src/game/deck.ts`
- Test: `src/game/deck.test.ts`

**Interfaces:**
- Consumes: 無（第一個任務）
- Produces:
  - `type Tier = 'warmup' | 'star1' | 'star2' | 'star3'`
  - `const TIER_ORDER: readonly Tier[]`
  - `interface Question { id: string; tier: Tier; text: string }`
  - `interface GameState { selectedTiers: Tier[]; deck: string[]; position: number; skipped: string[]; startedAt: number }`
  - `type Rng = () => number`
  - `function shuffle<T>(items: readonly T[], rng: Rng): T[]`
  - `function buildDeck(questions: readonly Question[], selectedTiers: readonly Tier[], rng: Rng): string[]`

- [ ] **Step 1: 建立 package.json**

```json
{
  "name": "deep-talk-cards",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "typescript": "^5.6.3",
    "vite": "^6.0.3",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: 建立 TypeScript 與 Vite 設定**

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": false,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

`vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

`index.html`:

```html
<!doctype html>
<html lang="zh-Hant">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>深度對話卡牌</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 3: 安裝依賴**

Run: `npm install`
Expected: 建立 `node_modules` 與 `package-lock.json`，無 error。

- [ ] **Step 4: 建立型別檔**

`src/game/types.ts`:

```ts
export type Tier = 'warmup' | 'star1' | 'star2' | 'star3'

export const TIER_ORDER: readonly Tier[] = ['warmup', 'star1', 'star2', 'star3']

export const TIER_LABEL: Record<Tier, string> = {
  warmup: '暖身破冰',
  star1: '一星',
  star2: '二星',
  star3: '三星',
}

export interface Question {
  id: string
  tier: Tier
  text: string
}

export interface GameState {
  selectedTiers: Tier[]
  deck: string[]
  position: number
  skipped: string[]
  startedAt: number
}

/** 回傳 [0, 1) 的亂數。注入以便測試可重現。 */
export type Rng = () => number
```

- [ ] **Step 5: 寫失敗的測試**

`src/game/deck.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { buildDeck, shuffle } from './deck'
import type { Question, Rng } from './types'

/** 固定序列的假亂數，讓洗牌結果可預測。 */
function seededRng(values: number[]): Rng {
  let i = 0
  return () => values[i++ % values.length]
}

const questions: Question[] = [
  { id: 'w-01', tier: 'warmup', text: '暖身一' },
  { id: 'w-02', tier: 'warmup', text: '暖身二' },
  { id: 's1-01', tier: 'star1', text: '一星一' },
  { id: 's1-02', tier: 'star1', text: '一星二' },
  { id: 's2-01', tier: 'star2', text: '二星一' },
  { id: 's3-01', tier: 'star3', text: '三星一' },
]

describe('shuffle', () => {
  it('不修改原陣列', () => {
    const input = [1, 2, 3, 4]
    shuffle(input, seededRng([0]))
    expect(input).toEqual([1, 2, 3, 4])
  })

  it('保留所有元素', () => {
    const result = shuffle([1, 2, 3, 4], seededRng([0.9, 0.1, 0.5]))
    expect([...result].sort()).toEqual([1, 2, 3, 4])
  })

  it('相同的 rng 序列產生相同結果', () => {
    const a = shuffle([1, 2, 3, 4, 5], seededRng([0.2, 0.7, 0.4, 0.9]))
    const b = shuffle([1, 2, 3, 4, 5], seededRng([0.2, 0.7, 0.4, 0.9]))
    expect(a).toEqual(b)
  })
})

describe('buildDeck', () => {
  it('只包含選中層級的題目', () => {
    const deck = buildDeck(questions, ['warmup', 'star2'], seededRng([0]))
    expect([...deck].sort()).toEqual(['s2-01', 'w-01', 'w-02'])
  })

  it('未選的層級完全不出現', () => {
    const deck = buildDeck(questions, ['star3'], seededRng([0]))
    expect(deck).toEqual(['s3-01'])
  })

  it('層級順序恆為由淺入深，與傳入順序無關', () => {
    const deck = buildDeck(questions, ['star3', 'warmup', 'star1'], seededRng([0]))
    const tierOf = (id: string) => questions.find((q) => q.id === id)!.tier
    expect(deck.map(tierOf)).toEqual(['warmup', 'warmup', 'star1', 'star1', 'star3'])
  })

  it('沒有選任何層級時回傳空牌堆', () => {
    expect(buildDeck(questions, [], seededRng([0]))).toEqual([])
  })

  it('牌堆內沒有重複的題目', () => {
    const deck = buildDeck(questions, ['warmup', 'star1', 'star2', 'star3'], seededRng([0.3, 0.8]))
    expect(new Set(deck).size).toBe(deck.length)
  })
})
```

- [ ] **Step 6: 執行測試確認失敗**

Run: `npm test`
Expected: FAIL，訊息為無法解析 `./deck` 模組。

- [ ] **Step 7: 實作 deck.ts**

`src/game/deck.ts`:

```ts
import { TIER_ORDER } from './types'
import type { Question, Rng, Tier } from './types'

/** Fisher-Yates。不修改輸入。 */
export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/**
 * 建立牌堆：層級之間固定由淺入深，層級之內隨機洗牌。
 * 回傳題目 id 的陣列。
 */
export function buildDeck(
  questions: readonly Question[],
  selectedTiers: readonly Tier[],
  rng: Rng,
): string[] {
  const selected = new Set<Tier>(selectedTiers)
  const deck: string[] = []

  for (const tier of TIER_ORDER) {
    if (!selected.has(tier)) continue
    const idsInTier = questions.filter((q) => q.tier === tier).map((q) => q.id)
    deck.push(...shuffle(idsInTier, rng))
  }

  return deck
}
```

- [ ] **Step 8: 執行測試確認通過**

Run: `npm test`
Expected: PASS，8 個測試全數通過。

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: add project scaffold, game types, and deck builder"
```

---

### Task 2: 遊戲狀態機

**Files:**
- Create: `src/game/reducer.ts`
- Test: `src/game/reducer.test.ts`

**Interfaces:**
- Consumes: `GameState`, `Question`, `Rng`, `Tier` from `./types`；`buildDeck` from `./deck`
- Produces:
  - `type GameAction = { type: 'next' } | { type: 'swap' }`
  - `function createGame(questions: readonly Question[], selectedTiers: readonly Tier[], rng: Rng, now: number): GameState`
  - `function gameReducer(state: GameState, action: GameAction): GameState`
  - `function currentQuestionId(state: GameState): string | null`
  - `function isFinished(state: GameState): boolean`
  - `function isTierBoundary(state: GameState, byId: Readonly<Record<string, Question>>): boolean`
  - `function indexQuestions(questions: readonly Question[]): Record<string, Question>`

- [ ] **Step 1: 寫失敗的測試**

`src/game/reducer.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  createGame,
  currentQuestionId,
  gameReducer,
  indexQuestions,
  isFinished,
  isTierBoundary,
} from './reducer'
import type { GameState, Question, Rng } from './types'

const rng: Rng = () => 0

const questions: Question[] = [
  { id: 'w-01', tier: 'warmup', text: '暖身一' },
  { id: 'w-02', tier: 'warmup', text: '暖身二' },
  { id: 's1-01', tier: 'star1', text: '一星一' },
]

const byId = indexQuestions(questions)

/** 固定牌堆，避免測試依賴洗牌結果。 */
function stateWithDeck(deck: string[], position = 0): GameState {
  return { selectedTiers: ['warmup', 'star1'], deck, position, skipped: [], startedAt: 0 }
}

describe('createGame', () => {
  it('從 0 開始，且記錄起始時間與選中的層級', () => {
    const state = createGame(questions, ['warmup'], rng, 1234)
    expect(state.position).toBe(0)
    expect(state.skipped).toEqual([])
    expect(state.startedAt).toBe(1234)
    expect(state.selectedTiers).toEqual(['warmup'])
  })

  it('牌堆只含選中層級的題目', () => {
    const state = createGame(questions, ['star1'], rng, 0)
    expect(state.deck).toEqual(['s1-01'])
  })
})

describe('currentQuestionId', () => {
  it('回傳目前位置的題目 id', () => {
    expect(currentQuestionId(stateWithDeck(['w-01', 'w-02'], 1))).toBe('w-02')
  })

  it('牌堆耗盡時回傳 null', () => {
    expect(currentQuestionId(stateWithDeck(['w-01'], 1))).toBeNull()
  })
})

describe('gameReducer', () => {
  it('next 使位置前進，且不記錄 skipped', () => {
    const next = gameReducer(stateWithDeck(['w-01', 'w-02']), { type: 'next' })
    expect(next.position).toBe(1)
    expect(next.skipped).toEqual([])
  })

  it('swap 記錄目前題目並前進', () => {
    const next = gameReducer(stateWithDeck(['w-01', 'w-02']), { type: 'swap' })
    expect(next.position).toBe(1)
    expect(next.skipped).toEqual(['w-01'])
  })

  it('不修改原本的 state', () => {
    const state = stateWithDeck(['w-01', 'w-02'])
    gameReducer(state, { type: 'swap' })
    expect(state.position).toBe(0)
    expect(state.skipped).toEqual([])
  })

  it('位置不會超過牌堆長度', () => {
    const state = gameReducer(stateWithDeck(['w-01'], 1), { type: 'next' })
    expect(state.position).toBe(1)
  })

  it('牌堆耗盡時 swap 不記錄任何東西', () => {
    const state = gameReducer(stateWithDeck(['w-01'], 1), { type: 'swap' })
    expect(state.skipped).toEqual([])
  })
})

describe('isFinished', () => {
  it('位置到達牌堆長度時為 true', () => {
    expect(isFinished(stateWithDeck(['w-01'], 1))).toBe(true)
  })

  it('還有卡可抽時為 false', () => {
    expect(isFinished(stateWithDeck(['w-01', 'w-02'], 1))).toBe(false)
  })

  it('空牌堆視為已結束', () => {
    expect(isFinished(stateWithDeck([], 0))).toBe(true)
  })
})

describe('isTierBoundary', () => {
  it('第一張卡不算跨層', () => {
    expect(isTierBoundary(stateWithDeck(['w-01', 's1-01'], 0), byId)).toBe(false)
  })

  it('層級改變時為 true', () => {
    expect(isTierBoundary(stateWithDeck(['w-01', 's1-01'], 1), byId)).toBe(true)
  })

  it('同層級之內為 false', () => {
    expect(isTierBoundary(stateWithDeck(['w-01', 'w-02'], 1), byId)).toBe(false)
  })

  it('牌堆耗盡時為 false', () => {
    expect(isTierBoundary(stateWithDeck(['w-01'], 1), byId)).toBe(false)
  })
})
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `npm test`
Expected: FAIL，無法解析 `./reducer` 模組。

- [ ] **Step 3: 實作 reducer.ts**

`src/game/reducer.ts`:

```ts
import { buildDeck } from './deck'
import type { GameState, Question, Rng, Tier } from './types'

export type GameAction = { type: 'next' } | { type: 'swap' }

export function indexQuestions(questions: readonly Question[]): Record<string, Question> {
  return Object.fromEntries(questions.map((q) => [q.id, q]))
}

export function createGame(
  questions: readonly Question[],
  selectedTiers: readonly Tier[],
  rng: Rng,
  now: number,
): GameState {
  return {
    selectedTiers: [...selectedTiers],
    deck: buildDeck(questions, selectedTiers, rng),
    position: 0,
    skipped: [],
    startedAt: now,
  }
}

export function currentQuestionId(state: GameState): string | null {
  return state.deck[state.position] ?? null
}

export function isFinished(state: GameState): boolean {
  return state.position >= state.deck.length
}

export function isTierBoundary(
  state: GameState,
  byId: Readonly<Record<string, Question>>,
): boolean {
  if (state.position === 0 || isFinished(state)) return false
  const current = byId[state.deck[state.position]]
  const previous = byId[state.deck[state.position - 1]]
  if (!current || !previous) return false
  return current.tier !== previous.tier
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  if (isFinished(state)) return state

  switch (action.type) {
    case 'next':
      return { ...state, position: state.position + 1 }
    case 'swap':
      return {
        ...state,
        position: state.position + 1,
        skipped: [...state.skipped, state.deck[state.position]],
      }
  }
}
```

- [ ] **Step 4: 執行測試確認通過**

Run: `npm test`
Expected: PASS，全部通過。

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add game state reducer"
```

---

### Task 3: localStorage 持久化

**Files:**
- Create: `src/game/storage.ts`
- Test: `src/game/storage.test.ts`

**Interfaces:**
- Consumes: `GameState` from `./types`
- Produces:
  - `const STORAGE_KEY: string`
  - `const SCHEMA_VERSION: number`
  - `interface StorageLike { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void }`
  - `function saveGame(state: GameState, storage: StorageLike): void`
  - `function loadGame(storage: StorageLike): GameState | null`
  - `function clearGame(storage: StorageLike): void`

- [ ] **Step 1: 寫失敗的測試**

`src/game/storage.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest'
import { SCHEMA_VERSION, STORAGE_KEY, clearGame, loadGame, saveGame } from './storage'
import type { StorageLike } from './storage'
import type { GameState } from './types'

function fakeStorage(): StorageLike & { raw: Map<string, string> } {
  const raw = new Map<string, string>()
  return {
    raw,
    getItem: (key) => raw.get(key) ?? null,
    setItem: (key, value) => void raw.set(key, value),
    removeItem: (key) => void raw.delete(key),
  }
}

const state: GameState = {
  selectedTiers: ['warmup', 'star1'],
  deck: ['w-01', 's1-01'],
  position: 1,
  skipped: ['w-02'],
  startedAt: 1700000000000,
}

let storage: ReturnType<typeof fakeStorage>

beforeEach(() => {
  storage = fakeStorage()
})

describe('saveGame / loadGame', () => {
  it('存檔後讀回得到相同的狀態', () => {
    saveGame(state, storage)
    expect(loadGame(storage)).toEqual(state)
  })

  it('沒有存檔時回傳 null', () => {
    expect(loadGame(storage)).toBeNull()
  })

  it('存檔內含 schema 版本號', () => {
    saveGame(state, storage)
    expect(JSON.parse(storage.raw.get(STORAGE_KEY)!).version).toBe(SCHEMA_VERSION)
  })
})

describe('loadGame 的防禦', () => {
  it('版本不符時回傳 null', () => {
    storage.raw.set(STORAGE_KEY, JSON.stringify({ version: SCHEMA_VERSION + 1, state }))
    expect(loadGame(storage)).toBeNull()
  })

  it('JSON 損毀時回傳 null 而不拋錯', () => {
    storage.raw.set(STORAGE_KEY, '{ this is not json')
    expect(() => loadGame(storage)).not.toThrow()
    expect(loadGame(storage)).toBeNull()
  })

  it('狀態結構不完整時回傳 null', () => {
    storage.raw.set(STORAGE_KEY, JSON.stringify({ version: SCHEMA_VERSION, state: { deck: 'nope' } }))
    expect(loadGame(storage)).toBeNull()
  })

  it('缺少 state 欄位時回傳 null', () => {
    storage.raw.set(STORAGE_KEY, JSON.stringify({ version: SCHEMA_VERSION }))
    expect(loadGame(storage)).toBeNull()
  })
})

describe('clearGame', () => {
  it('清除後讀不到存檔', () => {
    saveGame(state, storage)
    clearGame(storage)
    expect(loadGame(storage)).toBeNull()
  })
})
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `npm test`
Expected: FAIL，無法解析 `./storage` 模組。

- [ ] **Step 3: 實作 storage.ts**

`src/game/storage.ts`:

```ts
import type { GameState } from './types'

export const STORAGE_KEY = 'deep-talk-cards'
export const SCHEMA_VERSION = 1

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

function isGameState(value: unknown): value is GameState {
  if (typeof value !== 'object' || value === null) return false
  const s = value as Record<string, unknown>
  return (
    Array.isArray(s.selectedTiers) &&
    Array.isArray(s.deck) &&
    Array.isArray(s.skipped) &&
    typeof s.position === 'number' &&
    typeof s.startedAt === 'number'
  )
}

export function saveGame(state: GameState, storage: StorageLike): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: SCHEMA_VERSION, state }))
  } catch {
    // 私密瀏覽或空間不足時靜默失敗：進度遺失不該讓遊戲中斷。
  }
}

export function loadGame(storage: StorageLike): GameState | null {
  let raw: string | null
  try {
    raw = storage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
  if (raw === null) return null

  try {
    const parsed = JSON.parse(raw) as { version?: unknown; state?: unknown }
    if (parsed.version !== SCHEMA_VERSION) return null
    if (!isGameState(parsed.state)) return null
    return parsed.state
  } catch {
    return null
  }
}

export function clearGame(storage: StorageLike): void {
  try {
    storage.removeItem(STORAGE_KEY)
  } catch {
    // 同上，靜默失敗。
  }
}
```

- [ ] **Step 4: 執行測試確認通過**

Run: `npm test`
Expected: PASS，全部通過。

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add localStorage persistence with schema versioning"
```

---

### Task 4: 原創題庫

**Files:**
- Create: `src/data/questions.ts`
- Test: `src/data/questions.test.ts`

**Interfaces:**
- Consumes: `Question`, `Tier`, `TIER_ORDER` from `../game/types`
- Produces: `const QUESTIONS: readonly Question[]`（75 題）

**撰寫原則（已於實作內容中落實，修改題目時須維持）：**
- 每題為開放式問句，無法用是／否回答
- 不預設立場：不假定對方有伴侶、小孩、宗教信仰或良好的家庭關係
- 三星題問的是內心，不是把柄——要能被誠實回答而不使人難堪
- 同層級內不重複提問角度

- [ ] **Step 1: 寫失敗的測試**

`src/data/questions.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { QUESTIONS } from './questions'
import { TIER_ORDER } from '../game/types'
import type { Tier } from '../game/types'

const EXPECTED_COUNTS: Record<Tier, number> = {
  warmup: 20,
  star1: 20,
  star2: 20,
  star3: 15,
}

const PREFIX: Record<Tier, string> = {
  warmup: 'w-',
  star1: 's1-',
  star2: 's2-',
  star3: 's3-',
}

describe('題庫', () => {
  it('總共 75 題', () => {
    expect(QUESTIONS).toHaveLength(75)
  })

  it.each(TIER_ORDER)('%s 層級的張數正確', (tier) => {
    expect(QUESTIONS.filter((q) => q.tier === tier)).toHaveLength(EXPECTED_COUNTS[tier])
  })

  it('id 全部唯一', () => {
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(QUESTIONS.length)
  })

  it('id 前綴符合所屬層級', () => {
    for (const q of QUESTIONS) {
      expect(q.id.startsWith(PREFIX[q.tier])).toBe(true)
    }
  })

  it('題目文字非空', () => {
    for (const q of QUESTIONS) {
      expect(q.text.trim().length).toBeGreaterThan(0)
    }
  })

  it('題目文字不重複', () => {
    expect(new Set(QUESTIONS.map((q) => q.text)).size).toBe(QUESTIONS.length)
  })

  it('每題都是問句', () => {
    for (const q of QUESTIONS) {
      expect(q.text.trim().endsWith('？')).toBe(true)
    }
  })
})
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `npm test`
Expected: FAIL，無法解析 `./questions` 模組。

- [ ] **Step 3: 建立題庫檔**

`src/data/questions.ts`:

```ts
import type { Question } from '../game/types'

export const QUESTIONS: readonly Question[] = [
  // 暖身破冰 — 輕快有趣，讓大家先開口、先笑出來，不觸及隱私
  { id: 'w-01', tier: 'warmup', text: '如果你的人生有一首固定播放的背景音樂，會是什麼？' },
  { id: 'w-02', tier: 'warmup', text: '你最近一次笑到停不下來是什麼時候？' },
  { id: 'w-03', tier: 'warmup', text: '如果可以無痛精通一項技能，你要選哪個？' },
  { id: 'w-04', tier: 'warmup', text: '你手機裡最捨不得刪的一張照片是什麼？' },
  { id: 'w-05', tier: 'warmup', text: '如果明天起你只能吃三種食物，你選哪三種？' },
  { id: 'w-06', tier: 'warmup', text: '你有什麼堅持，別人聽了都覺得莫名其妙？' },
  { id: 'w-07', tier: 'warmup', text: '如果要幫現在的自己取一個綽號，會是什麼？' },
  { id: 'w-08', tier: 'warmup', text: '你最想穿越到哪一年，只待一天就好？' },
  { id: 'w-09', tier: 'warmup', text: '你做過最沒有效益但很快樂的事是什麼？' },
  { id: 'w-10', tier: 'warmup', text: '如果要用一種動物形容你今年的狀態，是哪一種？' },
  { id: 'w-11', tier: 'warmup', text: '你曾經為了什麼小事，偷偷覺得自己很厲害？' },
  { id: 'w-12', tier: 'warmup', text: '有什麼東西大家都說好，你就是無法喜歡？' },
  { id: 'w-13', tier: 'warmup', text: '如果生活可以外包一件事給別人，你要外包什麼？' },
  { id: 'w-14', tier: 'warmup', text: '你最常重看的電影、影集或書是哪一部？' },
  { id: 'w-15', tier: 'warmup', text: '如果現在有人給你一整天，什麼都不用做，你會做什麼？' },
  { id: 'w-16', tier: 'warmup', text: '你小時候相信過什麼，長大才發現是假的？' },
  { id: 'w-17', tier: 'warmup', text: '你身上有沒有什麼別人看不出來的小技能？' },
  { id: 'w-18', tier: 'warmup', text: '如果你能在天空寫一句話給全世界看，你要寫什麼？' },
  { id: 'w-19', tier: 'warmup', text: '你最近一次覺得「這錢花得真值得」是買了什麼？' },
  { id: 'w-20', tier: 'warmup', text: '如果要辦一場以你為主題的展覽，第一個展間會放什麼？' },

  // 一星 — 溫暖向，輕度：日常偏好、小回憶、無風險的自我揭露
  { id: 's1-01', tier: 'star1', text: '你今年做過最讓自己滿意的一個決定是什麼？' },
  { id: 's1-02', tier: 'star1', text: '有沒有一個地方，你一想到就覺得放鬆？' },
  { id: 's1-03', tier: 'star1', text: '你最近在期待什麼？' },
  { id: 's1-04', tier: 'star1', text: '什麼樣的時刻會讓你覺得「今天過得不錯」？' },
  { id: 's1-05', tier: 'star1', text: '你小時候最喜歡的一個角落是什麼樣子？' },
  { id: 's1-06', tier: 'star1', text: '有沒有一句話是你常常對自己說的？' },
  { id: 's1-07', tier: 'star1', text: '你喜歡自己身上的哪一個部分？' },
  { id: 's1-08', tier: 'star1', text: '你曾經被誰的一句話鼓勵過，到現在還記得？' },
  { id: 's1-09', tier: 'star1', text: '你怎麼判斷一個地方讓你有「家」的感覺？' },
  { id: 's1-10', tier: 'star1', text: '最近有什麼事讓你覺得被照顧到了？' },
  { id: 's1-11', tier: 'star1', text: '你在什麼情況下最像自己？' },
  { id: 's1-12', tier: 'star1', text: '有沒有一首歌，一聽就會把你帶回某個時期？' },
  { id: 's1-13', tier: 'star1', text: '你希望別人第一眼看到你時，感覺到什麼？' },
  { id: 's1-14', tier: 'star1', text: '你做什麼事的時候會忘記時間？' },
  { id: 's1-15', tier: 'star1', text: '你身上有沒有哪個習慣，是從家裡帶出來的？' },
  { id: 's1-16', tier: 'star1', text: '你最近一次對自己感到驕傲是什麼時候？' },
  { id: 's1-17', tier: 'star1', text: '如果要推薦一件讓生活變好的小事，你會推薦什麼？' },
  { id: 's1-18', tier: 'star1', text: '你怎麼度過心情不好的一天？' },
  { id: 's1-19', tier: 'star1', text: '有沒有什麼是你以前不喜歡、現在卻愛上的？' },
  { id: 's1-20', tier: 'star1', text: '這一年你身上有什麼變化，是只有你自己察覺得到的？' },

  // 二星 — 溫暖向，中度：關係、感謝、改變、影響自己的人事物
  { id: 's2-01', tier: 'star2', text: '有誰改變了你看世界的方式？改變了什麼？' },
  { id: 's2-02', tier: 'star2', text: '你曾經因為什麼事，對自己的看法整個翻轉？' },
  { id: 's2-03', tier: 'star2', text: '有沒有一段關係，你希望當時能處理得更好？' },
  { id: 's2-04', tier: 'star2', text: '你最想感謝誰，但一直沒說出口？' },
  { id: 's2-05', tier: 'star2', text: '你從家裡帶走了什麼是想留下的，又有什麼是想放掉的？' },
  { id: 's2-06', tier: 'star2', text: '你是在什麼時候學會說不的？' },
  { id: 's2-07', tier: 'star2', text: '有沒有一個決定，你到現在都還會偶爾想起？' },
  { id: 's2-08', tier: 'star2', text: '你怎麼定義「被理解」？上一次有這種感覺是什麼時候？' },
  { id: 's2-09', tier: 'star2', text: '有什麼是你以前很在意、現在已經放下的？' },
  { id: 's2-10', tier: 'star2', text: '你身上有哪一面，是只有少數人看過的？' },
  { id: 's2-11', tier: 'star2', text: '你曾經在誰面前感到最自在？為什麼是那個人？' },
  { id: 's2-12', tier: 'star2', text: '什麼事情讓你覺得「我長大了」？' },
  { id: 's2-13', tier: 'star2', text: '你最害怕別人怎麼誤解你？' },
  { id: 's2-14', tier: 'star2', text: '有沒有一個人，你希望能再跟他說一次話？' },
  { id: 's2-15', tier: 'star2', text: '你經歷過最辛苦的那段時間，是什麼支撐你走過來的？' },
  { id: 's2-16', tier: 'star2', text: '你在什麼時候最容易對自己嚴厲？' },
  { id: 's2-17', tier: 'star2', text: '有沒有什麼是你一直想做卻沒開始的？是什麼擋住了？' },
  { id: 's2-18', tier: 'star2', text: '你怎麼知道自己真的信任一個人？' },
  { id: 's2-19', tier: 'star2', text: '這幾年你失去過什麼，但也因此得到了什麼？' },
  { id: 's2-20', tier: 'star2', text: '如果可以跟五年前的自己說一句話，你會說什麼？' },

  // 三星 — 溫暖向，深度：價值觀、遺憾、脆弱。問的是內心，不是把柄
  { id: 's3-01', tier: 'star3', text: '你最想被記得的是什麼樣子？' },
  { id: 's3-02', tier: 'star3', text: '有什麼事是你到現在都還沒原諒自己的？' },
  { id: 's3-03', tier: 'star3', text: '你心裡有沒有一句話，一直想對某個人說卻沒說？' },
  { id: 's3-04', tier: 'star3', text: '你最深的恐懼是什麼？它是從什麼時候開始的？' },
  { id: 's3-05', tier: 'star3', text: '你覺得自己這輩子最重要的事，是什麼？' },
  { id: 's3-06', tier: 'star3', text: '什麼時候你覺得最孤單？' },
  { id: 's3-07', tier: 'star3', text: '你曾經在哪一刻，真的懷疑過自己？' },
  { id: 's3-08', tier: 'star3', text: '如果你只剩一年，你會改變什麼？' },
  { id: 's3-09', tier: 'star3', text: '你最想從別人那裡得到什麼，卻很難開口要？' },
  { id: 's3-10', tier: 'star3', text: '你身上有沒有一道傷，是你到現在還在照顧的？' },
  { id: 's3-11', tier: 'star3', text: '你曾經為了誰放棄過什麼？現在怎麼看那個選擇？' },
  { id: 's3-12', tier: 'star3', text: '你覺得什麼樣的人生算是活得好？你現在離它多遠？' },
  { id: 's3-13', tier: 'star3', text: '有沒有什麼是你一直假裝不在意，其實很在意的？' },
  { id: 's3-14', tier: 'star3', text: '你希望在座的人怎麼看你？跟你真實的樣子有差距嗎？' },
  { id: 's3-15', tier: 'star3', text: '此刻，有什麼是你願意在這裡說出口的？' },
]
```

- [ ] **Step 4: 執行測試確認通過**

Run: `npm test`
Expected: PASS，題庫測試全數通過（張數 20/20/20/15、id 唯一且前綴正確、文字不重複、全為問句）。

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add original question bank of 75 cards across four tiers"
```

---

### Task 5: App 狀態機與 Setup 畫面

**Files:**
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/screens/Setup.tsx`
- Create: `src/styles.css`

**Interfaces:**
- Consumes: `QUESTIONS` from `./data/questions`；`createGame`, `gameReducer`, `currentQuestionId`, `isFinished`, `isTierBoundary`, `indexQuestions` from `./game/reducer`；`loadGame`, `saveGame`, `clearGame` from `./game/storage`；`TIER_ORDER`, `TIER_LABEL` from `./game/types`
- Produces:
  - `function Setup(props: { savedExists: boolean; onStart: (tiers: Tier[]) => void; onResume: () => void }): JSX.Element`
  - `function App(): JSX.Element`

本任務結束時，選擇層級並按開始後畫面會顯示第一題的題目文字（Play 畫面在 Task 6 才做完整，此處先以最陽春的形式呈現）。

- [ ] **Step 1: 建立 main.tsx 與最小樣式**

`src/main.tsx`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

`src/styles.css`（此階段只求可讀，完整視覺在 Task 8）:

```css
:root {
  color-scheme: light dark;
  font-family: system-ui, -apple-system, "Noto Sans TC", sans-serif;
}

body {
  margin: 0;
  min-height: 100dvh;
}

#root {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  padding: 24px 20px;
  box-sizing: border-box;
}
```

- [ ] **Step 2: 建立 Setup 畫面**

`src/screens/Setup.tsx`:

```tsx
import { useState } from 'react'
import { TIER_LABEL, TIER_ORDER } from '../game/types'
import type { Tier } from '../game/types'

interface SetupProps {
  savedExists: boolean
  onStart: (tiers: Tier[]) => void
  onResume: () => void
}

export default function Setup({ savedExists, onStart, onResume }: SetupProps) {
  const [selected, setSelected] = useState<Tier[]>([...TIER_ORDER])

  function toggle(tier: Tier) {
    setSelected((current) =>
      current.includes(tier) ? current.filter((t) => t !== tier) : [...current, tier],
    )
  }

  return (
    <main className="screen screen--setup">
      <h1>深度對話卡牌</h1>
      <p className="lede">選擇這一場要玩的層級。題目會由淺入深依序出現。</p>

      <fieldset className="tier-picker">
        <legend>層級</legend>
        {TIER_ORDER.map((tier) => (
          <label key={tier} className="tier-option">
            <input
              type="checkbox"
              checked={selected.includes(tier)}
              onChange={() => toggle(tier)}
            />
            <span>{TIER_LABEL[tier]}</span>
          </label>
        ))}
      </fieldset>

      <button
        type="button"
        className="button button--primary"
        disabled={selected.length === 0}
        onClick={() => onStart(selected)}
      >
        開始新的一場
      </button>

      {savedExists && (
        <button type="button" className="button" onClick={onResume}>
          繼續上一場
        </button>
      )}
    </main>
  )
}
```

- [ ] **Step 3: 建立 App 狀態機**

`src/App.tsx`:

```tsx
import { useEffect, useMemo, useState } from 'react'
import Setup from './screens/Setup'
import { QUESTIONS } from './data/questions'
import { createGame, indexQuestions } from './game/reducer'
import { clearGame, loadGame, saveGame } from './game/storage'
import type { GameState, Tier } from './game/types'

export default function App() {
  const byId = useMemo(() => indexQuestions(QUESTIONS), [])
  const [game, setGame] = useState<GameState | null>(null)
  const [saved, setSaved] = useState<GameState | null>(() => loadGame(localStorage))

  useEffect(() => {
    if (game) saveGame(game, localStorage)
  }, [game])

  function start(tiers: Tier[]) {
    setSaved(null)
    clearGame(localStorage)
    setGame(createGame(QUESTIONS, tiers, Math.random, Date.now()))
  }

  function resume() {
    setGame(saved)
    setSaved(null)
  }

  if (!game) {
    return <Setup savedExists={saved !== null} onStart={start} onResume={resume} />
  }

  const id = game.deck[game.position]
  return <main className="screen">{id ? byId[id].text : '（牌堆已用完）'}</main>
}
```

- [ ] **Step 4: 啟動開發伺服器手動驗證**

Run: `npm run dev`
Expected: 開啟顯示的網址，看到四個層級的核取方塊（預設全選）與「開始新的一場」。按下後畫面顯示一則暖身題的文字。取消全部勾選時開始鍵為 disabled。驗證完按 Ctrl-C 結束。

- [ ] **Step 5: 確認測試與型別檢查仍通過**

Run: `npm test && npx tsc --noEmit`
Expected: 測試全過，無型別錯誤。

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add app state machine and setup screen"
```

---

### Task 6: Card 元件與 Play 畫面

**Files:**
- Create: `src/components/Card.tsx`
- Create: `src/screens/Play.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `Question`, `TIER_LABEL` from `../game/types`；App 另需 `GameAction`、`currentQuestionId`、`gameReducer`、`isFinished` from `./game/reducer`
- Produces:
  - `function Card(props: { question: Question }): JSX.Element`
  - `function Play(props: { question: Question; index: number; total: number; onNext: () => void; onSwap: () => void }): JSX.Element`

- [ ] **Step 1: 建立 Card 元件**

`src/components/Card.tsx`:

```tsx
import { TIER_LABEL } from '../game/types'
import type { Question } from '../game/types'

export default function Card({ question }: { question: Question }) {
  return (
    <article className="card" data-tier={question.tier}>
      <span className="card__tier">{TIER_LABEL[question.tier]}</span>
      <p className="card__text">{question.text}</p>
    </article>
  )
}
```

- [ ] **Step 2: 建立 Play 畫面**

`src/screens/Play.tsx`:

```tsx
import Card from '../components/Card'
import type { Question } from '../game/types'

interface PlayProps {
  question: Question
  index: number
  total: number
  onNext: () => void
  onSwap: () => void
}

export default function Play({ question, index, total, onNext, onSwap }: PlayProps) {
  return (
    <main className="screen screen--play">
      <p className="progress">
        第 {index + 1} / {total} 張
      </p>

      <Card question={question} />

      <div className="actions">
        <button type="button" className="button" onClick={onSwap}>
          換一張
        </button>
        <button type="button" className="button button--primary" onClick={onNext}>
          下一張
        </button>
      </div>
    </main>
  )
}
```

- [ ] **Step 3: 把 Play 接進 App**

修改 `src/App.tsx`，把 Step 3 of Task 5 結尾那段臨時的 `const id = ...` 與 `return <main>` 換成下列內容，並在檔案頂端加入對應的 import：

```tsx
// 加到既有的 import 區塊
import Play from './screens/Play'
import { currentQuestionId, gameReducer, isFinished } from './game/reducer'
```

```tsx
// 取代臨時的顯示邏輯
function dispatch(action: GameAction) {
  setGame((current) => (current ? gameReducer(current, action) : current))
}

if (isFinished(game)) {
  return <main className="screen">（牌堆已用完）</main>
}

const questionId = currentQuestionId(game)!
return (
  <Play
    question={byId[questionId]}
    index={game.position}
    total={game.deck.length}
    onNext={() => dispatch({ type: 'next' })}
    onSwap={() => dispatch({ type: 'swap' })}
  />
)
```

同時把 `GameAction` 加入從 `./game/reducer` 的型別 import。

- [ ] **Step 4: 手動驗證抽卡流程**

Run: `npm run dev`
Expected: 開始一場後看到卡片、層級標籤與「第 1 / 75 張」。按「下一張」進度遞增、題目更換。按「換一張」同樣前進。重新整理頁面後停在同一張卡（進度有存檔）。驗證完按 Ctrl-C。

- [ ] **Step 5: 確認測試與型別檢查通過**

Run: `npm test && npx tsc --noEmit`
Expected: 測試全過，無型別錯誤。

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add card component and play screen"
```

---

### Task 7: 過場與結束畫面

**Files:**
- Create: `src/screens/Interstitial.tsx`
- Create: `src/screens/Finished.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `Tier`, `TIER_LABEL` from `../game/types`；`isTierBoundary` from `../game/reducer`
- Produces:
  - `function Interstitial(props: { tier: Tier; onContinue: () => void }): JSX.Element`
  - `function Finished(props: { total: number; skipped: number; onRestart: () => void }): JSX.Element`

- [ ] **Step 1: 建立過場畫面**

`src/screens/Interstitial.tsx`:

```tsx
import { TIER_LABEL } from '../game/types'
import type { Tier } from '../game/types'

const BLURB: Record<Tier, string> = {
  warmup: '先從輕鬆的開始，讓大家熱起來。',
  star1: '接下來的題目會多一點你自己。慢慢來，沒有標準答案。',
  star2: '再往內走一點。可以只說你願意說的部分。',
  star3: '最後這些題目會問得比較深。任何人都可以隨時喊停或跳過。',
}

interface InterstitialProps {
  tier: Tier
  onContinue: () => void
}

export default function Interstitial({ tier, onContinue }: InterstitialProps) {
  return (
    <main className="screen screen--interstitial" data-tier={tier}>
      <p className="interstitial__label">接下來是</p>
      <h2 className="interstitial__tier">{TIER_LABEL[tier]}</h2>
      <p className="interstitial__blurb">{BLURB[tier]}</p>
      <button type="button" className="button button--primary" onClick={onContinue}>
        繼續
      </button>
    </main>
  )
}
```

- [ ] **Step 2: 建立結束畫面**

`src/screens/Finished.tsx`:

```tsx
interface FinishedProps {
  total: number
  skipped: number
  onRestart: () => void
}

export default function Finished({ total, skipped, onRestart }: FinishedProps) {
  return (
    <main className="screen screen--finished">
      <h2>今天就到這裡</h2>
      <p className="lede">
        你們一起翻完了 {total} 張卡{skipped > 0 && `，換掉了 ${skipped} 張`}。
      </p>
      <p className="lede">謝謝每個人願意說出口的部分。</p>
      <button type="button" className="button button--primary" onClick={onRestart}>
        重新開始
      </button>
    </main>
  )
}
```

- [ ] **Step 3: 把兩個畫面接進 App**

修改 `src/App.tsx`。加入兩個畫面的 import，並把 `isTierBoundary` **併入**既有那行 `from './game/reducer'` 的 import：

```tsx
import Finished from './screens/Finished'
import Interstitial from './screens/Interstitial'
```

`clearGame` 在 Task 5 已經 import 過，不要再加一次——重複的具名綁定會造成編譯錯誤。同理，`isTierBoundary` 要加進既有的 reducer import 清單，而不是新增第二行 import。

加入過場確認的 state（放在既有的 `useState` 旁）：

```tsx
const [ackPosition, setAckPosition] = useState<number | null>(null)
```

加入重新開始的處理函式：

```tsx
function restart() {
  clearGame(localStorage)
  setGame(null)
  setAckPosition(null)
}
```

把 `isFinished` 的分支改成真正的結束畫面，並在 Play 之前插入過場判斷：

```tsx
if (isFinished(game)) {
  return <Finished total={game.deck.length} skipped={game.skipped.length} onRestart={restart} />
}

const questionId = currentQuestionId(game)!

if (isTierBoundary(game, byId) && ackPosition !== game.position) {
  return (
    <Interstitial
      tier={byId[questionId].tier}
      onContinue={() => setAckPosition(game.position)}
    />
  )
}
```

- [ ] **Step 4: 手動驗證完整流程**

Run: `npm run dev`
Expected:
- 只勾選「三星」開始 → 直接看到第一張卡，不出現過場（第一張卡不觸發過場）
- 四層全選 → 翻完 20 張暖身後出現「接下來是 一星」的過場，按繼續才看到卡片
- 在過場畫面重新整理 → 過場再次出現（預期行為，不是 bug）
- 翻完全部 75 張 → 出現結束畫面，顯示張數與換掉的張數
- 按「重新開始」→ 回到 Setup，且不顯示「繼續上一場」

驗證完按 Ctrl-C。

- [ ] **Step 5: 確認測試與型別檢查通過**

Run: `npm test && npx tsc --noEmit`
Expected: 測試全過，無型別錯誤。

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add tier interstitial and finished screens"
```

---

### Task 8: 視覺設計

**Files:**
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: 既有元件的 class 名稱與 `data-tier` 屬性：`.screen`、`.screen--setup`、`.screen--play`、`.screen--interstitial`、`.screen--finished`、`.card`、`.card__tier`、`.card__text`、`.progress`、`.actions`、`.button`、`.button--primary`、`.tier-picker`、`.tier-option`、`.lede`、`.interstitial__label`、`.interstitial__tier`、`.interstitial__blurb`
- Produces: 無新介面，僅樣式

**REQUIRED SUB-SKILL:** 開始本任務前先使用 `frontend-design:frontend-design` 技能建立視覺方向，避免做出看起來像預設模板的東西。

**設計限制：**
- 手機優先，直式大卡片。卡片是畫面主角，應佔據大部分垂直空間。
- 四個層級各有識別色，透過 `[data-tier="..."]` 選擇。破冰明亮、三星沉靜，四色須構成一條由淺到深的漸進序列，而非四個無關的顏色。
- 以 CSS custom properties 定義色票，並用 `@media (prefers-color-scheme: dark)` 提供深色主題。
- 題目文字要大、行高寬鬆，適合放在桌上讓幾個人一起看。
- 觸控目標至少 44×44px。
- 不引入任何 CSS 框架或字型 CDN。

- [ ] **Step 1: 建立視覺方向**

使用 `frontend-design:frontend-design` 技能，依上述限制決定色票、字級級數與間距節奏。

- [ ] **Step 2: 實作樣式**

改寫 `src/styles.css`，涵蓋 Interfaces 區列出的所有 class 與四個 `data-tier` 值。

- [ ] **Step 3: 在手機尺寸驗證**

Run: `npm run dev`
Expected: 在瀏覽器開發者工具切換到 390×844（iPhone）檢視，逐一確認四個畫面：文字不溢出、卡片不被裁切、按鈕不重疊、四個層級的顏色確實形成由淺到深的序列、切換系統深色模式後仍可讀。

- [ ] **Step 4: 確認建置成功**

Run: `npm run build`
Expected: 建置成功，產出 `dist/`，無型別錯誤。

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add visual design with tier colors and dark mode"
```

---

## 完成後

`npm run build` 產出的 `dist/` 是純靜態檔案，可直接部署到 Vercel、Netlify 或 GitHub Pages。部署不在本計畫範圍內。
