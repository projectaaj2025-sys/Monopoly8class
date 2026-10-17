import type { DomainId, Grade, GradeId, Quarter, Topic } from '../types'
import { PROGRAM_LIST } from './programs'
import type { SeedQuestion } from './programs/shared'

const topicId = (grade: GradeId, quarter: number, index: number): string =>
  `g${grade}-q${quarter}-t${index + 1}`

const buildQuarters = (grade: GradeId): Quarter[] =>
  PROGRAM_LIST.find((program) => program.id === grade)!.quarters.map((quarter) => ({
    number: quarter.number,
    title: quarter.title,
    hours: quarter.hours,
    topics: quarter.topics.map((seed, index) => ({
      id: topicId(grade, quarter.number, index),
      grade,
      quarter: quarter.number,
      title: seed.title,
      short: seed.short,
      domain: seed.domain as DomainId,
      icon: seed.icon,
      goal: seed.goal,
      lesson: seed.lesson ?? 'lesson',
    })),
  }))

export const GRADES: Record<GradeId, Grade> = Object.fromEntries(
  PROGRAM_LIST.map((program) => [
    program.id,
    {
      id: program.id,
      label: program.label,
      tagline: program.tagline,
      description: program.description,
      theme: program.theme,
      hours: program.hours,
      note: program.note,
      quarters: buildQuarters(program.id),
    },
  ]),
) as Record<GradeId, Grade>

export const GRADE_LIST: Grade[] = PROGRAM_LIST.map((program) => GRADES[program.id])

const programById = (grade: GradeId) => PROGRAM_LIST.find((program) => program.id === grade)!

export interface TopicEntry {
  topic: Topic
  questions: SeedQuestion[]
}

export const TOPIC_ENTRIES: TopicEntry[] = GRADE_LIST.flatMap((grade) =>
  grade.quarters.flatMap((quarter) => {
    const program = programById(grade.id)
    const programQuarter = program.quarters.find((item) => item.number === quarter.number)!
    return quarter.topics.map((topic, index) => ({
      topic,
      questions: programQuarter.topics[index].questions,
    }))
  }),
)

export const ALL_TOPICS: Topic[] = TOPIC_ENTRIES.map((entry) => entry.topic)

export const TOPIC_BY_ID: Record<string, Topic> = Object.fromEntries(
  ALL_TOPICS.map((topic) => [topic.id, topic]),
)

export const QUARTER_LABELS = ['I', 'II', 'III', 'IV']

export const topicsOfGrade = (grade: GradeId): Topic[] =>
  GRADES[grade].quarters.flatMap((quarter) => quarter.topics)

export const topicsOfQuarter = (grade: GradeId, quarter: number): Topic[] =>
  GRADES[grade].quarters.find((item) => item.number === quarter)?.topics ?? []

export const allTopicsOfGrades = (grades: GradeId[]): Topic[] =>
  grades.flatMap((grade) => topicsOfGrade(grade))
