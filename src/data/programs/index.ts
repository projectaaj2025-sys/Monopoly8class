import type { SeedGrade } from './shared'
import grade7 from './grade7'
import grade8 from './grade8'
import grade9 from './grade9'
import grade10 from './grade10'
import grade11 from './grade11'

export const GRADE_PROGRAMS: Record<number, SeedGrade> = {
  7: grade7,
  8: grade8,
  9: grade9,
  10: grade10,
  11: grade11,
}

export const PROGRAM_LIST: SeedGrade[] = [grade7, grade8, grade9, grade10, grade11]
