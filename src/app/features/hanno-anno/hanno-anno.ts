import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RoundSummary, SummaryWord } from '../../shared/round-summary/round-summary';
import { shuffle } from '../../shared/shuffle';
import { Tts } from '../../shared/tts';
import { fullSentence, GROUPS, HannoAnnoSentence, sentenceParts } from './frasi';
import { computeScore, TimedAnswer } from './punteggio';

const QUESTIONS_PER_ROUND = 10;
// "Tutte" mescola gli argomenti; ogni argomento ha il suo record.
const ALL = 'tutte';
const RECORD_KEY = 'italtrainer.hanno-anno.record';

function recordKey(topic: string): string {
  return topic === ALL ? RECORD_KEY : `${RECORD_KEY}.${topic}`;
}

function readRecord(topic: string): number {
  try {
    return Number(localStorage.getItem(recordKey(topic))) || 0;
  } catch {
    return 0;
  }
}

function saveRecord(topic: string, points: number): void {
  try {
    localStorage.setItem(recordKey(topic), String(points));
  } catch {
    // Senza memoria del browser il record semplicemente non si salva.
  }
}

// Con "Tutte" si pescano al massimo due frasi per argomento, così anche gli
// argomenti con poche frasi escono spesso.
function pickRound(topic: string): HannoAnnoSentence[] {
  if (topic !== ALL) {
    return shuffle(GROUPS.find((item) => item.id === topic)!.sentences).slice(0, QUESTIONS_PER_ROUND);
  }
  const perGroup = Math.ceil(QUESTIONS_PER_ROUND / GROUPS.length);
  return shuffle(GROUPS.flatMap((item) => shuffle(item.sentences).slice(0, perGroup))).slice(0, QUESTIONS_PER_ROUND);
}

@Component({
  imports: [RouterLink, RoundSummary],
  selector: 'app-hanno-anno',
  styleUrl: './hanno-anno.scss',
  templateUrl: './hanno-anno.html',
})
export class HannoAnno {
  protected readonly tts = inject(Tts);

  protected readonly total = QUESTIONS_PER_ROUND;
  protected readonly topics = [{ id: ALL, label: 'Tutte' }, ...GROUPS.map(({ id, label }) => ({ id, label }))];

  protected readonly topic = signal(ALL);
  protected readonly sentences = signal(pickRound(ALL));
  protected readonly currentIndex = signal(0);
  protected readonly score = signal(0);
  protected readonly selected = signal<string | null>(null);
  protected readonly answered = signal(false);
  // Risposta data per ogni frase del round, per il riepilogo finale.
  protected readonly answers = signal<string[]>([]);
  // Tempo di risposta di ogni frase: dalla comparsa della frase alla scelta.
  protected readonly timedAnswers = signal<TimedAnswer[]>([]);
  protected readonly finalScore = computed(() => computeScore(this.timedAnswers()));
  protected readonly record = signal(readRecord(ALL));
  protected readonly isNewRecord = signal(false);
  private questionStart = Date.now();
  protected readonly summary = computed<SummaryWord[]>(() =>
    this.sentences().map((sentence, index) => ({
      ...sentenceParts(sentence),
      missing: sentence.answer,
      given: this.answers()[index],
    })),
  );

  protected readonly isFinished = computed(() => this.currentIndex() >= this.total);
  protected readonly current = computed(() => this.sentences()[this.currentIndex()]);
  protected readonly parts = computed(() => sentenceParts(this.current()));
  protected readonly isCorrect = computed(() => this.selected() === this.current().answer);

  protected speakSentence(): void {
    this.tts.speak(fullSentence(this.current()));
  }

  // Cambiare argomento fa ripartire il round.
  protected chooseTopic(topic: string): void {
    this.topic.set(topic);
    this.record.set(readRecord(topic));
    this.restart();
  }

  protected selectOption(option: string): void {
    if (this.answered()) {
      return;
    }
    this.selected.set(option);
    this.answered.set(true);
    this.answers.update((list) => [...list, option]);
    const seconds = (Date.now() - this.questionStart) / 1000;
    this.timedAnswers.update((list) => [...list, { correct: option === this.current().answer, seconds }]);
    if (option === this.current().answer) {
      this.score.update((value) => value + 1);
    }
  }

  protected next(): void {
    this.selected.set(null);
    this.answered.set(false);
    this.currentIndex.update((index) => index + 1);
    this.questionStart = Date.now();
    if (this.isFinished()) {
      this.checkRecord();
    }
  }

  private checkRecord(): void {
    const points = this.finalScore().total;
    this.isNewRecord.set(points > this.record());
    if (this.isNewRecord()) {
      this.record.set(points);
      saveRecord(this.topic(), points);
    }
  }

  protected restart(): void {
    this.sentences.set(pickRound(this.topic()));
    this.currentIndex.set(0);
    this.score.set(0);
    this.answers.set([]);
    this.timedAnswers.set([]);
    this.isNewRecord.set(false);
    this.questionStart = Date.now();
    this.selected.set(null);
    this.answered.set(false);
  }
}
