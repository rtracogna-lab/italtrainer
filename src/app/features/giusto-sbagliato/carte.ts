import { fullSentence, GROUPS, HannoAnnoSentence, sentenceParts } from '../hanno-anno/frasi';
import { shuffle } from '../../shared/shuffle';

// Frase mostrata per intero: giusta, oppure con la parola sbagliata al posto
// di quella giusta.
export interface Card {
  sentence: HannoAnnoSentence;
  shown: string;
  isRight: boolean;
}

// Le esclamazioni restano fuori: tra "ah" e "oh" a volte vanno bene tutte e
// due, e una frase "sbagliata" potrebbe sembrare giusta.
const POOL = GROUPS.filter((group) => group.id !== 'esclamazioni').flatMap((group) => group.sentences);

export function makeCards(random = Math.random): Card[] {
  return shuffle(POOL).map((sentence) => {
    const wrong = sentence.options.filter((option) => option !== sentence.answer);
    const isRight = random() < 0.5;
    return {
      sentence,
      shown: isRight ? sentence.answer : wrong[Math.floor(random() * wrong.length)],
      isRight,
    };
  });
}

export function shownText(card: Card): string {
  const { prefix, suffix } = sentenceParts(card.sentence);
  return prefix + card.shown + suffix;
}

export function rightText(card: Card): string {
  return fullSentence(card.sentence);
}
