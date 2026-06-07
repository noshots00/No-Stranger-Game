import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { TranscriptEntry } from '@/components/rpg/merchant/merchantDialogueTree';
import {
  appendShannonPair,
  buildMayorIdentityReply,
  seedShannonOpeningTranscript,
  SHANNON_ATTACK_REPLY,
  SHANNON_ATTACK_SLAP_NARRATOR,
  SHANNON_JOB_LINE,
  SHANNON_MAYOR_RULES_LINE,
  SHANNON_MEMORY_LINE,
  SHANNON_TOPIC_CHOICES,
  SHANNON_THANKS_LABEL,
  type ShannonTalkPhase,
  type ShannonTopicId,
} from '@/components/rpg/quests/shannonDialogueTree';

export type ShannonChoice =
  | { id: 'shannon-where'; label: 'Where am I?' }
  | { id: 'shannon-who'; label: 'Who are you?' }
  | { id: 'shannon-attack'; label: 'Attack' }
  | { id: 'shannon-continue'; label: 'Continue' }
  | { id: 'shannon-what-now'; label: 'What do I do now?' }
  | { id: 'shannon-work'; label: 'I have to work?!' }
  | { id: 'shannon-thanks'; label: typeof SHANNON_THANKS_LABEL }
  | { id: `shannon-topic-${ShannonTopicId}`; label: string; topicId: ShannonTopicId };

type UseShannonTalkOptions = {
  stepId: string;
  mayorName: string;
  onComplete: () => void;
};

export function useShannonTalk({ stepId, mayorName, onComplete }: UseShannonTalkOptions) {
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [phase, setPhase] = useState<ShannonTalkPhase>('intro');
  const [askedTopics, setAskedTopics] = useState<Set<ShannonTopicId>>(() => new Set());
  const logEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setTranscript(seedShannonOpeningTranscript());
    setPhase('intro');
    setAskedTopics(new Set());
  }, [stepId]);

  useLayoutEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }, [transcript, phase]);

  const handleChoice = (choice: ShannonChoice) => {
    if (choice.id === 'shannon-thanks') {
      onComplete();
      return;
    }

    if (choice.id === 'shannon-attack') {
      setPhase('post_attack');
      setTranscript((prev) => [
        ...prev,
        { id: `shannon-p-${Date.now()}`, role: 'player', text: 'Attack' },
        { id: `shannon-n-${Date.now()}`, role: 'narrator', text: SHANNON_ATTACK_SLAP_NARRATOR },
        { id: `shannon-m-${Date.now()}`, role: 'merchant', text: SHANNON_ATTACK_REPLY },
      ]);
      return;
    }

    if (choice.id === 'shannon-where' || choice.id === 'shannon-who') {
      const label = choice.label;
      setPhase('identity_reveal');
      setTranscript((prev) => [
        ...prev,
        ...appendShannonPair(label, buildMayorIdentityReply(mayorName)),
      ]);
      return;
    }

    if (choice.id === 'shannon-continue') {
      setPhase('memory');
      setTranscript((prev) => [...prev, ...appendShannonPair('Continue', SHANNON_MEMORY_LINE)]);
      return;
    }

    if (choice.id === 'shannon-what-now') {
      setPhase('job_pitch');
      setTranscript((prev) => [...prev, ...appendShannonPair('What do I do now?', SHANNON_JOB_LINE)]);
      return;
    }

    if (choice.id === 'shannon-work') {
      setPhase('topics_hub');
      setTranscript((prev) => [
        ...prev,
        ...appendShannonPair('I have to work?!', SHANNON_MAYOR_RULES_LINE),
      ]);
      return;
    }

    if (choice.id.startsWith('shannon-topic-')) {
      const topicId = choice.topicId;
      const topic = SHANNON_TOPIC_CHOICES.find((t) => t.id === topicId);
      if (!topic) return;
      setAskedTopics((prev) => new Set(prev).add(topicId));
      setTranscript((prev) => [...prev, ...appendShannonPair(topic.label, topic.reply)]);
    }
  };

  const choices: ShannonChoice[] = (() => {
    switch (phase) {
      case 'intro':
        return [
          { id: 'shannon-where', label: 'Where am I?' },
          { id: 'shannon-who', label: 'Who are you?' },
          { id: 'shannon-attack', label: 'Attack' },
        ];
      case 'post_attack':
        return [
          { id: 'shannon-where', label: 'Where am I?' },
          { id: 'shannon-who', label: 'Who are you?' },
        ];
      case 'identity_reveal':
        return [{ id: 'shannon-continue', label: 'Continue' }];
      case 'memory':
        return [{ id: 'shannon-what-now', label: 'What do I do now?' }];
      case 'job_pitch':
        return [{ id: 'shannon-work', label: 'I have to work?!' }];
      case 'work_shock':
      case 'topics_hub': {
        const topics = SHANNON_TOPIC_CHOICES.filter((t) => !askedTopics.has(t.id)).map(
          (t): ShannonChoice => ({
            id: `shannon-topic-${t.id}`,
            label: t.label,
            topicId: t.id,
          })
        );
        return [{ id: 'shannon-thanks', label: SHANNON_THANKS_LABEL }, ...topics];
      }
      default:
        return [];
    }
  })();

  return {
    transcript,
    logEndRef,
    phase,
    choices,
    handleChoice,
  };
}
