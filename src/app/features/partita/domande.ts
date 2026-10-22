import { OPTIONS as CE_CIE_OPTIONS, WORDS as CE_CIE_WORDS } from '../ce-cie/ce-cie';
import { WORDS as DOPPIE_WORDS } from '../doppie/doppie';
import { SENTENCES as HANNO_ANNO_SENTENCES } from '../hanno-anno/hanno-anno';
import { OPTIONS as QU_CU_OPTIONS, WORDS as QU_CU_WORDS } from '../qui-quo-qua/qui-quo-qua';
import { shuffle } from '../../shared/shuffle';

// Domanda della partita: la stessa forma per parole e frasi, così la partita
// può mescolare le domande delle altre sfide.
export interface MatchQuestion {
  clue?: string;
  hint?: string;
  prefix: string;
  missing: string;
  suffix: string;
  options: string[];
  tip?: string;
}

// Una fonte per ogni sfida, per pescare domande in modo equilibrato.
export const QUESTION_SOURCES: MatchQuestion[][] = [
  DOPPIE_WORDS.map(({ clue, prefix, missing, suffix, options }) => ({ clue, prefix, missing, suffix, options })),
  QU_CU_WORDS.map(({ clue, prefix, missing, suffix }) => ({ clue, prefix, missing, suffix, options: QU_CU_OPTIONS })),
  CE_CIE_WORDS.map(({ clue, hint, prefix, missing, suffix, tip }) => ({
    clue,
    hint,
    prefix,
    missing,
    suffix,
    options: CE_CIE_OPTIONS[missing],
    tip,
  })),
  // "Quest'" e "L'" vanno attaccati alla parola che segue.
  HANNO_ANNO_SENTENCES.map(({ before, answer, after, options }) => ({
    prefix: before.endsWith("'") ? before : before + ' ',
    missing: answer,
    suffix: ' ' + after,
    options,
  })),
];

export function pickMatchQuestions(count: number, sources = QUESTION_SOURCES): MatchQuestion[] {
  const perSource = Math.ceil(count / sources.length);
  const pool = sources.flatMap((source) => shuffle(source).slice(0, perSource));
  return shuffle(pool)
    .slice(0, count)
    .map((question) => ({ ...question, options: shuffle(question.options) }));
}
