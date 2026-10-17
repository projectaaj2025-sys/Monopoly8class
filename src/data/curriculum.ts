import type { DomainId, Grade, GradeId, Quarter, Topic } from '../types'

type TopicSeed = [title: string, short: string, domain: DomainId, icon: string]

const quarter = (
  grade: GradeId,
  number: number,
  title: string,
  seeds: TopicSeed[],
): Quarter => ({
  number,
  title,
  topics: seeds.map(([topicTitle, short, domain, icon], i) => ({
    id: `g${grade}-q${number}-t${i + 1}`,
    grade,
    quarter: number,
    title: topicTitle,
    short,
    domain,
    icon,
  })),
})

export const GRADES: Record<GradeId, Grade> = {
  7: {
    id: 7,
    label: '7 класс',
    tagline: 'От первого опыта до Архимедовой силы',
    description: 'Введение, строение вещества, движение, силы, давление и энергия.',
    theme: 'g7',
    quarters: [
      quarter(7, 1, 'Введение. Строение вещества', [
        ['Физика — наука о природе', 'ФИЗИКА', 'methods', 'Microscope'],
        ['Наблюдения, опыты и измерения', 'ИЗМЕРЕНИЯ', 'methods', 'Ruler'],
        ['Молекулы и диффузия', 'МОЛЕКУЛЫ', 'molecular', 'Atom'],
        ['Три состояния вещества', 'СОСТОЯНИЯ', 'molecular', 'Droplets'],
        ['Лаборатория: измеряем малые тела', 'ЛАБОРАТОРИЯ', 'methods', 'FlaskConical'],
      ]),
      quarter(7, 2, 'Движение и силы', [
        ['Механическое движение', 'ДВИЖЕНИЕ', 'mechanics', 'MoveUpRight'],
        ['Скорость. Путь и время', 'СКОРОСТЬ', 'mechanics', 'Gauge'],
        ['Масса и плотность', 'ПЛОТНОСТЬ', 'mechanics', 'Scale'],
        ['Силы в природе', 'СИЛЫ', 'mechanics', 'Magnet'],
        ['Сила трения', 'ТРЕНИЕ', 'mechanics', 'Wind'],
      ]),
      quarter(7, 3, 'Давление', [
        ['Давление твёрдых тел', 'ДАВЛЕНИЕ', 'mechanics', 'Gauge'],
        ['Давление газа. Закон Паскаля', 'ПАСКАЛЬ', 'mechanics', 'Droplets'],
        ['Давление жидкости. Сообщающиеся сосуды', 'СОСУДЫ', 'mechanics', 'FlaskConical'],
        ['Атмосферное давление', 'АТМОСФЕРА', 'mechanics', 'CloudSun'],
        ['Архимедова сила и плавание тел', 'АРХИМЕД', 'mechanics', 'Anchor'],
      ]),
      quarter(7, 4, 'Работа и энергия', [
        ['Механическая работа', 'РАБОТА', 'mechanics', 'Cog'],
        ['Мощность', 'МОЩНОСТЬ', 'mechanics', 'Zap'],
        ['Кинетическая и потенциальная энергия', 'ЭНЕРГИЯ', 'mechanics', 'Battery'],
        ['Рычаг. Момент силы', 'РЫЧАГ', 'mechanics', 'Scale'],
        ['Блоки. Золотое правило механики. КПД', 'БЛОКИ', 'mechanics', 'RotateCw'],
      ]),
    ],
  },
  8: {
    id: 8,
    label: '8 класс',
    tagline: 'Тепло, электричество и свет вокруг нас',
    description: 'Тепловые явления, агрегатные состояния, электричество, магнетизм и оптика.',
    theme: 'g8',
    quarters: [
      quarter(8, 1, 'Тепловые явления', [
        ['Внутренняя энергия тела', 'ЭНЕРГИЯ', 'thermal', 'Thermometer'],
        ['Теплопроводность. Конвекция. Излучение', 'ТЕПЛОПЕРЕДАЧА', 'thermal', 'Flame'],
        ['Количество теплоты', 'ТЕПЛОТА', 'thermal', 'Droplets'],
        ['Удельная теплоёмкость', 'ТЕПЛОЁМКОСТЬ', 'thermal', 'Gauge'],
        ['Удельная теплота сгорания топлива', 'ТОПЛИВО', 'thermal', 'Fuel'],
      ]),
      quarter(8, 2, 'Агрегатные состояния', [
        ['Плавление и отвердевание', 'ПЛАВЛЕНИЕ', 'thermal', 'Snowflake'],
        ['Испарение, конденсация, кипение', 'ПАРООБРАЗОВАНИЕ', 'thermal', 'Droplets'],
        ['Удельная теплота парообразования', 'ПАР', 'thermal', 'Wind'],
        ['Влажность воздуха', 'ВЛАЖНОСТЬ', 'thermal', 'CloudSun'],
        ['Тепловые двигатели', 'ДВИГАТЕЛЬ', 'thermal', 'Car'],
      ]),
      quarter(8, 3, 'Электрические явления', [
        ['Электризация. Электрическое поле', 'ЗАРЯД', 'electricity', 'Zap'],
        ['Строение атома', 'АТОМ', 'electricity', 'Atom'],
        ['Сила тока и напряжение', 'ТОК', 'electricity', 'Gauge'],
        ['Сопротивление. Закон Ома', 'ЗАКОН ОМА', 'electricity', 'CircuitBoard'],
        ['Соединения проводников', 'СОЕДИНЕНИЯ', 'electricity', 'Plug'],
        ['Работа и мощность тока', 'МОЩНОСТЬ ТОКА', 'electricity', 'Battery'],
      ]),
      quarter(8, 4, 'Магнетизм и свет', [
        ['Магнитное поле. Постоянные магниты', 'МАГНИТ', 'electricity', 'Magnet'],
        ['Магнитное поле тока. Электромагнит', 'ЭЛЕКТРОМАГНИТ', 'electricity', 'Cog'],
        ['Свет. Отражение света', 'ОТРАЖЕНИЕ', 'optics', 'Sun'],
        ['Преломление света. Линзы', 'ЛИНЗЫ', 'optics', 'Eye'],
        ['Глаз и зрение. Оптические приборы', 'ЗРЕНИЕ', 'optics', 'Telescope'],
      ]),
    ],
  },
  9: {
    id: 9,
    label: '9 класс',
    tagline: 'Механика, волны и строение атома',
    description: 'Законы Ньютона, импульс, колебания, электромагнитное поле и атомное ядро.',
    theme: 'g9',
    quarters: [
      quarter(9, 1, 'Законы движения', [
        ['Система отсчёта. Перемещение', 'ПЕРЕМЕЩЕНИЕ', 'mechanics', 'Compass'],
        ['Равноускоренное движение', 'УСКОРЕНИЕ', 'mechanics', 'Gauge'],
        ['Законы Ньютона', 'НЬЮТОН', 'mechanics', 'Cog'],
        ['Свободное падение. Движение по окружности', 'ПАДЕНИЕ', 'mechanics', 'Orbit'],
        ['Импульс. Закон сохранения импульса', 'ИМПУЛЬС', 'mechanics', 'Rocket'],
      ]),
      quarter(9, 2, 'Колебания и волны', [
        ['Механические колебания. Маятники', 'КОЛЕБАНИЯ', 'waves', 'Activity'],
        ['Вынужденные колебания. Резонанс', 'РЕЗОНАНС', 'waves', 'Waves'],
        ['Механические волны. Длина волны', 'ВОЛНЫ', 'waves', 'Waves'],
        ['Звук и его характеристики', 'ЗВУК', 'waves', 'AudioLines'],
        ['Отражение звука. Эхо', 'ЭХО', 'waves', 'Radio'],
      ]),
      quarter(9, 3, 'Электромагнитное поле', [
        ['Магнитное поле и его свойства', 'МАГНИТ', 'electricity', 'Magnet'],
        ['Электромагнитная индукция', 'ИНДУКЦИЯ', 'electricity', 'Cable'],
        ['Переменный ток. Электромагнитные волны', 'ПЕРЕМЕННЫЙ ТОК', 'electricity', 'Radio'],
        ['Отражение и преломление света', 'СВЕТ', 'optics', 'Eye'],
        ['Дисперсия света. Спектры', 'СПЕКТРЫ', 'optics', 'Sun'],
      ]),
      quarter(9, 4, 'Атомное ядро', [
        ['Радиоактивность. Модель Резерфорда', 'РАДИОАКТИВНОСТЬ', 'quantum', 'Radiation'],
        ['Состав атомного ядра. Изотопы', 'ЯДРО', 'quantum', 'Atom'],
        ['Ядерные реакции. Энергия связи', 'РЕАКЦИИ', 'quantum', 'Zap'],
        ['Деление урана. Ядерный реактор', 'РЕАКТОР', 'quantum', 'CircuitBoard'],
        ['Биологическое действие радиации', 'РАДИАЦИЯ', 'quantum', 'Shield'],
      ]),
    ],
  },
  10: {
    id: 10,
    label: '10 класс',
    tagline: 'От движения тел до электрических цепей',
    description: 'Кинематика, динамика, законы сохранения, МКТ, термодинамика и электродинамика.',
    theme: 'g10',
    quarters: [
      quarter(10, 1, 'Кинематика и динамика', [
        ['Кинематика. Перемещение и путь', 'КИНЕМАТИКА', 'mechanics', 'Compass'],
        ['Равноускоренное движение. Свободное падение', 'УСКОРЕНИЕ', 'mechanics', 'Gauge'],
        ['Движение по окружности', 'ОКРУЖНОСТЬ', 'mechanics', 'RotateCw'],
        ['Законы Ньютона. Силы в природе', 'ДИНАМИКА', 'mechanics', 'Cog'],
      ]),
      quarter(10, 2, 'Законы сохранения и МКТ', [
        ['Импульс. Реактивное движение', 'ИМПУЛЬС', 'mechanics', 'Rocket'],
        ['Работа, мощность, энергия', 'ЭНЕРГИЯ', 'mechanics', 'Battery'],
        ['Основы МКТ. Основное уравнение МКТ', 'МКТ', 'molecular', 'Atom'],
        ['Газовые законы. Изопроцессы', 'ГАЗЫ', 'molecular', 'Gauge'],
      ]),
      quarter(10, 3, 'Термодинамика и электростатика', [
        ['Первый закон термодинамики', 'ТЕРМОДИНАМИКА', 'thermal', 'Thermometer'],
        ['Тепловые двигатели и КПД', 'ТЕПЛОВЫЕ МАШИНЫ', 'thermal', 'Car'],
        ['Закон Кулона. Напряжённость поля', 'КУЛОН', 'electricity', 'Zap'],
        ['Конденсаторы. Электроёмкость', 'КОНДЕНСАТОР', 'electricity', 'Battery'],
      ]),
      quarter(10, 4, 'Электрический ток', [
        ['Закон Ома для полной цепи', 'ЗАКОН ОМА', 'electricity', 'CircuitBoard'],
        ['Соединения проводников', 'СОЕДИНЕНИЯ', 'electricity', 'Plug'],
        ['Работа и мощность тока', 'МОЩНОСТЬ', 'electricity', 'Zap'],
        ['Электрический ток в различных средах', 'ТОК В СРЕДАХ', 'electricity', 'Waves'],
      ]),
    ],
  },
  11: {
    id: 11,
    label: '11 класс',
    tagline: 'Индукция, кванты и загадки Вселенной',
    description: 'Магнетизм, индукция, волны и оптика, СТО, квантовая физика, ядро и астрономия.',
    theme: 'g11',
    quarters: [
      quarter(11, 1, 'Магнетизм и индукция', [
        ['Магнитное поле. Сила Ампера', 'АМПЕР', 'electricity', 'Magnet'],
        ['Сила Лоренца', 'ЛОРЕНЦ', 'electricity', 'Orbit'],
        ['Электромагнитная индукция. Закон Фарадея', 'ИНДУКЦИЯ', 'electricity', 'Cable'],
        ['Самоиндукция. Индуктивность', 'САМОИНДУКЦИЯ', 'electricity', 'RotateCw'],
      ]),
      quarter(11, 2, 'Колебания, волны, оптика', [
        ['Электромагнитные колебания. Переменный ток', 'ПЕРЕМЕННЫЙ ТОК', 'waves', 'Activity'],
        ['Трансформатор. Передача энергии', 'ТРАНСФОРМАТОР', 'electricity', 'Zap'],
        ['Электромагнитные волны. Радиосвязь', 'РАДИОВОЛНЫ', 'waves', 'Radio'],
        ['Интерференция, дифракция, дисперсия', 'ВОЛНОВАЯ ОПТИКА', 'optics', 'Aperture'],
        ['Элементы СТО', 'СТО', 'mechanics', 'Timer'],
      ]),
      quarter(11, 3, 'Квантовая физика', [
        ['Фотоэффект. Уравнение Эйнштейна', 'ФОТОЭФФЕКТ', 'quantum', 'Lightbulb'],
        ['Фотон. Давление света', 'ФОТОН', 'quantum', 'Sun'],
        ['Модель атома Бора. Спектры', 'АТОМ БОРА', 'quantum', 'Atom'],
        ['Радиоактивность. Ядерные реакции', 'ЯДРО', 'quantum', 'Radiation'],
        ['Лазеры', 'ЛАЗЕР', 'quantum', 'Zap'],
      ]),
      quarter(11, 4, 'Ядро и Вселенная', [
        ['Энергия связи. Дефект масс', 'ЭНЕРГИЯ СВЯЗИ', 'quantum', 'Atom'],
        ['Закон радиоактивного распада', 'РАСПАД', 'quantum', 'Timer'],
        ['Элементарные частицы', 'ЧАСТИЦЫ', 'quantum', 'Sparkles'],
        ['Астрономия и космология', 'ВСЕЛЕННАЯ', 'astronomy', 'Orbit'],
      ]),
    ],
  },
}

export const GRADE_LIST: Grade[] = [7, 8, 9, 10, 11].map((g) => GRADES[g as GradeId])

export const ALL_TOPICS: Topic[] = GRADE_LIST.flatMap((g) =>
  g.quarters.flatMap((q) => q.topics),
)

export const TOPIC_BY_ID: Record<string, Topic> = Object.fromEntries(
  ALL_TOPICS.map((t) => [t.id, t]),
)

export const QUARTER_LABELS = ['I', 'II', 'III', 'IV']

export const topicsOfGrade = (grade: GradeId): Topic[] =>
  GRADES[grade].quarters.flatMap((q) => q.topics)

export const topicsOfQuarter = (grade: GradeId, quarterNumber: number): Topic[] =>
  GRADES[grade].quarters.find((q) => q.number === quarterNumber)?.topics ?? []

export const allTopicsOfGrades = (grades: GradeId[]): Topic[] =>
  grades.flatMap((g) => topicsOfGrade(g))

export const topicGrade = (topic: Topic): string => `${topic.grade} класс`

export const topicSearchKey = (topic: Topic): string => `${topic.title} ${topic.short}`

export const formatTopicRange = (topics: Topic[]): string => {
  const grades = [...new Set(topics.map((t) => t.grade))].sort((a, b) => a - b)
  if (grades.length === 0) return 'Темы не выбраны'
  if (grades.length === 1) return `${grades[0]} класс`
  return `${grades[0]}–${grades[grades.length - 1]} классы`
}
