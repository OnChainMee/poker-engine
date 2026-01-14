# Specification: Sit In & Sit Out

## Objective

Implement the ability to:

- Join a game (starting from the next round)
- Leave a game (starting from the next round)
- Take a break (player is inactive)
- Wait for BB (from the moment when the player is in the `BB` position)

This functionality can only be implemented through changes to the game notation, since only game notation can be transmitted between client and server.

The game notation we use as the basis for game state exchange between client and server does not support such functionality. PHH notation assumes that players are determined before the game starts and remain in the game throughout the session. At the same time, PokerStars notation supports scenarios such as the ability to temporarily leave the game and then return.

The engine already implements support for user-defined fields `_inactive` and `_deadBlinds`, which are used for backward compatibility of game notation between phh<->pokerstars formats

```
/** Array with one entry per player; any non-zero value means the player is sitting out */
_inactive?: number[];
/** Array of dead blinds */
_deadBlinds?: number[];
```

If we add an `_intents` field, we can achieve the desired behavior

```
/** Array with one entry per player; can be zero(no pause) and any integer */
_intents: number[];
```

## Architectural Vision of State Fields

### Client-Server Responsibility Separation

**The `_intents` field** - is a client field for intentions:

- Reflects the player's desire to change their state (join, take a break, leave the game)
- A player can ONLY modify the `_intents` value for themselves
- All changes to other fields by the player will be ignored by the server

**The `_inactive` and `_deadBlinds` fields** - are server state fields:

- Managed exclusively by server logic
- Modified by the server based on analysis of `_intents` and the game situation
- The client CANNOT directly modify these fields

### State Synchronization Flow

1. **Client → Server**: Player modifies `_intents` and sends the game state
2. **Server**: Analyzes intentions from `_intents`, validates, updates `_inactive` and `_deadBlinds`
3. **Server → Client**: Sends synchronized state with current values of all fields
4. **Client**: Renders UI based on the received state

### Values of the `_intents` Field

- `0` - Player wants to play (active state)
- `1` - Player wants to take a break until the BB position
- `2` - Player wants to take a simple break (not tied to position)
- `3` - Player wants to leave the game permanently

## Player State Matrix

Field combinations reflect the player's current state, where:

- `_intents` - player's intention (managed by client)
- `_inactive` and `_deadBlinds` - actual state (managed by server)

| \_inactive | \_intents | \_deadBlinds | State                    | Description                              |
| :--------: | :-------: | :----------: | ------------------------ | ---------------------------------------- |
|   **0**    |     0     |      0       | **Active play**          | Player participates in current hand      |
|   **0**    |     1     |      0       | **Request break til BB** | Player requested break in current hand   |
|   **0**    |     2     |      0       | **Request simple break** | Player requested break not tied to BB    |
|   **0**    |     3     |      0       | **Request exit**         | Player requested to leave the game       |
|   **1**    |     0     |      0       | **Waiting to join**      | New player waits for next hand           |
|   **1**    |     0     |     >0       | **Ready to return**      | Player wants to return with debt payment |
|   **1**    |     1     |    0-1.5     | **Break until BB**       | On break, waiting for BB position        |
|   **1**    |     2     |    0-1.5     | **Simple break**         | On break not tied to position            |
|   **1**    |     3     |     any      | **Leaving game**         | Leaving game, does not pay debts         |

### Impossible States

| \_inactive | \_intents | \_deadBlinds | Reason                                      |
| :--------: | :-------: | :----------: | ------------------------------------------- |
|   **0**    |     0     |     >0       | Active player cannot have dead blinds       |
|   **0**    |     1     |     >0       | Active player cannot have debts             |
|   **0**    |     2     |     >0       | Active player cannot have debts             |
|   **0**    |     3     |     >0       | Active player cannot have debts             |

### Key State Transition Rules:

1. **Joining the game**: `_inactive: 1, _intents: 0` → player receives cards in the next hand
2. **Taking a break**: `_intents: 1` or `_intents: 2` → `_inactive` becomes 1 from the next action
3. **Dead blind accumulation**: When `_inactive: 1` and `_intents: 1|2`, for each missed SB +0.5, for BB +1 (maximum `1.5 BB` in coefficients, stored in absolute chip values)
4. **Return from BB position**: `_intents: 1` → upon reaching BB position, `_deadBlinds` is reset to zero
5. **Early return**: `_intents: 2 → 0` → player pays accumulated `_deadBlinds`
6. **Permanent exit**: `_intents: 3` → player is removed from all arrays in the next hand

## Joining the Game

For `Player3` to join the game, the server must first send a personalized game state for `Player3`. They won't be able to see other players' cards.

**Request for a game (any or specific) with blinds $1\2 from server**
**Client**

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

### Client Logic

#### Access Rights

- A player can modify **ONLY** the `_intents` field for themselves
- A player can add themselves to player arrays when joining
- All other changes will be ignored by the server

#### Joining Process

1. Player adds themselves to the `players` array
2. Specifies desired `buyIn` in `startingStacks`
3. Chooses a position in `seats` if they want to sit in a specific place
4. Sets `_intents: 0` (ready to play)
5. Sends state to server

#### After Sending

- Client renders themselves at the table without cards
- Can watch the current hand
- Waits for the next hand to begin

**Server**

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

### Server Logic

The `Hand.merge()` method:

- Sees that there are players in `_intents` who want to play
- If the game has already started (action log is not empty), determines who is ALREADY participating in it, and marks other players as inactive by modifying the `_inactive` field
- Ensures that all player-related arrays (`players`, `startingStacks`, `antes`, `_inactive`, `_intents`) are modified appropriately

`Player1` and `Player2` finish the current game to the end.

When calling `Hand.next()` on the server:

- In the game state, there are players for whom `_inactive: 1` and `_intents: 0`; if the player has enough chips to continue the game, they participate in the next hand and receive cards
- An active player participating in the hand should have final values of `_inactive: 0`, `_intents: 0`

**Server started a new game**

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

**Player3 received state**

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

The UI is rendered based on the state.

## Break

Any player can take a break at any point in the game. The player's seat at the table is preserved, but when returning to the game, two scenarios are possible:

1. **Case A** The player skips all games until they can return to the `BB` position. In this case, they _pay_ their positional `BB`, but _do not pay_ `dead blinds`.

- In this case, the player does not gain a positional advantage, but simply skips a round of the table and continues the game with a new hand at the `BB` position
- In the game state, the `_intents` field is set to `1`.
- `Dead blinds` accumulate in case the client changes their intentions and wants to return to the game earlier

2. **Case B** If the player returns to the game before the `button` reaches their big blind position, they must pay `dead blinds`.
   The logic for calculating `dead blind` is: determine how many blinds the player missed _before returning to the game_, with a maximum `dead blind` size = 1.5 × `BB`
   With _each new hand_, for each inactive player whose `dead blinds` sum has not yet reached the maximum of `1.5 BB`, you need to:

- For each missed `SB` in the hand, add to the player's value in the `_deadBlinds` array +=`0.5` (must be converted to absolute chip value)
- For each missed `BB` in the hand, add to the player's value in the `_deadBlinds` array +=`1` (must be converted to absolute chip value)
- Maximum value of `_deadBlinds` for any player === `1.5` (must be converted to absolute chip value)
- `Dead blinds` are NOT paid if the player leaves the game permanently: `_inactive: 1` and `_intents: 3`

Let's consider all cases.

### Case A

`Player2` decided to take a break and continue playing when their turn reaches the `BB` position

**Client, initial state**

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

`Player2` adds value `1` to the `_intents` array at their index. This means they will skip all games until their `BB` position.
However, `dead blinds` still need to be calculated for them, in case the player decides to return to the game early.

**Client**

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

**Server**
_Nota bene: the logic for tracking maximum pause time is entirely server-side and doesn't particularly concern us_

The `Hand.merge()` method:

- The server sees that `Player2` wants to skip the current and following games (`_intents: 1`)
- In the final game state, the player becomes inactive (`_inactive: 1`) and no longer participates in the hand
- Player `Player2` is in the `SB` position and has already posted the blind, receiving cards. `_deadBlinds` = `0`

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

Player `Player2` stood up after posting blinds and received cards in this hand, therefore they can return _in this game_. They can no longer finish this game, but _can start from the next hand_ without being charged `_deadBlinds`

`Hand.next()` method logic:

**Dead blind calculation:**

- Checks players on break (`_inactive: 1`, `_intents: 1|2`)
- Players with `_deadBlinds === 1.5` have reached maximum and are skipped
- Adds +0.5 to `_deadBlinds` in absolute chip values for missed `SB`
- Adds +1.0 to `_deadBlinds` in absolute chip values for missed `BB`

**Returning to the game:**

- Players with `_intents: 1` at the `BB` position return without paying debts
  - Set: `_deadBlinds: 0`, `_inactive: 0`, `_intents: 0`
- Players lacking chips to pay debts and blinds:
  - Receive flags: `_inactive: 1`, `_intents: 3` (automatic exit)

**Server** merged the game state

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

**Server**
Player `Player2` missed `Hand 3`, a new `Hand 4` has begun

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

Even though the player is skipping hands until their next `BB`, they are NOT charged `dead blinds`. In this specific situation, player `Player2` is in the `UTG` position and is not required to post a positional blind. If they decide to return to the game early - they pay nothing and participate in the game from the new hand. If they wait for their `BB` - then `dead blinds` are reset to zero.

Player `Player2` missed `Hand 4`, a new `Hand 5` has begun, in which they are in the `BB` position

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

**Client**

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

The client renders a UI in which the player has returned to the game and is waiting for cards from the dealer.

### Case B

The player wants to return to the game early. For example, when the player has accumulated the maximum amount of `dead blinds` and wants to return to the game before their `BB`.

**Server**

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

**Client**

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

**Server**

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

# Leaving the Game

Any player can refuse to continue playing. There are the following ways to leave the game:

1. Instantly (press `fold`)
2. Or simply by not taking any actions during the time allowed for a move, and then the server will automatically do `fold/muck` through `Hand.auto()`
3. Or refuse to continue playing in the next hand.

- In this case, the player no longer participates in this hand
- The state flag `_intents:3` indicates the player's intention to leave the game permanently
- If they have `_deadBlinds`, they do not pay them

**Client**
`Player1` decided to leave the game and pressed the `LEAVE GAME [x]` button in the interface. They will send this state to the server:

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

The interface is redrawn, the client unsubscribes from updates for this game and is taken to the lobby.

**Server**
When calling `Hand.merge()`:

- Sees that player `Player1` has shown an intention to leave the game
- Changes the player's flag to `_inactive: 1`
- The game state is no longer broadcast to this player

`Hand.next()` logic

- Any players with `_inactive: 1` and `_intents:3` are removed from all player-related arrays
- Values of `_deadBlinds`, `_inactive`, `_intents` are ignored

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

Player `Player1` will no longer receive game updates.
