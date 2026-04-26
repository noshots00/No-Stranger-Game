import { useMemo, useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { type CreationAnswer, computeMVPClassId } from '@/lib/rpg/utils';

interface CharacterCreationProps {
  onCharacterCreated: (answers: [CreationAnswer, CreationAnswer, CreationAnswer], classId: number) => void;
}

export function CharacterCreation({ onCharacterCreated }: CharacterCreationProps) {
  const [answers, setAnswers] = useState<(CreationAnswer | null)[]>([null, null, null]);

  const questions = useMemo(() => ([
    {
      id: 'q1',
      title: 'Question 1 - The Village Fire',
      prompt: 'A village burns. You can only save one person.',
      options: [
        { id: 0 as CreationAnswer, label: 'A', text: 'The old scholar who knows the path to the lost library.' },
        { id: 1 as CreationAnswer, label: 'B', text: 'The blacksmith’s child, innocent and afraid.' },
        { id: 2 as CreationAnswer, label: 'C', text: 'The wounded messenger carrying a sealed royal decree.' },
      ],
    },
    {
      id: 'q2',
      title: 'Question 2 - The Forgotten Temple',
      prompt: 'Inside the temple you find three relics. Which do you take?',
      options: [
        { id: 0 as CreationAnswer, label: 'A', text: 'A cracked mirror that shows glimpses of possible futures.' },
        { id: 1 as CreationAnswer, label: 'B', text: 'A bronze key that fits no lock you can yet see.' },
        { id: 2 as CreationAnswer, label: 'C', text: 'A dried flower that never loses its scent.' },
      ],
    },
    {
      id: 'q3',
      title: 'Question 3 - The Stranger’s Offer',
      prompt: 'A stranger offers you a gift. Which do you accept?',
      options: [
        { id: 0 as CreationAnswer, label: 'A', text: 'A map with a single, unnamed road.' },
        { id: 1 as CreationAnswer, label: 'B', text: 'A lullaby that calms any beast.' },
        { id: 2 as CreationAnswer, label: 'C', text: 'A blank coin that remembers every hand that held it.' },
      ],
    },
  ]), []);

  const allAnswered = answers.every((answer) => answer !== null);
  const previewClass = allAnswered
    ? computeMVPClassId(answers as [CreationAnswer, CreationAnswer, CreationAnswer])
    : null;

  const updateAnswer = (index: number, value: string) => {
    const next = [...answers];
    next[index] = Number(value) as CreationAnswer;
    setAnswers(next);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card className="border-zinc-700/60 bg-zinc-900/60 text-zinc-100 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl font-semibold text-center">
            Character Creation
          </CardTitle>
          <p className="text-center text-zinc-300 font-serif">
            Answer three story choices. Your path becomes your class.
          </p>
        </CardHeader>
        <CardContent className="space-y-8">
          {questions.map((question, index) => (
            <div key={question.id} className="space-y-3">
              <Label className="text-base text-zinc-100">{question.title}</Label>
              <p className="text-sm md:text-base text-zinc-300 font-serif">{question.prompt}</p>
              <RadioGroup
                value={answers[index] === null ? undefined : String(answers[index])}
                onValueChange={(value) => updateAnswer(index, value)}
                className="space-y-2"
              >
                {question.options.map((option) => (
                  <label
                    key={`${question.id}-${option.id}`}
                    className="flex items-start gap-3 p-3 rounded-lg border border-zinc-700/80 bg-zinc-800/70 hover:bg-zinc-700/70 cursor-pointer"
                  >
                    <RadioGroupItem value={String(option.id)} className="mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-zinc-100">{option.label}</p>
                      <p className="text-sm text-zinc-300 font-serif">{option.text}</p>
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </div>
          ))}

          <div className="rounded-lg border border-zinc-700/80 bg-zinc-800/70 p-4">
            <p className="text-sm text-zinc-300">
              Class Preview:{' '}
              <span className="font-mono text-zinc-100">
                {previewClass ? `Class ${previewClass}` : 'Answer all three questions'}
              </span>
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={() => setAnswers([null, null, null])}
            className="border-zinc-600 text-zinc-200 hover:bg-zinc-800"
          >
            Reset Answers
          </Button>
          <Button
            onClick={() => {
              if (!allAnswered) return;
              const finalAnswers = answers as [CreationAnswer, CreationAnswer, CreationAnswer];
              onCharacterCreated(finalAnswers, computeMVPClassId(finalAnswers));
            }}
            disabled={!allAnswered}
            className="bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            Begin Season One
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}