export interface ClassDefinition {
  name: string;
  description: string;
  tier: 'beginner' | 'intermediate' | 'advanced';
  evolvesTo?: string[];
}

export const CLASS_CATALOG: ClassDefinition[] = [
  { name: 'Wanderer', description: 'No banner, no oath, only road-dust and memory.', tier: 'beginner', evolvesTo: ['Soldier', 'Magician', 'Thief'] },
  { name: 'Shieldbearer', description: 'You survive by standing your ground.', tier: 'beginner', evolvesTo: ['Soldier', 'Magician', 'Thief'] },
  { name: 'Soldier', description: 'A tested fighter shaped by discipline and bruises.', tier: 'beginner', evolvesTo: ['Knight', 'Ranger', 'Enchanter', 'Rogue'] },
  { name: 'Magician', description: 'You grasp sparks before you understand the flame.', tier: 'beginner', evolvesTo: ['Knight', 'Ranger', 'Enchanter', 'Rogue'] },
  { name: 'Thief', description: 'You move where eyes do not linger.', tier: 'beginner', evolvesTo: ['Knight', 'Ranger', 'Enchanter', 'Rogue'] },
  { name: 'Knight', description: 'Steel, oath, and stubborn duty.', tier: 'intermediate', evolvesTo: ['Paladin', 'Warden'] },
  { name: 'Ranger', description: 'Path-reader and hunter of moving shadows.', tier: 'intermediate', evolvesTo: ['Warden', 'Shadowblade'] },
  { name: 'Enchanter', description: 'You bend words, symbols, and will.', tier: 'intermediate', evolvesTo: ['Archmage', 'Paladin'] },
  { name: 'Rogue', description: 'Precision, leverage, and elegant harm.', tier: 'intermediate', evolvesTo: ['Shadowblade'] },
  { name: 'Paladin', description: 'A blade bound to creed and consequence.', tier: 'advanced' },
  { name: 'Archmage', description: 'You shape hidden laws and pay their cost.', tier: 'advanced' },
  { name: 'Shadowblade', description: 'A whisper with a knife and a map of exits.', tier: 'advanced' },
  { name: 'Warden', description: 'An unyielding sentinel of border, grove, or ruin.', tier: 'advanced' },
];
