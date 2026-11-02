// Базовый банк рабочих листов (7-9 классы, 3-я четверть)
// Соответствует заданиям и дескрипторам из Приложения Г

export const WORKSHEETS = [
  // Рабочий лист 1 (7 класс)
  {
    id: 1,
    grade: 7,
    sheetNumber: 1,
    title: "Разветвляющиеся алгоритмы и типы данных на языке Python",
    topic: "Программирование ветвящихся алгоритмов на языке Python",
    learningObjectives: "7.3.2.1, 7.3.3.1",
    tasks: [
      {
        id: "1-1",
        taskNumber: 1,
        type: "trace",
        title: "Задание 1. Определение стоимости горячего обеда в школьной столовой",
        model: "Ручная пошаговая трассировка ветвлений",
        description: "Стоимость обеда зависит от возраста v и социальной карты k (1 - есть, 0 - нет). Выполните пошаговую трассировку программы для четырех тестовых ситуаций и заполните таблицу результатов.",
        code: `v = int(input())
k = int(input())
if v < 7:
    cost = 0
elif v <= 11:
    if k == 1:
        cost = 250
    else:
        cost = 450
elif v <= 17:
    if k == 1:
        cost = 350
    else:
        cost = 600
else:
    cost = 800
print(cost)`,
        defaultInputs: ["6", "0"],
        traceTests: [
          { testNum: 1, inputs: "v = 6, k = 0", branchHint: "if v < 7", expectedBranch: "v < 7", expectedCost: 0, points: 0.5 },
          { testNum: 2, inputs: "v = 10, k = 1", branchHint: "elif v <= 11 -> if k == 1", expectedBranch: "k == 1", expectedCost: 250, points: 0.5 },
          { testNum: 3, inputs: "v = 14, k = 0", branchHint: "elif v <= 17 -> else", expectedBranch: "else", expectedCost: 600, points: 0.5 },
          { testNum: 4, inputs: "v = 18, k = 1", branchHint: "else", expectedBranch: "else", expectedCost: 800, points: 0.5 }
        ],
        conceptQuestion: {
          text: "Почему при возрасте v = 6 значение социальной карты k не влияет на итоговую стоимость обеда?",
          keywords: ["первое условие", "v < 7", "сразу", "выход", "минуя", "раньше", "истинно"],
          modelAnswer: "При v = 6 первое условие v < 7 истинно, сразу выполняется присваивание cost = 0, а все последующие блоки elif и else пропускаются.",
          points: 1
        }
      },
      {
        id: "1-2",
        taskNumber: 2,
        type: "debug",
        title: "Задание 2. Поиск и исправление ошибки в калькуляторе возраста",
        model: "Направленная отладка (дебаггинг)",
        description: "Программа Армана должна проверять совершеннолетие при 18 годах, но вылетает с ошибкой при запуске. Найдите причину ошибки и исправьте код.",
        buggyCode: `current_year = input()
birth_year = input()
age = current_year - birth_year
if age >= 18:
    print("Доступ разрешен")
else:
    print("Доступ ограничен")`,
        questions: [
          {
            id: "q1",
            text: "В каких строках допущена ошибка?",
            expected: "1, 2",
            points: 1
          },
          {
            id: "q2",
            text: "Какая ошибка возникает и почему?",
            expected: "TypeError: функция input() возвращает строковый тип данных (str), вычитание строк невозможно.",
            points: 2
          }
        ],
        fixedCodeTemplate: `current_year = int(input())\nbirth_year = int(input())\nage = current_year - birth_year\nif age >= 18:\n    print("Доступ разрешен")\nelse:\n    print("Доступ ограничен")`,
        testInputs: ["2026", "2008"],
        expectedOutput: "Доступ разрешен",
        points: 2
      }
    ],
    rubric: [
      { criterion: "Трассировка ветвления", descriptor: "Определяет значение cost для тестов 1 и 2", points: 1 },
      { criterion: "Трассировка ветвления", descriptor: "Определяет значение cost для тестов 3 и 4", points: 1 },
      { criterion: "Трассировка ветвления", descriptor: "Объясняет независимость тарифа для дошкольного возраста", points: 1 },
      { criterion: "Трассировка ветвления", descriptor: "Понимает логику вложенного ветвления внутри блока elif", points: 2 },
      { criterion: "Поиск и исправление ошибок", descriptor: "Точно указывает номера строк с некорректным типом данных", points: 1 },
      { criterion: "Поиск и исправление ошибок", descriptor: "Объясняет причину ошибки при вычитании текстовых строк", points: 2 },
      { criterion: "Поиск и исправление ошибок", descriptor: "Записывает верное преобразование функцией int", points: 2 }
    ]
  },

  // Рабочий лист 2 (7 класс)
  {
    id: 2,
    grade: 7,
    sheetNumber: 2,
    title: "Сложные условия, вложенные ветвления и проверка данных",
    topic: "Вложенные условия и логические выражения в Python",
    learningObjectives: "7.3.2.1, 7.3.3.1",
    tasks: [
      {
        id: "2-1",
        taskNumber: 1,
        type: "constraint",
        title: "Задание 1. Поиск наибольшего из трех чисел без функции max и оператора and",
        model: "Задачи с жесткими дидактическими ограничениями",
        description: "Напишите программу, принимающую числа a, b, c и выводящую наибольшее из них. ДИДАКТИЧЕСКИЙ ЗАПРЕТ: строго запрещено использовать max, min, and, циклы for/while и списки. Используйте только вложенные конструкции if-else.",
        bannedKeywords: ["max", "min", "and", "for", "while", "[", "]", "sorted"],
        starterCode: `a = int(input())
b = int(input())
c = int(input())

# Напишите алгоритм поиска максимума на вложенных if-else:
if a > b:
    if a > c:
        maximum = a
    else:
        maximum = c
else:
    if b > c:
        maximum = b
    else:
        maximum = c

print(maximum)`,
        testCases: [
          { inputs: ["5", "9", "2"], expected: "9" },
          { inputs: ["15", "4", "7"], expected: "15" },
          { inputs: ["3", "8", "21"], expected: "21" }
        ],
        points: 5
      },
      {
        id: "2-2",
        taskNumber: 2,
        type: "constraint",
        title: "Задание 2. Расчет стоимости проезда в городском автобусе",
        model: "Практико-ориентированная задача",
        description: "Тарифы: до 7 лет - бесплатно (0); от 7 до 15 лет включительно: по карте 50 тг, наличными 100 тг; от 16 лет: по карте 100 тг, наличными 200 тг. Запросите возраст age и способ card ('карта' или 'наличные'), выведите стоимость билета.",
        starterCode: `age = int(input())
card = input()

if age < 7:
    price = 0
elif age <= 15:
    if card == "карта":
        price = 50
    else:
        price = 100
else:
    if card == "карта":
        price = 100
    else:
        price = 200

print(price)`,
        conceptQuestion: {
          text: "Почему в ветке elif age <= 15 не нужно повторно проверять условие age >= 7?",
          expected: "Потому что все значения age < 7 уже были отсеяны предыдущим блоком if age < 7."
        },
        testCases: [
          { inputs: ["5", "наличные"], expected: "0" },
          { inputs: ["12", "карта"], expected: "50" },
          { inputs: ["12", "наличные"], expected: "100" },
          { inputs: ["20", "карта"], expected: "100" },
          { inputs: ["20", "наличные"], expected: "200" }
        ],
        points: 5
      }
    ],
    rubric: [
      { criterion: "Вложенные ветвления", descriptor: "Организует корректный ввод трех целых чисел", points: 1 },
      { criterion: "Вложенные ветвления", descriptor: "Строит корректную структуру if-else без запрещенных элементов", points: 2 },
      { criterion: "Вложенные ветвления", descriptor: "Находит максимум при всех возможных соотношениях чисел", points: 2 },
      { criterion: "Практическая задача", descriptor: "Верно запрашивает и обрабатывает числовые и строковые данные", points: 1 },
      { criterion: "Практическая задача", descriptor: "Реализует ветвление по возрасту и способу оплаты", points: 2 },
      { criterion: "Практическая задача", descriptor: "Выводит точные тарифы в соответствии с условием", points: 1 },
      { criterion: "Обоснование логики", descriptor: "Объясняет работу цепочки elif без избыточных проверок", points: 1 }
    ]
  },

  // Рабочий лист 3 (8 класс)
  {
    id: 3,
    grade: 8,
    sheetNumber: 3,
    title: "Программирование циклов со счетчиком for в Python",
    topic: "Цикл со счетчиком for и функция range",
    learningObjectives: "8.3.3.1, 8.3.3.2",
    tasks: [
      {
        id: "3-1",
        taskNumber: 1,
        type: "trace",
        title: "Задание 1. Подсчет нечетных кругов на тренировке",
        model: "Ручная пошаговая трассировка цикла со счетчиком",
        description: "Спортсмен пробегает k кругов. Программа суммирует только нечетные номера. Заполните таблицу для k = 5.",
        code: `k = 5
s = 0
for i in range(1, k + 1):
    if i % 2 != 0:
        s = s + i
print(s)`,
        traceSteps: [
          { step: 1, i: 1, cond: "1 % 2 != 0 -> Да", s: 1, points: 0.5 },
          { step: 2, i: 2, cond: "2 % 2 != 0 -> Нет", s: 1, points: 0.5 },
          { step: 3, i: 3, cond: "3 % 2 != 0 -> Да", s: 4, points: 1 },
          { step: 4, i: 4, cond: "4 % 2 != 0 -> Нет", s: 4, points: 1 },
          { step: 5, i: 5, cond: "5 % 2 != 0 -> Да", s: 9, points: 1 }
        ],
        points: 4
      },
      {
        id: "3-2",
        taskNumber: 2,
        type: "debug",
        title: "Задание 2. Ошибка границы диапазона на конвейере",
        model: "Направленная отладка",
        description: "Конвейер должен проверить 10 пачек продукции с номерами от 1 до 10. Найдите ошибку в коде: программа проверяет только 9 пачек.",
        buggyCode: `for box in range(1, 10):
    print("Пачка №", box)
print("Партия проверена!")`,
        questions: [
          { id: "q1", text: "Сколько пачек проверит программа?", expected: "9", points: 1 },
          { id: "q2", text: "В чем причина ошибки? Правило range:", expected: "Правая граница функции range(start, stop) не включается в диапазон.", points: 1 },
          { id: "q3", text: "Запишите верный заголовок for:", expected: "for box in range(1, 11):", points: 1 }
        ],
        points: 3
      },
      {
        id: "3-3",
        taskNumber: 3,
        type: "constraint",
        title: "Задание 3. Вывод согласных букв слова",
        model: "Дидактические ограничения",
        description: "Пользователь вводит слово заглавными буквами. Выведите все согласные через пробел. Условие: решите задачу без использования команды continue.",
        bannedKeywords: ["continue"],
        starterCode: `word = input()
vowels = "АЕЁИОУЫЭЮЯ"
for char in word:
    if char not in vowels:
        print(char, end=" ")`,
        points: 3
      }
    ],
    rubric: [
      { criterion: "Трассировка for", descriptor: "Верно определяет начальные значения и диапазон шагов", points: 1 },
      { criterion: "Трассировка for", descriptor: "Безошибочно вычисляет условие четности на каждом шаге", points: 1 },
      { criterion: "Трассировка for", descriptor: "Фиксирует промежуточные и итоговое значение накопителя s", points: 2 },
      { criterion: "Поиск и исправление ошибок", descriptor: "Определяет неполноту выполнения цикла (9 вместо 10)", points: 1 },
      { criterion: "Поиск и исправление ошибок", descriptor: "Формулирует правило невключения правой границы в range", points: 1 },
      { criterion: "Поиск и исправление ошибок", descriptor: "Записывает верный заголовок range(1, 11)", points: 1 },
      { criterion: "Алгоритмизация", descriptor: "Реализует посимвольный перебор строки без continue", points: 3 }
    ]
  },

  // Рабочий лист 4 (8 класс)
  {
    id: 4,
    grade: 8,
    sheetNumber: 4,
    title: "Циклы с условием while и управление итерациями",
    topic: "Программирование циклов с условием while, операторы break и continue",
    learningObjectives: "8.3.3.1, 8.3.3.2",
    tasks: [
      {
        id: "4-1",
        taskNumber: 1,
        type: "debug",
        title: "Задание 1. Ошибка зависания в цикле while",
        model: "Направленная отладка",
        description: "Программа должна выводить нечетные числа от 1 до 10, но бесконечно зависает. Найдите причину ошибки и исправьте код.",
        buggyCode: `i = 1
while i <= 10:
    if i % 2 == 0:
        continue
    print("Нечетное:", i)
    i = i + 1`,
        questions: [
          { id: "q1", text: "При каком значении i программа зацикливается?", expected: "2", points: 1 },
          { id: "q2", text: "Какая строка блокирует шаг увеличения i?", expected: "Оператор continue на строке 4 пропускает строку увеличения i = i + 1.", points: 1 },
          { id: "q3", text: "Как исправить фрагмент?", expected: "Перенести i = i + 1 до условия continue, либо увеличивать шаг в начале тела цикла.", points: 2 }
        ],
        fixedCodeTemplate: `i = 1
while i <= 10:
    if i % 2 == 0:
        i = i + 1
        continue
    print("Нечетное:", i)
    i = i + 1`,
        points: 4
      },
      {
        id: "4-2",
        taskNumber: 2,
        type: "constraint",
        title: "Задание 2. Контроль карманных расходов с бюджетом 1000 тенге",
        model: "Практико-ориентированная задача",
        description: "Бюджет 1000 тенге. Вводятся цены покупок. Если цена больше остатка, покупка отменяется, цикл продолжается. При нулевом остатке цикл завершается по break.",
        starterCode: `budget = 1000
while budget > 0:
    price = int(input())
    if price > budget:
        print("Недостаточно средств")
        continue
    budget = budget - price
    print("Остаток:", budget)
    if budget == 0:
        print("Бюджет исчерпан")
        break`,
        points: 3
      },
      {
        id: "4-3",
        taskNumber: 3,
        type: "constraint",
        title: "Задание 3. Контроль качества молока с конструкцией else",
        model: "Алгоритм с блоком else цикла",
        description: "Проверяется партия из 5 пачек (статус 1 - норма, 0 - брак). При браке - аварийный выход по break. Если вся партия без брака - вывод поздравления через блок else цикла.",
        starterCode: `for box in range(1, 6):
    status = int(input())
    if status == 0:
        print("Обнаружен брак в пачке №", box)
        break
else:
    print("Вся партия проверена успешно!")`,
        points: 3
      }
    ],
    rubric: [
      { criterion: "Поиск и исправление ошибок", descriptor: "Указывает точное значение переменной i = 2 при зацикливании", points: 1 },
      { criterion: "Поиск и исправление ошибок", descriptor: "Объясняет пропуск инкремента из-за срабатывания continue", points: 1 },
      { criterion: "Поиск и исправление ошибок", descriptor: "Корректно переносит инкремент до ветвления continue", points: 2 },
      { criterion: "Управление циклом while", descriptor: "Организует цикл с уменьшением баланса", points: 1 },
      { criterion: "Управление циклом while", descriptor: "Реализует пропуск покупки при нехватке средств и выход по break", points: 2 },
      { criterion: "Конструкция else в циклах", descriptor: "Применяет прерывание break при обнаружении брака", points: 1 },
      { criterion: "Конструкция else в циклах", descriptor: "Использует блок else цикла для фиксации безаварийного прогона", points: 2 }
    ]
  },

  // Рабочий лист 5 (9 класс)
  {
    id: 5,
    grade: 9,
    sheetNumber: 5,
    title: "Одномерные массивы: поиск элементов и экстремумов",
    topic: "Одномерные массивы, алгоритмы поиска максимума и минимума",
    learningObjectives: "9.3.3.1, 9.3.3.2",
    tasks: [
      {
        id: "5-1",
        taskNumber: 1,
        type: "trace",
        title: "Задание 1. Поиск наибольшего числа в списке",
        model: "Пошаговая трассировка обработки списков",
        description: "Дан список a = [14, 28, 9, 31, 22]. Заполните таблицу пошагового выполнения программы поиска максимума.",
        code: `a = [14, 28, 9, 31, 22]
m = a[0]
for i in range(1, len(a)):
    if a[i] > m:
        m = a[i]
print(m)`,
        traceSteps: [
          { step: 0, i: "-", elem: "a[0] = 14", cond: "-", m: 14 },
          { step: 1, i: 1, elem: "a[1] = 28", cond: "28 > 14 -> Да", m: 28 },
          { step: 2, i: 2, elem: "a[2] = 9", cond: "9 > 28 -> Нет", m: 28 },
          { step: 3, i: 3, elem: "a[3] = 31", cond: "31 > 28 -> Да", m: 31 },
          { step: 4, i: 4, elem: "a[4] = 22", cond: "22 > 31 -> Нет", m: 31 }
        ],
        points: 3
      },
      {
        id: "5-2",
        taskNumber: 2,
        type: "debug",
        title: "Задание 2. Ошибки выхода за границы списка и неверного минимума",
        model: "Направленная отладка",
        description: "В программе поиска минимума для a = [18, 42, 7, 25, 33] допущены две ошибки. Найдите и исправьте их.",
        buggyCode: `a = [18, 42, 7, 25, 33]
minimum = 0
for i in range(0, len(a) + 1):
    if a[i] < minimum:
        minimum = a[i]
print(minimum)`,
        questions: [
          { id: "q1", text: "Почему возникает IndexError?", expected: "len(a) + 1 пытается обратиться к несуществующему индексу 5 (индексы от 0 до 4).", points: 1 },
          { id: "q2", text: "В чем ошибка minimum = 0?", expected: "Если в списке только положительные числа, условие a[i] < 0 никогда не выполнится, ответ будет 0 вместо 7.", points: 1 },
          { id: "q3", text: "Запишите верные строки инициализации и цикла:", expected: "minimum = a[0] и for i in range(1, len(a)):", points: 2 }
        ],
        points: 4
      },
      {
        id: "5-3",
        taskNumber: 3,
        type: "constraint",
        title: "Задание 3. Поиск второго по величине числа без сортировки",
        model: "Дидактические ограничения",
        description: "Дан список чисел. Найдите второй по величине элемент. Условие: запрещено использовать max, min, sort, sorted. Решите за один проход с переменными max1 и max2.",
        bannedKeywords: ["max", "min", "sort", "sorted"],
        starterCode: `a = [14, 28, 9, 31, 22]
if a[0] > a[1]:
    max1 = a[0]
    max2 = a[1]
else:
    max1 = a[1]
    max2 = a[0]

for i in range(2, len(a)):
    x = a[i]
    if x > max1:
        max2 = max1
        max1 = x
    elif x > max2:
        max2 = x

print(max2)`,
        points: 3
      }
    ],
    rubric: [
      { criterion: "Трассировка списков", descriptor: "Корректно сопоставляет индексы с элементами списка", points: 1 },
      { criterion: "Трассировка списков", descriptor: "Фиксирует обновление переменной максимума m", points: 2 },
      { criterion: "Поиск и исправление ошибок", descriptor: "Объясняет причину IndexError (выход индекса за len(a)-1)", points: 1 },
      { criterion: "Поиск и исправление ошибок", descriptor: "Объясняет логическую ошибку инициализации minimum = 0", points: 1 },
      { criterion: "Поиск и исправление ошибок", descriptor: "Записывает верные строки инициализации и заголовка for", points: 2 },
      { criterion: "Алгоритмы без сортировки", descriptor: "Инициализирует переменные max1 и max2 первыми элементами", points: 1 },
      { criterion: "Алгоритмы без сортировки", descriptor: "Реализует корректное смещение максимумов за один проход", points: 2 }
    ]
  },

  // Рабочий лист 6 (9 класс)
  {
    id: 6,
    grade: 9,
    sheetNumber: 6,
    title: "Обработка списков и алгоритмы сортировки",
    topic: "Обработка массивов данных и алгоритмы сортировки в Python",
    learningObjectives: "9.3.3.1, 9.3.3.2",
    tasks: [
      {
        id: "6-1",
        taskNumber: 1,
        type: "constraint",
        title: "Задание 1. Обработка оценок журнала BilimClass",
        model: "Агрегирование данных с ограничениями",
        description: "Дан список оценок учеников. Напишите программу, которая: 1) подсчитывает отличников (оценки 9 и 10); 2) вычисляет средний балл класса БЕЗ функции sum; 3) выводит группу риска (оценки ниже 4).",
        bannedKeywords: ["sum"],
        starterCode: `grades = [10, 8, 9, 3, 7, 10, 2, 8]

# 1. Отличники
otl = 0
# 2. Сумма для среднего балла
total = 0
for g in grades:
    if g >= 9:
        otl = otl + 1
    total = total + g

avg = total / len(grades)
print("Отличников:", otl)
print("Средний балл:", avg)

# 3. Группа риска (< 4)
risk = []
for g in grades:
    if g < 4:
        risk.append(g)
print("Группа риска:", risk)`,
        points: 6
      },
      {
        id: "6-2",
        taskNumber: 2,
        type: "trace",
        title: "Задание 2. Один проход пузырьковой сортировки",
        model: "Пошаговая трассировка сортировки",
        description: "Дан список a = [7, 2, 8, 1, 5]. Выполняется один проход внешнего цикла сортировки. Заполните таблицу сравнений пар.",
        code: `a = [7, 2, 8, 1, 5]
for j in range(len(a) - 1):
    if a[j] > a[j + 1]:
        t = a[j]
        a[j] = a[j + 1]
        a[j + 1] = t
print(a)`,
        bubbleSteps: [
          { j: 0, pair: "(7, 2)", cmp: "7 > 2 -> Да", swap: "Да", listState: "[2, 7, 8, 1, 5]" },
          { j: 1, pair: "(7, 8)", cmp: "7 > 8 -> Нет", swap: "Нет", listState: "[2, 7, 8, 1, 5]" },
          { j: 2, pair: "(8, 1)", cmp: "8 > 1 -> Да", swap: "Да", listState: "[2, 7, 1, 8, 5]" },
          { j: 3, pair: "(8, 5)", cmp: "8 > 5 -> Да", swap: "Да", listState: "[2, 7, 1, 5, 8]" }
        ],
        conceptQuestion: {
          text: "Почему наибольший элемент оказывается в самом конце списка после первого прохода?",
          expected: "Потому что при каждом сравнении наибольший элемент непрерывно перемещается вправо до конца массива (всплывает)."
        },
        points: 4
      }
    ],
    rubric: [
      { criterion: "Агрегирование данных", descriptor: "Организует корректный ввод оценок в список", points: 1 },
      { criterion: "Агрегирование данных", descriptor: "Подсчитывает количество отличников через условие", points: 2 },
      { criterion: "Агрегирование данных", descriptor: "Вычисляет средний балл накопителем без вызова sum()", points: 2 },
      { criterion: "Агрегирование данных", descriptor: "Формирует список или вывод группы риска с оценками < 4", points: 1 },
      { criterion: "Сортировка пузырьком", descriptor: "Последовательно сопоставляет соседние пары элементов", points: 1 },
      { criterion: "Сортировка пузырьком", descriptor: "Фиксирует состояние массива после каждого обмена", points: 2 },
      { criterion: "Сортировка пузырьком", descriptor: "Определяет всплывший максимальный элемент в конце списка", points: 1 }
    ]
  },

  // Рабочий лист 7 (9 класс)
  {
    id: 7,
    grade: 9,
    sheetNumber: 7,
    title: "Решение задач на списки с помощью искусственного интеллекта",
    topic: "Обработка списков в Python и критическое использование нейросетей",
    learningObjectives: "9.3.3.1, 9.3.3.2",
    tasks: [
      {
        id: "7-1",
        taskNumber: 1,
        type: "audit",
        title: "Задание 1. Аудит программы нейросети на школьные ограничения",
        model: "Критический аудит кода генеративного ИИ",
        description: "Условие: дан список дневных температур за неделю. Нужно найти среднюю температуру БЕЗ функции sum и вывести дни с температурой выше средней. Нейросеть сгенерировала код через sum() и list comprehension. Проведите аудит.",
        aiPrompt: "Напиши на Python: дан список температур temps = [18, 21, 19, 24, 22, 17, 25]. Найди дни с температурой выше средней, без функции sum.",
        aiOutputCode: `# Ответ нейросети ChatGPT:
temps = [18, 21, 19, 24, 22, 17, 25]
avg = sum(temps) / len(temps)
hot_days = [i + 1 for i, t in enumerate(temps) if t > avg]
print("Средняя:", avg)
print("Дни выше средней:", hot_days)`,
        aiDefects: [
          "Нейросеть проигнорировала запрет 'без функции sum' и использовала sum(temps)",
          "Использован синтаксис list comprehension, усложняющий понимание для 9 класса",
          "Использована встроенная функция enumerate(), не входящая в базовый ТУП"
        ],
        points: 5
      },
      {
        id: "7-2",
        taskNumber: 2,
        type: "constraint",
        title: "Задание 2. Своя программа по школьной программе",
        model: "Каноническое решение на школьных алгоритмических структурах",
        description: "Напишите правильный вариант программы на базовом школьном Python: вычислите сумму через цикл for, найдите среднее, затем вторым циклом выведите дни с температурой выше средней.",
        bannedKeywords: ["sum", "enumerate", "[i for"],
        starterCode: `temps = [18, 21, 19, 24, 22, 17, 25]

# 1. Находим сумму температур через цикл
total = 0
for t in temps:
    total = total + t

avg = total / len(temps)
print("Средняя температура:", avg)

# 2. Выводим номера дней (начиная с 1)
print("Дни выше средней:")
for i in range(len(temps)):
    if temps[i] > avg:
        print("День", i + 1, ":", temps[i])`,
        points: 5
      }
    ],
    rubric: [
      { criterion: "Запрос к нейросети", descriptor: "Составляет понятный запрос к нейросети по условию задачи", points: 1 },
      { criterion: "Проверка ответа", descriptor: "Находит в коде нейросети неизученные функции или сложные конструкции", points: 2 },
      { criterion: "Проверка ответа", descriptor: "Проверяет соблюдение условия задачи без использования функции sum", points: 2 },
      { criterion: "Своя программа", descriptor: "Находит сумму элементов и среднее арифметическое через цикл", points: 2 },
      { criterion: "Своя программа", descriptor: "Сравнивает элементы списка со средним значением и выводит нужные дни", points: 2 },
      { criterion: "Сравнение решений", descriptor: "Объясняет, почему сгенерированный код требует обязательной проверки", points: 1 }
    ]
  }
];
