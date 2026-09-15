import type { Question } from '../game/types'
import { WARMUP_QUESTIONS } from './questions/warmup'
import { STAR1_QUESTIONS } from './questions/star1'
import { STAR2_QUESTIONS } from './questions/star2'
import { STAR3_QUESTIONS } from './questions/star3'

// 各階段題目請編輯 questions/ 內的對應檔案。
export const QUESTIONS: readonly Question[] = [
  ...WARMUP_QUESTIONS,
  ...STAR1_QUESTIONS,
  ...STAR2_QUESTIONS,
  ...STAR3_QUESTIONS,
]
