/**
 * Copy of types from client's workflows.ts,
 * needed to avoid cross-project imports.
 */

export type LocaleBit = 'us' | 'ru' | 'mn' | 'id' | 'cn';

export interface PersonaConfig {
  id?: string;
  name: string;
  language?: LocaleBit;
  country?: LocaleBit;
  bio?: string;
  prompt?: string;
}

export interface StrategyConfig {
  type: 'aggressive' | 'passive' | 'balanced';
  prompt?: string;
}

// We don't need to include the LLMConfig dependencies
export interface LLMConfig {
  provider: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  n?: number;
}

export type PlayerConfig =
  | { type: 'dummy'; persona: PersonaConfig; strategy?: StrategyConfig }
  | { type: 'hero'; persona: PersonaConfig; strategy: StrategyConfig; llm: LLMConfig }
  | { type: 'empty' }; 