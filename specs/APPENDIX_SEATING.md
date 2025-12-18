# Спецификация: Sit In & Sit Out

## Задача

Реализовать возможность:

- присоединиться к игре (со следующего раунда)
- покинуть игру (со следующего раунда)
- взять паузу (игрок неактивен)
- дождаться BB (с момента, когда игрок на позиции `BB`)

Этот функционал может быть реализован только через изменение игровой нотации, так как только игровая нотация может быть передана между клиентом и сервером.

Игровая нотация, которую мы используем как основу игрового состояния для обмена между клиентом и сервером, не предусматривает подобного функционала. ПХХ‑нотация предполагает, что игроки определяются до начала игры и остаются в игре на протяжении всей сессии. В то же время нотация PokerStars поддерживает такие сценарии, как возможность временно выйти из игры и затем вернуться.

В движке уже реализована поддержка user-defined полей `_inactive` и `_deadBlinds`, которые и используются для обратной совместимости игровой нотации между форматами phh<->pokerstars

```
/** Array with one entry per player; any non-zero value means the player is sitting out */
_inactive?: number[];
/** Array of dead blinds */
_deadBlinds?: number[];
```

Если добавить поле `_intents`, то можно добиться желаемого поведения

```
/** Array with one entry per player; can be zero(no pause) and any integer */
_intents: number[];
```

## Архитектурное видение полей состояния

### Разделение ответственности клиент-сервер

**Поле `_intents`** - это клиентское поле намерений:

- Отражает желание игрока изменить свое состояние (присоединиться, взять паузу, покинуть игру)
- Игрок может изменять ТОЛЬКО значение `_intents` для себя
- Все изменения других полей игроком будут проигнорированы сервером

**Поля `_inactive` и `_deadBlinds`** - это серверные поля состояния:

- Управляются исключительно серверной логикой
- Изменяются сервером на основе анализа `_intents` и игровой ситуации
- Клиент НЕ МОЖЕТ напрямую изменять эти поля

### Поток синхронизации состояния

1. **Клиент → Сервер**: Игрок изменяет `_intents` и отправляет игровое состояние
2. **Сервер**: Анализирует намерения из `_intents`, валидирует, обновляет `_inactive` и `_deadBlinds`
3. **Сервер → Клиент**: Отправляет синхронизированное состояние с актуальными значениями всех полей
4. **Клиент**: Рендерит UI на основе полученного состояния

### Значения поля `_intents`

- `0` - Игрок хочет играть (активное состояние)
- `1` - Игрок хочет взять паузу до позиции BB
- `2` - Игрок хочет взять простую паузу (без привязки к позиции)
- `3` - Игрок хочет покинуть игру окончательно

## Матрица состояний игрока

Комбинации полей отражают текущее состояние игрока, где:

- `_intents` - намерение игрока (управляется клиентом)
- `_inactive` и `_deadBlinds` - фактическое состояние (управляется сервером)

| \_inactive | \_intents | \_deadBlinds | Состояние                | Описание                               |
| :--------: | :-----: | :----------: | ------------------------ | -------------------------------------- |
|   **0**    |    0    |      0       | **Активная игра**        | Игрок участвует в текущей раздаче      |
|   **0**    |    1    |      0       | **Запрос паузы до BB**   | Игрок запросил паузу в текущей раздаче |
|   **0**    |    2    |      0       | **Запрос простой паузы** | Игрок запросил паузу без привязки к BB |
|   **0**    |    3    |      0       | **Запрос выхода**        | Игрок запросил выход из игры           |
|   **1**    |    0    |      0       | **Ожидание входа**       | Новый игрок ждет следующей раздачи     |
|   **1**    |    0    |      >0      | **Готов к возврату**     | Игрок хочет вернуться с оплатой долга  |
|   **1**    |    1    |    0-1.5     | **Пауза до BB**          | На паузе, ждет позиции BB              |
|   **1**    |    2    |    0-1.5     | **Простая пауза**        | На паузе без привязки к позиции        |
|   **1**    |    3    |    любое     | **Выход из игры**        | Покидает игру, долги не платит         |

### Невозможные состояния

| \_inactive | \_intents | \_deadBlinds | Причина                                        |
| :--------: | :-----: | :----------: | ---------------------------------------------- |
|   **0**    |    0    |      >0      | Активный игрок не может иметь мертвых блайндов |
|   **0**    |    1    |      >0      | Активный игрок не может иметь долгов           |
|   **0**    |    2    |      >0      | Активный игрок не может иметь долгов           |
|   **0**    |    3    |      >0      | Активный игрок не может иметь долгов           |

### Ключевые правила перехода между состояниями:

1. **Присоединение к игре**: `_inactive: 1, _intents: 0` → игрок получает карты в следующей раздаче
2. **Взятие паузы**: `_intents: 1` или `_intents: 2` → `_inactive` становится 1 со следующего действия
3. **Накопление мертвых блайндов**: При `_inactive: 1` и `_intents: 1|2` за каждый пропущенный SB +0.5, за BB +1 (максимум `1.5 BB` в коэффициентах, хранится в абсолютных значениях фишек)
4. **Возврат с позиции BB**: `_intents: 1` → при достижении BB позиции `_deadBlinds` обнуляется
5. **Досрочный возврат**: `_intents: 2 → 0` → игрок платит накопленные `_deadBlinds`
6. **Окончательный выход**: `_intents: 3` → игрок удаляется из всех массивов в следующей раздаче

## Присоединение к игре

Чтобы `Player3` смог присоединиться к игре, сначала сервер должен отправить персонализированное игровое состояние для `Player3`. Он не сможет увидеть карты игроков.

**Запрос игры(любой или конкретной) с блайндами $1\2 от сервера**
**Клиент**

```
{ // Current hand state, Player1 and Player2 is already playing
    author: 'Player3',
    hand: 1,
    players: ['Player1', 'Player2', 'Player3'], // `Player3` is added himself to `players` array ✅
    startingStacks: [50, 100, 100], // desired stack size for `Player3` is 100 chips. ✅
    blindsOrStraddles: [1, 2, 0], // `Player3` want to take UTG position ✅
    antes: [0, 0]
    seatCount: [6],
    actions: [
        'd dh p1 ????',
        'd dh p2 ????',
        'p1 cc',
        'p2 cc',
        'd db 2d7cJh',
    ],
    _inactive: [0, 0],
    _intents: [0, 0, 0], // `Player3` wants to join the game and added himself with state `0` - "ready to play" ✅
}
```

### Клиентская логика

#### Права доступа

- Игрок может изменять **ТОЛЬКО** поле `_intents` для себя
- Игрок может добавлять себя в массивы игроков при присоединении
- Все остальные изменения будут проигнорированы сервером

#### Процесс присоединения

1. Игрок добавляет себя в массив `players`
2. Указывает желаемый `buyIn` в `startingStacks`
3. Выбирает позицию в `seats`, если хочет сесть на конкретное место
4. Устанавливает `_intents: 0` (готов играть)
5. Отправляет состояние на сервер

#### После отправки

- Клиент рендерит себя за столом без карт
- Может смотреть текущую раздачу
- Ожидает начала следующей раздачи

**Сервер**

```
{ // Player3 wants to join the hand
    hand: 1,
    players: ['Player1', 'Player2', 'Player3'], // Player3 can add himself to the game ✅
    startingStacks: [50, 100, 75.25], // `Player3` have total chips 75.25, not 100 as requested ✅
    blindsOrStraddles: [1, 2, 0], // `Player3` can take UTG position ✅
    antes: [0, 0, 0], // `Player3` was added into all player-related arrays ✅
    seatCount: [6],
    actions: [
        'd dh p1 ????',
        'd dh p2 ????',
        'p1 cc',
        'p2 cc',
        'd db 2d7cJh',
    ],
    _inactive: [0, 0, 1], // Player3 will play in the next hand ✅
    _intents: [0, 0, 0], // Player3 can add himself to the game. Game is running, so new player MUST wait for next game ✅
}
```

### Серверная логика

Метод `Hand.merge()`:

- Видит что в `_intents` есть игроки, которые хотят играть
- Если игра уже началась (экшен лог не пустой), определяет кто в ней УЖЕ участвует, а остальных игроков помечает как неактивных, изменяя поле `_inactive`
- Убеждается, что все player-related arrays (`players`, `startingStacks`, `antes`, `_inactive`, `_intents`) изменены должным образом

`Player1` и `Player2` доигрывают текущую игру до конца.

При вызове `Hand.next()` на сервере:

- В игровом состоянии есть игроки, для которых `_inactive: 1`, и `_intents: 0`, если у игрока достаточно фишек для продолжения игры он участвует в следующей раздаче и получает карты
- Активный игрок, который участвует в раздаче, должен иметь итоговые значения `_inactive: 0`, `_intents: 0`

**Сервер начал новую игру**

```
{ // Player3 joined new hand
    hand: 2, // new hand ✅
    players: ['Player1', 'Player2', 'Player3'], // ✅ `Player3` is included in player-related array
    startingStacks: [50, 100, 75.25], // ✅ `Player3` is included in player-related array
    blindsOrStraddles: [0, 1, 2], // ✅ `Player3` is included in player-related array
    antes: [0, 0, 0], // ✅ `Player3` is included in player-related array
    seatCount: [6],
    actions: [
        'd dh p1 2h2d',
        'd dh p2 3s3d',
        'd dh p3 4c4d', // `Player3` got hole cards ✅
    ],
    _inactive: [0, 0, 0], // `Player3` active ✅
    _intents: [0, 0, 0], // `Player3` is ready to play ✅
}
```

**Player3 получил стейт**

```
{ // Player3 recieved new hand
    author: 'Player3',
    hand: 2,
    players: ['Player1', 'Player2', 'Player3'],
    startingStacks: [50, 100, 75.25],
    blindsOrStraddles: [0, 1, 2],
    antes: [0, 0, 0],
    seatCount: [6],
    actions: [
        'd dh p1 ????',
        'd dh p2 ????',
        'd dh p3 4c4d, // `Player3` see his cards and can render UI
    ],
    _inactive: [0, 0, 0], // `Player3` is active ✅
    _intents: [0, 0, 0], // `Player3` is want to play ✅
}
```

UI отрисовывается по стейту.

## Пауза

Любой игрок может взять паузу в любой момент игры. За игроком сохраняется его место за столом, но при возврате в игру, возможны два сценария:

1. **Кейс А** Игрок пропускает все игры до момента, когда он сможет вернуться на позицию `BB`. В этом случае он _платит_ свой позиционный `BB`, _не платит_ `мертвые блайнды`.

- В этом случае игрок не получает позиционного преимущества, а просто пропускает оборот стола и продолжает игру с новой раздачи на позиции `BB`
- В игровом состоянии для поля `_intents` установлено значение `1`.
- `Мертвые блайнды` накапливаются, на случай если клиент изменит намерения и захочет вернуться в игру раньше

2. **Кейс B** Если игрок возвращается в игру до того, как `button` дойдет до его позиции большого блайнда, он обязан оплатить `мертвые блайнды`.
   Логика расчета `dead blind` такая: нужно понять, сколько блайндов игрок пропустил _до момента возвращения в игру_, с максимальным размером `dead blind` = 1.5 х `BB`
   С _каждой новой раздачей_, для каждого неактивного игрока, сумма `мертвых блайндов` которого еще не достигла максимума в `1.5 BB` нужно:

- За каждый пропущенный `SB` в раздаче добавлять к значению игрока в массиве `_deadBlinds` +=`0.5`(должен быть приведен к абсолютному значению фишек)
- За каждый пропущенный `BB` в раздаче добавлять к значению игрока в массиве `_deadBlinds` +=`1`(должен быть приведен к абсолютному значению фишек)
- Максимальное значение `_deadBlinds` для любого игрока === `1.5`(должен быть приведен к абсолютному значению фишек)
- `Мертвые блайнды` НЕ оплачиваются, если игрок покидает игру окончательно: `_inactive: 1` и `_intents: 3`

Рассмотрим все случаи.

### Кейс А

`Player2` решил взять паузу и продолжить игру, когда его очередь дойдет до позиции `BB`

**Клиент, начальное состояние**

```
{ // Player2 wants to pause playing during the hand going
    hand: 3,
    players: ['Player1', 'Player2', 'Player3'],
    startingStacks: [50, 100, 75.25],
    blindsOrStraddles: [0, 1, 2], // `Player2` have SB position ✅
    antes: [0, 0, 0],
    seatCount: [6],
    actions: [
        'd dh p1 ????',
        'd dh p2 3s3d, // `Player2` posted SB, and then got the hole cards ✅
        'd dh p3 ????',
        'p3 cc',
        'p1 cc',
    ],
    _inactive: [0, 0, 0],
    _intents: [0, 0, 0], // initial state, all players are just playing ✅
}
```

`Player2` добавляет в массив `_intents` по своему индексу значение `1`. Это значит, что он будет пропускать все игры до его позиции в `BB`.
Однако `мертвые блайнды` для него все равно нужно рассчитывать, на случай, если игрок примет решение вернуться к игре досрочно.

**Клиент**

```
{ // Player2 paused the game
    author: 'Player2',
    hand: 3,
    players: ['Player1', 'Player2', 'Player3'],
    startingStacks: [50, 100, 75.25], // unchanged ✅
    blindsOrStraddles: [0, 1, 2], // unchanged ✅
    antes: [0, 0, 0], // unchanged ✅
    seatCount: [6],
    actions: [
        'd dh p1 ????',
        'd dh p2 3s3d
        'd dh p3 ????',
        'p3 cc',
        'p1 cc',
    ],
    _inactive: [0, 0, 0],
    _intents: [0, 1, 0], // Player2 want to skip the game till next BB ✅
}
```

**Сервер**
_Nota bene: логика учета максимального времени паузы целиком серверная и нас особенно не интересует_

Метод `Hand.merge()`:

- Сервер видит что `Player2` хочет пропустить текущую и следующие игры (`_intents: 1`)
- В итоговом игровом состоянии игрок становится неактивным (`_inactive: 1`) и не участвует дальше в раздаче
- Игрок `Player2` находится на позиции `SB` и уже поставил блайнд, получив карты. `_deadBlinds` = `0`

```
{// Player2 paused before he's posted big blind
    hand: 3,
    players: ['Player1', 'Player2', 'Player3'], // `Player2` is present, but not playing ✅
    startingStacks: [50, 100, 75.25],
    blindsOrStraddles: [0, 1, 2],
    antes: [0, 0, 0],
    seatCount: [6],
    actions: [
        'd dh p1 ????',
        'd dh p2 3s3d
        'd dh p3 ????',
        'p3 cc',
        'p1 cc',
        'd db 5cAhQh` // `Player2` is paused, so he's not acting
    ],
    _inactive: [0, 0, 0],
    _intents: [0, 1, 0], // `Player2` paused and wait til next `BB`
    _deadBlinds: [0, 0, 0] // `Player2` posted his `SB` in this hand
}
```

Игрок `Player2` встал после постановки блайндов, и получил карты в этой раздаче, следовательно, он может вернуться _в этой игре_. Доиграть эту игру он уже не сможет, но _сможет начать со следующей раздачи_ без начисления `_deadBlinds`

Логика метода `Hand.next()`:

**Расчет мертвых блайндов:**

- Проверяет игроков на паузе (`_inactive: 1`, `_intents: 1|2`)
- Игроки с `_deadBlinds === 1.5` достигли максимума и пропускаются
- За пропущенный `SB` добавляет +0.5 к `_deadBlinds` в абсолютных значениях фишек
- За пропущенный `BB` добавляет +1.0 к `_deadBlinds` в абсолютных значениях фишек

**Возврат в игру:**

- Игроки с `_intents: 1` на позиции `BB` возвращаются без оплаты долгов
  - Устанавливается: `_deadBlinds: 0`, `_inactive: 0`, `_intents: 0`
- Игроки с недостатком фишек для оплаты долгов и блайндов:
  - Получают флаги: `_inactive: 1`, `_intents: 3` (автоматический выход)

**Сервер** смерджил игровое состояние

```
{// Player2 paused before he's posted big blind
    hand: 3,
    players: ['Player1', 'Player2', 'Player3'],
    startingStacks: [50, 100, 75.25],
    blindsOrStraddles: [0, 1, 2],
    antes: [0, 0, 0],
    seatCount: [6],
    actions: [
        'd dh p1 ????',
        'd dh p2 3s3d,
        'd dh p3 ????',
        'p3 cc',
        'p1 cc',
        'd db 5cAhQh` // `Player2` is paused, so he's not acting ✅
    ],
    _inactive: [0, 1, 0], `Player2` is inactive and not acting in this hand ✅
    _intents: [0, 1, 0], // `Player2` paused in this hand and waiting until next `BB` ✅
    _deadBlinds: [0, 0, 0] // `Player2` already posted his `SB` in this hand
}
```

**Сервер**
Игрок `Player2` пропустил `Раздачу 3`, началась новая `Раздача 4`

```
{// Player2 paused and missing hand4 completely
    hand: 4,
    players: ['Player1', 'Player2', 'Player3'], // `Player2` is sitting ✅
    startingStacks: [50, 100, 75.25], // `Player2` have chips to play ✅
    blindsOrStraddles: [2, 0, 1], // `Player2` have UTG position now ✅
    antes: [0, 0, 0],
    seatCount: [6],
    actions: [
        'd dh p1 ????',
        // no cards for `Player2`
        'd dh p3 ????',
        'p3 cc',
        'p1 cc',
        'd db 5cAhQh` // `Player2` is not playing in this hand at all ✅
    ],
    _inactive: [0, 1, 0], `Player2` is inactive and not acting in this hand ✅
    _intents: [0, 1, 0], // `Player2` paused in this hand and waiting until next `BB` ✅
    _deadBlinds: [0, 0, 0] // `Player2` is skipping this hand completely
}
```

Несмотря на то, что игрок пропускает раздачи до своего следующего `BB` ему НЕ начисляются `мертвые блайнды`. Конкретно в этой ситуации игрок `Player2` находится на позиции `UTG` и не обязан ставить позиционный блайнд. Если он решит вернуться в игру досрочно - не оплачивает ничего и с новой раздачи принимает участие в игре. Если он дожидается своего `BB` - то `мертвые блайнды` обнуляются.

Игрок `Player2` пропустил `Раздачу 4`, началась новая `Раздача 5`, в которой он на позиции `BB` 

```
{// Player2 paused till `BB`
    hand: 5,
    players: ['Player1', 'Player2', 'Player3'], // `Player2` is sitting ✅
    startingStacks: [50, 100, 75.25], // `Player2` have chips to play ✅
    blindsOrStraddles: [1, 2, 0], // `Player2` have BB position and can return without playing dead blinds ✅
    antes: [0, 0, 0],
    seatCount: [6],
    actions: [],
    _inactive: [0, 0, 0], `Player2` have `BB` position now ✅
    _intents: [0, 0, 0], // `Player2` is playing ✅
    _deadBlinds: [0, 0, 0] // `Player2` have NO dead blinds ✅
}
```

**Клиент**

```
    {// Player2 paused till `BB`
    author: `Player2`,
    hand: 5,
    players: ['Player1', 'Player2', 'Player3'], // `Player2` is sitting ✅
    startingStacks: [50, 100, 75.25], // `Player2` have chips to play ✅
    blindsOrStraddles: [1, 2, 0], // `Player2` have BB position now ✅
    antes: [0, 0, 0],
    seatCount: [6],
    actions: [],
    _inactive: [0, 0, 0], `Player2` have `BB` position now ✅
    _intents: [0, 0, 0], // `Player2` is playing ✅
    _deadBlinds: [0, 0, 0] // `Player2` have NO dead blinds ✅
}
```

Клиент рендерит UI в котором игрок вернулся в игру и ждет карт от дилера.

### Кейс B

Игрок хочет вернуться к игре досрочно. Например, когда игрок накопил максимальную сумму `мертвых блайндов` и хочет вернуться в игру до своего `BB`.

**Сервер**

```
{ // Player2 is paused
    hand: 6,
    players: ['Player1', 'Player2', 'Player3'], // `Player2` is sitting ✅
    startingStacks: [50, 100, 75.25], // `Player2` have chips to play ✅
    blindsOrStraddles: [0, 1, 2],
    antes: [0, 0, 0],
    seatCount: [6],
    actions: [
        'd dh p1 ????',
        'd dh p3 ????',
    ],
    _inactive: [0, 1, 0], // `Player2` inactive ✅
    _intents: [0, 2, 0], // `Player2` just paused the game, he doesn't want to wait until `BB`, just pause ✅
    _deadBlinds: [0, 3, 0] // `Player2` have the max allowed `dead blind` value ($3 = 1.5 * $2 BB) ✅
    }
```

**Клиент**

```
{ // Player2 wants to unpause the game from the next hand
    hand: 6,
    players: ['Player1', 'Player2', 'Player3'], // `Player2` is sitting ✅
    startingStacks: [50, 100, 75.25], // `Player2` have chips to play ✅
    blindsOrStraddles: [0, 1, 2],
    antes: [0, 0, 0],
    seatCount: [6],
    actions: [
        'd dh p1 ????',
        'd dh p3 ????'],
    _inactive: [0, 1, 0], // `Player2` CAN'T modify `_inactive` values ✅
    _intents: [0, 0, 0], // `Player2` unpaused the game ✅
    _deadBlinds: [0, 3, 0] // `Player2` can't modify `_deadBlinds` values ✅
    }
```

**Сервер**

```
{ // Next hand started
    hand: 7, // next hand ✅
    players: ['Player1', 'Player2', 'Player3'], // `Player2` is sitting ✅
    startingStacks: [50, 97, 75.25], // `Player2` had 100 chips, he payed $3 as dead blind ($100 - $3 = $97)
    blindsOrStraddles: [0, 1, 2],
    antes: [0, 0, 0],
    seatCount: [6],
    actions: [
        'd dh p1 ????',
        'd dh p2 'JhJc'
        'd dh p3 ????',
    ],
    _inactive: [0, 0, 0], // `Player2` active ✅
    _intents: [0, 0, 0], // `Player2` is playing ✅
    _deadBlinds: [0, 0, 0] // `Player2` already paid his dead blinds ✅
    }
```

# Выход из игры

Любой игрок может отказаться продолжать игру. Покинуть игру можно следующими способами:

1. Мгновенно(нажать `fold`)
2. Либо просто не совершая никаких действий в течении времени на ход, и тогда сервер через `Hand.auto()` сам сделает `fold/muck`
3. Либо отказаться от продолжения игры в следующей раздаче.

- При этом, в этой раздаче игрок уже не участвует
- Флаг состояния `_intents:3` обозначает намерение игрока уйти из игры окончательно
- Если у него есть `_deadBlinds`, то он их не оплачивает

**Клиент**
`Player1` решил покинуть игру, и нажал кнопку `ПОКИНУТЬ ИГРУ [x]` в интерфейсе. На сервер он отправит такое состояние:

```
{ // Player1 wants to exit the hand
    author: 'Player1',
    hand: 8,
    players: ['Player1', 'Player2', 'Player3'],
    startingStacks: [50, 100, 75.25],
    blindsOrStraddles: [0, 1, 2],
    antes: [0, 0, 0],
    seatCount: [6],
    actions: [
        'd dh p1 ????',
        'd dh p2 3s3d
        'd dh p3 ????',
        'p3 cc',
        'p1 cc',
        'p2 cc',
        'd db 5hAdQc'
    ],
    _inactive: [0, 0, 0], // `Player1` CAN'T modify `_inactive` values ✅
    _intents: [3, 0, 0], // `Player1` wants to leave the game ✅
}
```

Интерфейс перерисовывается, клиент отписывается от обновлений этой игры и попадает в лобби.

**Сервер**
При вызове `Hand.merge()`:

- Видит что игрок `Player1` показал намерение покинуть игру
- Меняет флаг игрока на `_inactive: 1`
- Больше игровое состояние не бродкастится этому игроку

Логика `Hand.next()`

- Любые игроки, у которых `_inactive: 1` и `_intents:3` удаляются из всех массивов, связанных с игроками
- Значения `_deadBlinds`, `_inactive`, `_intents` игнорируются

```
{ // Player1 no more playing
    hand: 9,
    players: ['Player2', 'Player3'], // No `Player1` here ✅
    startingStacks: [100, 75.25], // No `Player1` here ✅
    blindsOrStraddles: [1, 2], // No `Player1` here ✅
    antes: [0, 0], // No `Player1` here ✅
    seatCount: [6],
    actions: [
        'd dh p1 '2s3d',
        'd dh p2 '3s3d',
    ],
    _inactive: [0, 0], // No `Player1` here ✅
    _intents: [0, 0],  // No `Player1` here ✅
}
```

Игрок `Player1` больше обновлений игры не получит.
