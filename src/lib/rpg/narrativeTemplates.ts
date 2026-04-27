const SURPLUS_TEMPLATES = [
  "The day's work was honest. {role} pays {delta} copper above shelter and bread.",
  'A quiet day at {location}. Your pockets are {delta} copper heavier.',
  '{role} suited you today. You saved {delta} copper after the landlord\'s cut.',
  'The market was kind. As {role}, you earned enough to put aside {delta} copper.',
];

const DEFICIT_TEMPLATES = [
  'A lean day. {role} at {location} left you {delta} copper short.',
  'The work dried up before sunset. You owe {delta} copper you do not have.',
  'Cold supper and a thinner purse. {role} was not enough today.',
  'You count coins by candlelight. You are still short by {delta} copper.',
];

export const narrateLine = (
  role: string,
  location: string,
  delta: number,
  random: () => number,
): string => {
  const templates = delta >= 0 ? SURPLUS_TEMPLATES : DEFICIT_TEMPLATES;
  const template = templates[Math.floor(random() * templates.length)];
  return template
    .replace('{role}', role)
    .replace('{location}', location)
    .replace('{delta}', String(Math.abs(delta)));
};
