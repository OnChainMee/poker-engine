import { Game, Hand } from '../../';

describe('Winnings Calculation on All Folds', () => {
  it('should award the pot to the last remaining player', () => {
    const hand: Hand = {
      hand: 252708739098,
      day: 1,
      rake: 0,
      time: '03:44:16',
      year: 2024,
      antes: [0, 0, 0, 0, 0, 0],
      month: 10,
      seats: [6, 1, 2, 3, 4, 5],
      table: 'Woltjer III',
      venue: 'PokerStars',
      minBet: 1,
      actions: [
        'd dh p1 ????',
        'd dh p2 ????',
        'd dh p3 ????',
        'd dh p4 ????',
        'd dh p5 ????',
        'p2 f',
        'p3 cbr 2.35',
        'p4 f',
        'p5 f',
        'p1 f',
      ],
      players: ['michasia', 'Pokerprof333', 'janarr5', 'Foma1985', 'puresins88', 'tintin641'],
      variant: 'NT',
      currency: 'USD',
      timeZone: 'UTC',
      _inactive: [0, 0, 0, 0, 0, 1],
      seatCount: 6,
      timestamp: 1727725456000,
      startingStacks: [298.18, 226.77, 100, 48.79, 167.45, 106.83],
      blindsOrStraddles: [1, 0, 0, 0, 0.5, 0],
    };

    const game = Game(hand);

    // The total pot is blinds (1 + 0.5) + the bet (2.25) = 3.75
    // The winner is janarr5 (p3) who made the bet.
    const winner = game.players.find(p => p.name === 'janarr5');

    expect(winner?.winnings).toBe(2.5);
    expect(winner?.stack).toBe(101.5);
    expect(game.isComplete).toBe(true);
  });
});
