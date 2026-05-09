# Stage 7.1 — Frontend UI Contract Restoration Patch Prompt

## Роль

Ты — senior frontend engineer и product-quality engineer. Работаешь в проекте `repairbuildx_rag_fullstack_app`.

Текущая ветка:

```text
feat/stage7-1-ui-contract-restoration
```

Главный документ контракта:

```text
docs/UI_CONTRACT_V1.md
```

## Цель

Переработать frontend-интерфейс так, чтобы он соответствовал `UI_CONTRACT_V1.md`.

Важно: не делать косметику. Нужно восстановить правильную доменную форму, близкую к Colab-логике, но в production web-формате.

Сейчас интерфейс слишком слабый: он собирает мало данных, смешивает `room_type`, `room_shape`, `zone_type`, оставляет проёмы в JSON, не имеет инженерных блоков, состояния помещения, уровня ремонта и требований пользователя.

## Критическая проблема

Текущий UI позволяет выбрать форму помещения, но backend/логика не всегда считают её корректно. Особенно критично: круглая комната не должна считаться как прямоугольная.

Нельзя оставлять поведение, где интерфейс обещает поддержку формы/поля, а backend считает по другой модели.

---

# Задача 1. Перестроить структуру формы

В интерфейсе должны быть блоки:

```text
1. Тип помещения
2. Зона эксплуатации
3. Форма помещения
4. Размеры
5. Проёмы
6. Пол
7. Стены
8. Потолок
9. Инженерные системы
10. Состояние и уровень ремонта
11. Требования пользователя
12. Вопрос консультанту
13. Кнопка “Сформировать консультацию”
```

---

# Задача 2. Добавить `room_type`

Добавить обязательное поле:

```text
room_type
```

Допустимые значения:

```text
кухня
ванная
санузел
спальня
гостиная
коридор
прихожая
детская
кабинет
балкон
лоджия
кладовая
гардеробная
техническое помещение
```

---

# Задача 3. Добавить автосвязку `room_type → zone_type`

При выборе `room_type` автоматически подставлять `zone_type`:

```text
кухня → кухонная зона
ванная → влажная зона
санузел → влажная зона
спальня → сухая зона
гостиная → сухая зона
детская → сухая зона
кабинет → сухая зона
коридор → проходная сухая зона
прихожая → проходная сухая зона
балкон → балконная зона
лоджия → балконная зона
кладовая → сухая зона
гардеробная → сухая зона
техническое помещение → техническая зона
```

Пользователь может изменить зону вручную, но UI должен показать warning:

```text
Вы изменили рекомендуемую зону. Проверьте, соответствует ли она условиям эксплуатации помещения.
```

---

# Задача 4. Разделить `room_type`, `zone_type`, `room_shape`

Нельзя смешивать тип помещения и форму помещения.

Правильно:

```text
room_type = кухня
zone_type = кухонная зона
room_shape = прямоугольная
```

---

# Задача 5. Сделать динамические поля размеров

## Если `room_shape = прямоугольная`

Показывать:

```text
length
width
height
```

Payload:

```json
"dimensions": {
  "length": 5.0,
  "width": 4.0,
  "height": 2.8
}
```

## Если `room_shape = круглая`

Показывать:

```text
diameter
height
```

Payload:

```json
"dimensions": {
  "diameter": 6.0,
  "height": 2.8
}
```

Не показывать `length` и `width` как основные поля для круглой комнаты.

## Если `room_shape = Г-образная`

На этом этапе можно оставить disabled/future state:

```text
Г-образная форма будет поддержана в следующей версии. Сейчас выберите прямоугольную или круглую форму.
```

Нельзя считать её как прямоугольную.

## Если `room_shape = сложная`

Можно оставить future/manual mode:

```text
manual_floor_area
manual_perimeter
height
```

Но если backend пока не поддерживает manual mode, не отправлять такой запрос в старый `/api/consult`.

---

# Задача 6. Заменить JSON-проёмы на нормальный UI

Убрать JSON-поле как основной пользовательский ввод.

Сделать блок:

```text
тип проёма: дверь / окно / арка / ниша
ширина
высота
количество
кнопка “Добавить проём”
список добавленных проёмов
кнопка удалить
```

Payload:

```json
"openings": [
  {
    "type": "дверь",
    "width": 0.9,
    "height": 2.1,
    "count": 1
  }
]
```

JSON можно оставить только как advanced/debug preview, не как основной ввод.

---

# Задача 7. Расширить поверхности

Добавить `surface_specs`.

## Пол

```json
"floor": {
  "current_base": "бетонная стяжка",
  "covering": "ламинат",
  "needs_demolition": false,
  "needs_leveling": "unknown"
}
```

Покрытия пола:

```text
ламинат
керамогранит
керамическая плитка
наливной пол
линолеум
инженерная доска
паркет
unknown
```

## Стены

```json
"walls": {
  "current_base": "штукатурка",
  "covering": "краска",
  "needs_demolition": false,
  "needs_leveling": "unknown"
}
```

Покрытия стен:

```text
краска
обои
керамическая плитка
декоративная штукатурка
панели
unknown
```

## Потолок

```json
"ceiling": {
  "current_base": "бетон",
  "covering": "натяжной потолок",
  "has_lighting_points": "unknown",
  "needs_leveling": "unknown"
}
```

Покрытия потолка:

```text
краска
побелка
натяжной потолок
гипсокартон
панели
unknown
```

---

# Задача 8. Добавить `repair_context`

Добавить блок:

```json
"repair_context": {
  "property_condition": "черновая отделка",
  "repair_level": "капитальный",
  "has_existing_finish": false
}
```

Состояние помещения:

```text
новостройка без отделки
черновая отделка
предчистовая отделка
старая отделка
после демонтажа
неизвестно
```

Уровень ремонта:

```text
косметический
капитальный
частичный
под ключ
только расчёт материалов
только консультация
```

---

# Задача 9. Добавить `engineering`

Добавить блок инженерных систем:

```json
"engineering": {
  "electrical_required": "unknown",
  "plumbing_required": "unknown",
  "ventilation_required": "unknown",
  "heating_required": "unknown",
  "waterproofing_required": "auto",
  "hvac_required": "unknown"
}
```

Допустимые значения:

```text
yes
no
unknown
auto
```

Для ванной и санузла автоматически выставлять:

```text
plumbing_required = auto
ventilation_required = auto
waterproofing_required = auto
```

Для кухни:

```text
electrical_required = auto
plumbing_required = auto
ventilation_required = auto
waterproofing_required = auto
```

---

# Задача 10. Добавить `user_goals`

Добавить блок требований пользователя:

```json
"user_goals": {
  "budget_level": "средний",
  "priority": ["долговечность", "простота ухода"],
  "notes": "Нужен практичный ремонт кухни."
}
```

Бюджет:

```text
эконом
средний
премиум
не указан
```

Приоритеты:

```text
долговечность
быстро
дешево
влагостойкость
звукоизоляция
теплоизоляция
простота ухода
минимум сложных работ
визуальный дизайн
```

---

# Задача 11. Сформировать новый payload

Frontend должен уметь собрать payload:

```json
{
  "room_type": "кухня",
  "zone_type": "кухонная зона",
  "room_shape": "прямоугольная",
  "dimensions": {
    "length": 5.0,
    "width": 4.0,
    "height": 2.8
  },
  "openings": [
    {
      "type": "дверь",
      "width": 0.9,
      "height": 2.1,
      "count": 1
    }
  ],
  "surface_specs": {
    "floor": {
      "current_base": "бетонная стяжка",
      "covering": "керамогранит",
      "needs_demolition": false,
      "needs_leveling": "unknown"
    },
    "walls": {
      "current_base": "штукатурка",
      "covering": "краска",
      "needs_demolition": false,
      "needs_leveling": "unknown"
    },
    "ceiling": {
      "current_base": "бетон",
      "covering": "натяжной потолок",
      "has_lighting_points": "unknown",
      "needs_leveling": "unknown"
    }
  },
  "repair_context": {
    "property_condition": "черновая отделка",
    "repair_level": "капитальный",
    "has_existing_finish": false
  },
  "engineering": {
    "electrical_required": "unknown",
    "plumbing_required": "auto",
    "ventilation_required": "auto",
    "heating_required": "unknown",
    "waterproofing_required": "auto",
    "hvac_required": "unknown"
  },
  "user_goals": {
    "budget_level": "средний",
    "priority": ["долговечность", "простота ухода"],
    "notes": "Нужен практичный ремонт кухни."
  },
  "user_question": "Подготовь базовую консультацию и расчёт для ремонта помещения."
}
```

---

# Задача 12. Transitional compatibility

Пока backend ещё не восстановлен под новый контракт, сделать безопасный transitional mode:

1. Новый payload должен отображаться в UI как `Payload preview`.
2. Для старого `/api/consult` можно временно отправлять compatibility payload только для `room_shape = прямоугольная`.
3. Для `room_shape = круглая`, `Г-образная`, `сложная` не отправлять запрос в старый backend, если backend ещё не умеет считать эту форму.
4. Показывать понятное сообщение:

```text
UI для этой формы восстановлен, но backend geometry engine будет подключён следующим шагом. Не отправляем форму в старый расчёт, чтобы не получить ложный результат.
```

Это важно: лучше честно заблокировать ложный расчёт, чем снова считать круг как прямоугольник.

---

# Запрещено

```text
нельзя считать круглую комнату как прямоугольную;
нельзя оставлять JSON-проёмы единственным способом ввода;
нельзя смешивать room_type и room_shape;
нельзя отправлять неподдерживаемую форму в старый backend;
нельзя удалять production env-поддержку VITE_API_BASE_URL;
нельзя ломать существующий working path для прямоугольной комнаты;
нельзя делать большой backend rewrite в этом шаге.
```

---

# Файлы, которые вероятно нужно изменить

Ожидаемые frontend-файлы:

```text
frontend/src/main.jsx
frontend/src/styles.css
```

Если текущий frontend разбит на компоненты, можно изменить соответствующие компоненты, но результат должен соответствовать контракту.

---

# Проверка после изменений

Выполнить:

```powershell
cd frontend
npm run build
cd ..
git status
```

Проверить локально:

```powershell
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

В другом терминале:

```powershell
cd frontend
npm run dev
```

Приёмка frontend:

```text
UI показывает room_type
zone_type меняется автоматически
room_shape меняет поля dimensions
круглая форма показывает diameter + height
Г-образная/сложная не отправляются в ложный расчёт
проёмы вводятся кнопками, не только JSON
есть surface_specs
есть repair_context
есть engineering
есть user_goals
есть Payload preview
прямоугольная комната всё ещё может отправить запрос
```

---

# Commit

После проверки:

```powershell
git add frontend/src/main.jsx frontend/src/styles.css
git commit -m "Restore frontend UI contract for Stage 7.1"
git push -u origin feat/stage7-1-ui-contract-restoration
```

---

# Важное замечание

Этот шаг не завершает production strengthening. Он восстанавливает только UI-контракт.

Следующий шаг после него:

```text
STEP 2 — Backend Contract Restoration
```

Backend должен принять новый payload и перестать зависеть от старой плоской схемы.
