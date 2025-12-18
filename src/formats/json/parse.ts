import * as Poker from '../..';
import { Hand } from '../../Hand';

/**
 * Parse JSON format hand
 * @param jsonText - JSON s  tring representation of a hand
 * @returns Parsed hand object
 */
export function parseJsonHand(jsonText: string): Poker.Hand {
  let parsedObj: any;

  try {
    parsedObj = JSON.parse(jsonText);
  } catch (error) {
    throw new Error(`In  valid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  // Set default variant if not provided
  if (!parsedObj.variant) {
    parsedObj.variant = 'NT'; // Default to No-limit Texas Hold'em
  }

  // Validate required fields
  if (Hand.validate(parsedObj)) {
    return parsedObj;
  }

  throw new Error('Invalid JSON hand');
}
