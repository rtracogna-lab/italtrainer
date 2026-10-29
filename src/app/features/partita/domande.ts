import { OPTIONS as CE_CIE_OPTIONS, WORDS as CE_CIE_WORDS } from '../ce-cie/ce-cie';
import { WORDS as DOPPIE_WORDS } from '../doppie/doppie';
import { GROUPS, sentenceParts } from '../hanno-anno/frasi';
import { OPTIONS as QU_CU_OPTIONS, WORDS as QU_CU_WORDS } from '../qui-quo-qua/qui-quo-qua';
import { shuffle } from '../../shared/shuffle';
import { GHE_GHI_QUESTIONS } from './ghe-ghi';
import { M_N_QUESTIONS } from './m-n';

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

const APOSTROPHE_GROUPS = ['lo-lho', 'glielo'];

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
  GHE_GHI_QUESTIONS,
  M_N_QUESTIONS,
  // Le frasi con l'apostrofo (l'ho, gliel'ho...) sono le più difficili: hanno
  // una fonte tutta loro, così escono più spesso delle altre di Hanno/Anno.
  ...[
    GROUPS.filter((group) => !APOSTROPHE_GROUPS.includes(group.id)),
    ...APOSTROPHE_GROUPS.map((id) => GROUPS.filter((group) => group.id === id)),
  ].map((groups) =>
    groups
      .flatMap((group) => group.sentences)
      .map((sentence) => ({
        ...sentenceParts(sentence),
        missing: sentence.answer,
        options: sentence.options,
        tip: sentence.tip,
      })),
  ),
];

export function pickMatchQuestions(count: number, sources = QUESTION_SOURCES): MatchQuestion[] {
  const perSource = Math.ceil(count / sources.length);
  const pool = sources.flatMap((source) => shuffle(source).slice(0, perSource));
  return shuffle(pool)
    .slice(0, count)
    .map((question) => ({ ...question, options: shuffle(question.options) }));
}
