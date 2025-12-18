import {
  getActionAmount,
  getActionCards,
  getActionComment,
  getActionPlayerIndex,
  getActionTimestamp,
  getActionType,
} from '../../game/position';
import { isDealerAction } from '../../game/progress';

vi.setSystemTime(new Date(1715616000000));

describe('Action Parser', () => {
  describe('getActionTimestamp', () => {
    it('should handle missing timestamp', () => {
      const parsedAction = getActionTimestamp('p1 cc', false);
      expect(parsedAction).toBe(null);
    });

    it('should handle missing timestamp', () => {
      const parsedAction = getActionTimestamp('p1 cc');
      expect(parsedAction).toBe(Date.now());
    });
    it('should handle missing timestamp', () => {
      const parsedAction = getActionTimestamp('p1 cc #lol');
      expect(parsedAction).toBe(Date.now());
    });

    it('should parse an action with a timestamp', () => {
      const timestamp = Number(new Date());
      const parsedAction = getActionTimestamp(`p1 cc #${timestamp}`);
      expect(parsedAction).toEqual(timestamp);
    });
  });
});

describe('Processor', () => {
  describe('getActionPlayerIndex', () => {
    test('should return the player index for a dealer action', () => {
      const action = 'd dh p1 ???? #Agent_4B9M7';
      const result = getActionPlayerIndex(action);
      expect(result).toEqual(0);
    });
    test('should return the player index for a player action', () => {
      const action = 'p1 cbr 200';
      const result = getActionPlayerIndex(action);
      expect(result).toEqual(0);
    });
  });
  describe('getActionType', () => {
    test('should return the action type for a dealer action', () => {
      const action = 'd dh p1 ???? #1756996688802';
      const result = getActionType(action);
      expect(result).toEqual('dh');
      expect(isDealerAction(action)).toBe(true);
    });

    test('should return "f" for fold action', () => {
      const action = 'p1 f #1756996688802';
      const result = getActionType(action);
      expect(result).toEqual('f');
      expect(isDealerAction(action)).toBe(false);
    });

    test('should return "cc" for check/call action', () => {
      const action = 'p2 cc 20 #1756996688802';
      const result = getActionType(action);
      expect(result).toEqual('cc');
      expect(isDealerAction(action)).toBe(false);
    });

    test('should return "cbr" for complete/bet/raise action', () => {
      const action = 'p3 cbr 100 #1756996688802';
      const result = getActionType(action);
      expect(result).toEqual('cbr');
      expect(isDealerAction(action)).toBe(false);
    });

    test('should return "sm" for show/muck action', () => {
      const action = 'p1 sm AsKs #1756996688802';
      const result = getActionType(action);
      expect(result).toEqual('sm');
      expect(isDealerAction(action)).toBe(false);
    });

    test('should return "db" for deal board action', () => {
      const action = 'd db AhKsQd';
      const result = getActionType(action);
      expect(result).toEqual('db');
      expect(isDealerAction(action)).toBe(true);
    });

    test('should return "m" for message action', () => {
      const action = 'p2 m Hello table!';
      const result = getActionType(action);
      expect(result).toEqual('m');
      expect(isDealerAction(action)).toBe(false);
    });

    test('should return "sd" for stand pat/discard action', () => {
      const action = 'p1 sd 2s3h';
      const result = getActionType(action);
      expect(result).toEqual('sd');
      expect(isDealerAction(action)).toBe(false);
    });

    test('should return "pb" for post bring-in action', () => {
      const action = 'p3 pb 5';
      const result = getActionType(action);
      expect(result).toEqual('pb');
      expect(isDealerAction(action)).toBe(false);
    });

    test('should return "?" for unknown action type', () => {
      const action = 'p1 ?';
      const result = getActionType(action);
      expect(result).toEqual('?');
      expect(isDealerAction(action)).toBe(false);
    });
  });
  describe('getActionComment', () => {
    test('should return the comment for an action', () => {
      const action = 'd dh p1 ???? #Agent_4B9M7';
      const result = getActionComment(action);
      expect(result).toEqual('Agent_4B9M7');
    });
  });
  describe('getActionTimestamp', () => {
    beforeAll(() => {
      vi.setSystemTime(new Date(1715616000000));
    });
    afterAll(() => {
      vi.useRealTimers();
    });
    test('should return the timestamp for an action', () => {
      const action = 'd dh p1 ???? #Agent_4B9M7';
      const result = getActionTimestamp(action);
      expect(result).toEqual(1715616000000);
    });
    test('should return the default timestamp for an action', () => {
      const action = 'p1 cbr 200 #1715616000001';
      const result = getActionTimestamp(action);
      expect(result).toEqual(1715616000001);
    });
  });
  describe('getActionCards', () => {
    test('should return the cards for an action', () => {
      const action = 'p1 sm 2d3d';
      const result = getActionCards(action);
      expect(result).toEqual(['2d', '3d']);
    });
    test('should return the cards for a player action', () => {
      const action = 'p1 cbr 200';
      const result = getActionCards(action);
      expect(result).toEqual(undefined);
    });
    test('should return the cards for a dealer action', () => {
      const action = 'd dh p1 ???? #Agent_4B9M7';
      const result = getActionCards(action);
      expect(result).toEqual(['??', '??']);
    });
    test('should return the cards for a dealer action', () => {
      const action = 'd db ThQs #Agent_4B9M7';
      const result = getActionCards(action);
      expect(result).toEqual(['Th', 'Qs']);
    });
  });
  describe('getActionAmount', () => {
    test('should return the amount for an action', () => {
      const action = 'p1 cbr 200';
      const result = getActionAmount(action);
      expect(result).toEqual(200);
    });
    test('should return the amount for an action', () => {
      const action = 'p1 cbr 200.123';
      const result = getActionAmount(action);
      expect(result).toEqual(200.123);
    });
  });
});
