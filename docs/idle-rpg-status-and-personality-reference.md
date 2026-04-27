# No Stranger Game - Idle RPG Status and Personality Reference

This document is a future-facing design reference for the autonomous idle RPG layer.

## Catalog Integrity Check

The current content catalogs remain in place:

- `src/lib/rpg/raceCatalog.ts`
- `src/lib/rpg/classCatalog.ts`
- `src/lib/rpg/professionCatalog.ts`

Use this file as a design source for future simulation mechanics, reveal pacing, and profile presentation.

---

## Status Effects

### First 100 (with descriptions)

1. **Afraid** - Cannot willingly move closer to the source of fear; disadvantage on ability checks.
2. **Asleep** - Incapacitated, prone; attacks have advantage, any hit wakes you.
3. **Banished** - Sent to a harmless demiplane for 1 minute (if native) or permanently if extraplanar.
4. **Berserk** - Must attack nearest creature each turn; advantage on melee attacks, but attacks against you have advantage.
5. **Bleeding** - Lose 1d4 HP at start of each turn until healed or bandaged.
6. **Blinded** - Cannot see; attack rolls have disadvantage, enemy attacks have advantage.
7. **Blistered** - Movement hurts: -10 ft. speed and disadvantage on Dexterity saves.
8. **Bloodied (half HP)** - Some monsters gain new abilities; some RPGs give +damage to both sides.
9. **Blunted** - Weapon deals minimum damage until sharpened.
10. **Boiling blood** - Cannot stabilize while bleeding; take 1 fire damage each round.
11. **Brittle** - Suffer double damage from fall, bludgeoning, and force.
12. **Burning** - Take fire damage each round; can use action to extinguish.
13. **Charmed** - Cannot attack charmer; charmer has advantage on social rolls.
14. **Chilled** - Speed halved; vulnerability to cold damage.
15. **Comatose** - Unconscious and cannot be woken by any means short of Greater Restoration.
16. **Confused** - At start of turn, roll d10: 1-2 attack self, 3-6 do nothing, 7-8 attack nearest, 9-10 act normally.
17. **Constricted** - Grappled by a snake or tentacle; take bludgeoning damage each round.
18. **Corroded armor** - AC reduced by 1 until armor repaired.
19. **Cowed** - Must spend half your movement to move away from intimidator.
20. **Crippled (limb)** - Arm: disadvantage on attacks; Leg: speed halved.
21. **Cursed** - Cannot remove cursed item; disadvantage on all saves.
22. **Dazed** - Can only take one action or bonus action, not both.
23. **Deafened** - Cannot hear; automatic fail Perception checks involving sound.
24. **Death sentence** - Doomed to die in X rounds unless a specific counter is applied.
25. **Dehydrated** - Disadvantage on all ability checks; each 24 hours without water = exhaustion.
26. **Demoralized** - -2 to attack rolls and saving throws.
27. **Disarmed** - Weapon dropped on ground at your feet.
28. **Diseased** - Specific effects vary (e.g., sewer fever: disadvantage on Wis saves).
29. **Disoriented** - When you move, you must succeed Wis save or move in random direction.
30. **Drained (level loss)** - Permanently lose one level (or HD) until restoration.
31. **Drunk** - Advantage on saves vs. fear, disadvantage on Dex and Int checks.
32. **Dying** - 0 HP; make death saves each turn; fail 3 = dead.
33. **Encumbered** - Speed reduced by 10 ft.; disadvantage on ability checks using Str/Dex/Con.
34. **Enervated** - Cannot regain hit points by any means.
35. **Entangled** - Speed 0; can use action to break free (Str check).
36. **Enthralled** - You obey one-word commands from the enchanter.
37. **Exhausted** - Six levels: 1 disadvantage on ability checks; 2 speed halved; 3 disadvantage on saves; 4 HP halved; 5 speed 0; 6 death.
38. **Fainting** - Fall prone and unconscious for 1 round, then wake with 1 HP.
39. **Fatigue** - -1 to all d20 rolls per level of fatigue (capped at -5).
40. **Feared** - Must use Dash to move away from source each turn.
41. **Feebleminded** - Int and Cha become 1; cannot cast spells or use magic items.
42. **Flanked** - Enemy gets +2 to attack rolls against you (or advantage in 5e variant).
43. **Flesh to stone (petrifying)** - Slowed, then restrained, then petrified over 3 rounds.
44. **Flustered** - Cannot take reactions.
45. **Fogged** - Accuracy down (disadvantage on ranged attacks).
46. **Forsaken** - No buffs or healing effects can affect you.
47. **Fractured** - Armor completely broken; provides no AC.
48. **Frightened** - Disadvantage on ability checks and attack rolls while source is in sight.
49. **Frostbitten** - Lose 1 Dexterity per round of exposure until permanent nerve damage (heal only via magic).
50. **Gagged** - Cannot speak or perform verbal spell components.
51. **Grappled** - Speed 0; can be moved by grappler.
52. **Grievous wounds** - Healing magic only restores half the usual amount.
53. **Halted** - Cannot move or be moved by any force.
54. **Hamstrung** - Speed reduced by half, cannot take Dash action.
55. **Harried** - Enemies get opportunity attacks against you even if you Disengage.
56. **Hexed** - Choose one ability; target has disadvantage on checks with that ability.
57. **Hiccups** - On spellcasting, roll d20; on 1-5, spell fails and slot wasted.
58. **Holey** - Vulnerability to piercing damage.
59. **Hungry** - Without food for 1 day: exhaustion level 1.
60. **Hushed (silence)** - Cannot produce sound; spells with verbal components impossible.
61. **Hypnotized** - Incapacitated, speed 0, but can be shaken awake as an action.
62. **Immobilized** - Cannot move, but still take actions.
63. **Impotent** - Cannot score critical hits.
64. **In love** - Spend your turn staring at the object of affection (Wis save negates).
65. **Incapacitated** - Cannot take actions or reactions.
66. **Inebriated** - -2 to Dex and Int, +2 to Cha.
67. **Infected** - Wound turns septic; after 24 hours, lose 1 Con per day until cured.
68. **Insane** - Roll on short-term madness table each round.
69. **Itching** - Disadvantage on concentration checks and Dexterity saves.
70. **Lame** - Speed halved; cannot use the Dash action.
71. **Languid** - Action Point regeneration slowed (only 1 AP per 2 rounds).
72. **Lifelinked** - Share damage with linked creature; both take half of each instance.
73. **Marked** - Enemies within line of sight prioritize you over others.
74. **Muddled** - Spells have a 50% chance to target random creature in range.
75. **Nauseated** - Can only take one action per turn (either move or attack, not both).
76. **Paralyzed** - Incapacitated, cannot move or speak, attacks against you have advantage, any hit is critical.
77. **Perplexed** - Cannot identify friend from foe; attack nearest creature.
78. **Petrified** - Turned to stone; resistance to all damage, incapacitated, unaware.
79. **Plagued** - Disease: each day, lose max HP equal to 1d10 until cured.
80. **Poisoned** - Disadvantage on attack rolls and ability checks.
81. **Prone** - Attacks against you advantage within 5 ft., disadvantage beyond; must use half movement to stand.
82. **Punctured** - Bleeding + armor ignore; attacks ignore 2 points of AC.
83. **Raging** - +2 melee damage, -2 AC, cannot cast spells or concentrate.
84. **Restrained** - Speed 0, attacks against you advantage, your attacks disadvantage.
85. **Revived-sickness** - After resurrection, disadvantage on all rolls for 1d4 days.
86. **Scarred** - Maximum HP reduced by 10% permanently.
87. **Shaken** - -2 on attack rolls, saves, skill checks.
88. **Silenced** - Cannot speak or use verbal components.
89. **Sleeping** - Unconscious; can be woken by damage or action.
90. **Slowed** - Speed halved, -2 AC, can only take one action per turn.
91. **Snared** - Caught in a trap; speed 0, take damage if you move.
92. **Staggered** - Cannot take bonus actions or reactions.
93. **Stinking** - Disadvantage on Stealth and Persuasion; animals avoid you.
94. **Stunned** - Incapacitated, cannot move, speaks falteringly; auto-fail Str/Dex saves.
95. **Suffocating** - Hold breath limit exceeded; drop to 0 HP and dying.
96. **Thirsty** - Without water for 1 day: exhaustion level 1, cannot regain HP naturally.
97. **Tormented** - Take psychic damage each round; chance to be frightened each turn.
98. **Unconscious** - Incapacitated, prone, unaware, auto-fail Str/Dex saves, attacks against have advantage.
99. **Weakened** - Weapon damage reduced to 1 (minimum).
100. **Wounded** - Start each turn with 1 damage if below half HP.

### Additional 100 Status Effects (101-200)

101. **Abyssal rot** - Flesh necrotizes; each day, lose 1d4 HP max permanently.
102. **Accelerated** - Haste-like: double speed, +2 AC, extra action, but after effect ends, 1 round of lethargy.
103. **Addled** - Intelligence score reduced by 1d4 until short rest.
104. **Aged** - Magically old; physical stats reduced, mental increased (or vice versa).
105. **Amnesiac** - Forget all spells prepared and party member identities.
106. **Anchored** - Cannot use teleportation or planar travel.
107. **Anguished** - Wail each turn; allies within 30 ft. take 1 psychic damage.
108. **Anti-life field** - Living creatures cannot enter your space.
109. **Arachnophobia** - When within 10 ft. of a spider, you must spend move to flee.
110. **Aroused** - Disadvantage on Wisdom saves vs. Charm effects.
111. **Astral projection** - Body in trance, spirit travels; body vulnerable.
112. **Atrophied** - Strength reduced to 3; cannot wear heavy armor.
113. **Aura of misfortune** - Allies within 10 ft. roll d20 twice and take lowest.
114. **Bane** - Subtract 1d4 from all attack rolls and saving throws.
115. **Bless** - Add 1d4 to attack rolls and saves.
116. **Blighted** - Plants wither around you; healing from natural sources halved.
117. **Blissful** - You feel no pain; ignore injury penalties but may not notice low HP.
118. **Blurred** - Attacks against you have disadvantage until you take damage.
119. **Bouncing** - When you move, you bounce 5 ft. extra in a random direction.
120. **Brittle bones** - Any critical hit breaks a bone; cripple random limb.
121. **Bubble-lung** - Can breathe underwater but cannot speak.
122. **Calcified** - Speed -10 ft., Dex saves disadvantage; becomes petrified after 3 rounds.
123. **Cannibalized** - You have been bitten; roll to avoid turning into a ghoul.
124. **Chained** - Attached to a heavy object; can move only 10 ft. radius.
125. **Chaos shift** - Each turn, swap two random ability scores for 1 round.
126. **Choking** - Cannot breathe; lose 1 HP per round until air regained.
127. **Clumsy** - Any object you hold has 25% chance to drop when you roll a d20.
128. **Cobwebbed** - Restrained by sticky webs; can burn away.
129. **Cold sweat** - Disadvantage on Persuasion; advantage on Intimidation.
130. **Concussed** - -2 to Intelligence and Wisdom saves; cannot cast highest spell level.
131. **Confetti** - Sparkles follow you; you cannot hide.
132. **Congealed** - Blood thickens; healing potions only heal half.
133. **Consumed by greed** - Must loot before fighting.
134. **Cornered** - +2 damage when adjacent to an ally fighting same enemy.
135. **Corrupted** - Alignment shifts toward evil; good spells may fail.
136. **Counting** - You must loudly count prime numbers each turn or take 1d6 psychic.
137. **Cramped** - In a small space; disadvantage on attacks and Dex saves.
138. **Crippling guilt** - Cannot attack a creature that surrendered.
139. **Cursed luck** - Nat 1s count as 2 failures in death saves.
140. **Dancing** - Must use movement to spin in place; can still move but at half speed.
141. **Darkness blinded** - If in magical darkness, also deafened.
142. **Dead man walking** - After 10 rounds, you die unless a curse removed.
143. **Deaf-mute** - Cannot speak or hear; no verbal spells, no communication.
144. **Death's door** - At 0 HP, any damage kills you (no death saves).
145. **Debt** - Every gold coin you find disappears (you owe a demon).
146. **Deep freeze** - Turn to solid ice; shatter if fire damage hits.
147. **Defiled** - Holy water harms you; you can be turned as undead.
148. **Dehydrated (severe)** - Exhaustion level 3; drinking water restores only 1 level.
149. **Delirious** - See false monsters; must attack imaginary foes.
150. **Depressed** - You have disadvantage on initiative rolls.
151. **Desiccated** - Take extra 1d4 fire damage; resistance to cold.
152. **Diminished** - Shrink one size category; weapons deal one die smaller damage.
153. **Dire charm** - You attack former allies to protect the charmer.
154. **Disconnected** - Cannot benefit from party buffs (Bless, Bardic, etc.).
155. **Diseased (filth fever)** - On each long rest, lose 1d4 HP max, regain on cure.
156. **Dismembered** - Missing a limb; cannot dual-wield or hold two items.
157. **Dizzy** - When you move, you must save or fall prone after.
158. **Doomed** - Prophecy says you die in 24 hours; nothing can save you (story effect).
159. **Double-vision** - Disadvantage on ranged attacks and Perception.
160. **Dragged** - Held by a moving creature; you slide behind them, leaving a trail.
161. **Drained (ability)** - One stat reduced by 1d4; restore after long rest.
162. **Drenched** - Wet; fire resistance +1, electricity vulnerability.
163. **Droning** - A sound pesters you; concentration checks at disadvantage.
164. **Drowning** - In water without air; each round make Con save or take 1d6 damage.
165. **Drunk (magical)** - Every step has 10% chance to teleport you 5 ft. random direction.
166. **Dulled senses** - Blind, deaf, and numb; no sight, sound, or touch.
167. **Dust devil** - You are spinning uncontrollably; cannot target specific enemies.
168. **Earworm** - A song loops in mind; disadvantage on concentration.
169. **Echoed** - Your spells also affect a random ally (25% chance).
170. **Ectoplasmic** - You become slightly ghostly; physical attacks miss 50% but you cannot affect objects.
171. **Effervescent** - You float 2 ft. off ground, speed +10 ft., but cannot wrestle.
172. **Egg-laid** - Parasite grows inside; after 1 day, burst: 4d6 damage to you.
173. **Enchanted sleep** - Magical sleep; cannot be woken by non-magical means.
174. **Endless hiccups** - Every time you speak, roll d20; on 1, you vomit (lose action).
175. **Eroded** - Armor and weapon durability reduced by 50%.
176. **Essence leak** - Lose 1 max MP per minute until sealed.
177. **Ethereal** - Partially in ghost plane; can walk through walls but cannot attack material.
178. **Euphoric** - +2 to Cha, -2 to Wis, ignore pain (do not notice HP loss).
179. **Exposed** - Cannot benefit from cover.
180. **Extinguished** - Magical fire effects on you are suppressed.
181. **Fading** - Over 10 rounds, become invisible and then nonexistent (save ends).
182. **Fake death** - Appear dead; enemies ignore you, but you cannot move or act.
183. **Fame** - NPCs recognize you; advantage on Persuasion but disadvantage on Stealth.
184. **Fever dream** - Half your HP is illusionary; damage to it does not hurt you.
185. **Fingerless** - Cannot use items, pick locks, or wield most weapons.
186. **Flame tongue** - Your speech ignites flammable gas; breathe fire (2d6, 15 ft. cone).
187. **Floating** - Drift upward 10 ft./round unless anchored.
188. **Flying (forced)** - You are thrown into the air; take falling damage after.
189. **Focus fire** - All enemies gain +1 to hit you when you are the only target.
190. **Fragile** - All damage you take is doubled.
191. **Frozen solid** - Petrified (ice version); fire thaws but deals no damage.
192. **Fungal infection** - Mushrooms sprout; you can release spores (poison cloud) but lose 1 HP/hour.
193. **Furious** - +2 melee damage, -2 AC, cannot retreat.
194. **Fuzzy** - You have hair covering eyes; disadvantage on Perception and ranged attacks.
195. **Giant growth** - Increased size Large; +1d4 damage, -2 AC, easier to hit.
196. **Glued** - One hand stuck to an object; cannot let go.
197. **Gnashing** - Jaw locks; cannot speak verbal spells but can bite (1d4).
198. **Gooey** - Body melts; -2 AC, but bludgeoning damage is halved.
199. **Gravitas** - You are very heavy; speed -10, immune to forced movement.
200. **Greased** - Covered in oil; advantage to escape grapples, but disadvantage on Dex saves to avoid slipping.

---

## Personality Types (200 Total)

### First 100 (with descriptions)

1. **Abrasive** - Pushes people away with rude honesty; -2 to Persuasion, +2 to Intimidation.
2. **Absent-minded** - Forgets details; advantage on Insight (noticing patterns) but disadvantage on Investigation.
3. **Adventurous** - Always wants to explore; cannot resist a mysterious door or chest.
4. **Affectionate** - Touchy-feely; allies get +1 morale bonus when you are near.
5. **Aggressive** - First to attack; gains a bonus to initiative but often starts unnecessary fights.
6. **Altruistic** - Helps others even at personal cost; will give away last healing potion.
7. **Ambitious** - Seeks power; cannot ignore opportunities for advancement, even treacherous ones.
8. **Anarchic** - Despises authority; will break laws for fun, not just profit.
9. **Apathetic** - Hard to motivate; needs external push to act (DM can compel with bribes).
10. **Arbitrary** - Follows whims; decision dice roll: 1-3 do one thing, 4-6 another.
11. **Arrogant** - Believes they are best; disadvantage on persuasion with those who insult them.
12. **Bashful** - Shy; disadvantage on Performance, but advantage on Stealth.
13. **Bitter** - Resents world; can resist charms but often snubs friendly NPCs.
14. **Blunt** - Says exactly what they think; advantage on Intimidation, disadvantage on Deception.
15. **Boastful** - Brags constantly; allies may get annoyed (disadvantage on group checks).
16. **Bold** - Charges in; immune to Frightened but may trigger traps recklessly.
17. **Bored** - Needs excitement; will poke a sleeping dragon just to feel alive.
18. **Braggart** - Exaggerates feats; gains small temporary HP after a kill (self-delusion).
19. **Brutal** - Prefers violence over words; deals +1 damage but -1 to social checks.
20. **Calculating** - Thinks five steps ahead; can reroll one failed strategic check per day.
21. **Callous** - Unmoved by suffering; no penalty for torture, but cannot inspire loyalty.
22. **Careful** - Checks for traps twice; movement speed reduced by 10 ft. when exploring.
23. **Careless** - Rushes in; +1 to initiative but often triggers traps.
24. **Charismatic** - Natural leader; allies within 30 ft. gain +1 to saves vs. fear.
25. **Charming** - Everyone likes you; advantage on first impression checks.
26. **Chauvinistic** - Believes race/class superior; advantage against that group but others dislike you.
27. **Cheerful** - Optimistic; after a short rest, roll 1d6 to remove one level of exhaustion (once/day).
28. **Cocky** - Overconfident; can taunt enemies into focusing you.
29. **Cold** - Emotionless; immune to intimidation and charm but cannot inspire.
30. **Competitive** - Must win; when an ally succeeds, you try to do better (advantage on next roll).
31. **Complacent** - Lazy; may refuse to move unless directly threatened.
32. **Compulsive** - Obsessive habits; must count arrows, lock doors twice, etc.
33. **Conceited** - Vain; spends time grooming, might miss surprise rounds.
34. **Confident** - Sure of self; can ignore one failed social roll per session (act as if succeeded).
35. **Conscientious** - Follows rules; lawful alignment, will not break local laws unless dire.
36. **Cowardly** - Flees from danger; when bloodied, must flee or save to stay.
37. **Crafty** - Loves trickery; advantage on Deception and Sleight of Hand.
38. **Cunning** - Smart in a sly way; can use Intelligence for Intimidation (verbal threats).
39. **Cynical** - Trusts no one; advantage on Insight vs. lies, but never accepts help first time.
40. **Daring** - Takes risks; when you attempt a dangerous action, gain +2 to the roll.
41. **Deceitful** - Lies routinely; disadvantage on Persuasion but advantage on Deception.
42. **Devoted** - Loyal to a cause or person; will die for them, immune to fear when protecting them.
43. **Disciplined** - Follows a code; can ignore one temptation (e.g., cursed gold) per day.
44. **Dishonest** - Cheats at cards, lies for fun; disadvantage on Insight (assumes others lie too).
45. **Dutiful** - Always follows orders; can endure hardship without complaint (ignore one level of exhaustion for 1 hour).
46. **Eager** - Enthusiastic to start; +1 to initiative, but may interrupt plans.
47. **Earnest** - Sincere; advantage on Persuasion when telling truth, disadvantage when lying.
48. **Easily bored** - Fidgets; cannot take the Help action twice in a row.
49. **Egomaniacal** - Thinks they are the main character; will not share loot fairly.
50. **Elitist** - Looks down on lower status; advantage on Intimidation against them, but they hate you.
51. **Empathetic** - Feels others' pain; can heal using your own HP (transfer 1d4 HP to ally).
52. **Enthusiastic** - Overjoyed; can grant one ally temporary HP (1d6) by cheering them.
53. **Envious** - Wants what others have; may steal from party if they have nicer gear.
54. **Erratic** - Unpredictable; each morning, roll to determine a new quirk (talkative, silent, etc.).
55. **Excitable** - Screams a lot; disadvantage on Stealth, but can intimidate weak enemies.
56. **Fatalistic** - Believes destiny fixed; cannot be persuaded to avoid a doomed path.
57. **Fearful** - Jumpy; disadvantage on saves vs. fear, but advantage on Perception to avoid ambush.
58. **Flamboyant** - Over the top; advantage on Performance, but enemies target you more.
59. **Foolhardy** - Rushes into obvious traps; but gains +1 AC when below half HP (reckless courage).
60. **Forgiving** - Lets grudges go; can end a feud with a successful Persuasion check.
61. **Friendly** - Easy to like; NPCs start neutral instead of indifferent.
62. **Frugal** - Hoards resources; can make a gold piece last twice as long for living expenses.
63. **Gallant** - Chivalrous; advantage on Persuasion with those you protect.
64. **Generous** - Gives freely; party members have increased morale (reroll 1s on death saves).
65. **Glib** - Smooth talker; can talk their way past a guard without a check once per day.
66. **Gluttonous** - Overeats; must consume double rations but gains 1d4 temp HP after a feast.
67. **Greedy** - Hoards treasure; disadvantage on Wisdom saves to resist cursed items.
68. **Grim** - Morose; never surprised (used to worst outcomes).
69. **Grumpy** - Complains constantly; allies sometimes ignore your warnings (disadvantage on group Persuasion).
70. **Gullible** - Believes anything; disadvantage on Insight vs. Deception.
71. **Hardy (emotionally)** - Tough psyche; immune to non-magical despair.
72. **Haughty** - Looks down on everyone; advantage on Intimidation, disadvantage on Persuasion with equals.
73. **Heroic** - Runs toward danger; can use reaction to intercept an attack meant for ally.
74. **Honest** - Cannot lie; advantage on Persuasion when telling truth, cannot use Deception.
75. **Hot-headed** - Quick to anger; when insulted, must attack or save or suffer disadvantage.
76. **Humble** - Downplays achievements; allies get spotlight (advantage on their next roll after you defer).
77. **Idealistic** - Believes in perfect world; can ignore first betrayal of ideals per session.
78. **Impatient** - Cannot wait; forced to act early in initiative (roll twice, take higher).
79. **Impulsive** - Acts without thought; must roll Wisdom save to avoid pressing big red buttons.
80. **Indifferent** - Hard to sway; advantage on saves vs. persuasion.
81. **Inquisitive** - Asks many questions; advantage on Investigation but often annoys NPCs.
82. **Insolent** - Disrespectful; gets into social trouble but gains +1 to saves vs. authority figures.
83. **Jealous** - Hates others' success; may sabotage ally if they get a magic item.
84. **Jolly** - Laughs often; allies recover 1 HP on a short rest if you tell a joke.
85. **Kind** - Gentle; healing spells you cast heal +1 HP.
86. **Lazy** - Prefers sitting; after a long rest, you gain 2 temp HP per level (well rested).
87. **Lecherous** - Flirts constantly; advantage on Persuasion vs. attraction, disadvantage otherwise.
88. **Loyal** - Sticks with friends; can take a hit for a bonded ally (reaction).
89. **Manipulative** - Uses people; advantage on Deception, but allies distrust you (no help actions).
90. **Melancholic** - Sad; can predict doom (once per day, know the worst outcome of a choice).
91. **Merciful** - Spares enemies; can convert a defeated foe to an informant with a good check.
92. **Meticulous** - Double-checks everything; takes extra time but rarely fails skill checks (reroll 1s).
93. **Moody** - Swings emotions; each day, roll 1d4: 1 angry, 2 sad, 3 happy, 4 neutral; affects roleplay.
94. **Naive** - Trusts easily; very vulnerable to Deception but rarely suspects betrayal.
95. **Nihilistic** - Believes nothing matters; immune to despair effects, but unmotivated (needs push).
96. **Nosy** - Pokes into business; disadvantage on Stealth but may find secrets.
97. **Obedient** - Follows orders; when a superior gives a command, you must obey or save.
98. **Obsessive** - Fixates; pick a goal (e.g., collect skulls), you get advantage on checks toward it but ignore others.
99. **Optimistic** - Sees the bright side; each dawn, remove one level of exhaustion (natural healing only).
100. **Pacifistic** - Avoids violence; cannot deal killing blow, but can use non-lethal damage freely.

### Additional 100 Personality Types (101-200)

101. **Paranoid** - Suspects traps everywhere; advantage on Perception to find ambushes, but allies' friendly gestures may be misinterpreted.
102. **Patient** - Will wait for hours; can skip a turn to gain +2 on next action.
103. **Perfectionist** - Cannot abide failure; if you fail a skill check, you may reroll but must take the second result and suffer 1 psychic damage.
104. **Persuasive** - Natural debater; double proficiency on Persuasion, but only when you have at least 1 minute to speak.
105. **Pessimistic** - Expects the worst; when you make a save, if you fail, you can treat it as a success but then automatically fail the next save.
106. **Pious** - Deeply religious; can pray for guidance (once per day, gain advantage on a single roll).
107. **Playful** - Jokes in combat; enemies have disadvantage on opportunity attacks against you (distracted).
108. **Pompous** - Speaks in grandiosity; disadvantage with commoners, advantage with nobles.
109. **Possessive** - Guards belongings; will not lend items, even to party.
110. **Pragmatic** - Does what works; can ignore one moral dilemma per session.
111. **Preachy** - Lectures others; allies may gain +1 to a future save from your advice, but find you annoying.
112. **Precise** - Measures everything; no penalty for called shots.
113. **Pretentious** - Uses big words; advantage on Performance when trying to impress intellectuals.
114. **Prickly** - Easily offended; if insulted, your next attack deals +2 damage.
115. **Proud** - Won't beg; would rather die than ask for help (disadvantage on Persuasion to request aid).
116. **Prudish** - Shocked by vulgarity; disadvantage on saves vs. charm from seductive enemies.
117. **Pugnacious** - Ready to fight; when someone challenges you, you must roll Wisdom save or start combat.
118. **Punctual** - Always on time; cannot be late for rendezvous; may abandon late allies.
119. **Quiet** - Speaks rarely; advantage on Stealth while not speaking, but disadvantage on group Persuasion.
120. **Quixotic** - Fights windmills; will attack imaginary enemies (hallucinations) unless an ally restrains you.
121. **Rabble-rouser** - Incites crowds; can start a riot with a single speech (once per town).
122. **Rash** - Acts without thinking; when you have a plan, you must roll Int save to not do the first thing that comes to mind.
123. **Reckless** - No self-preservation; you gain advantage on attack rolls until the end of your next turn after you take damage.
124. **Reflective** - Thinks before speaking; can delay your turn to the end of the round to gain +1 to all rolls.
125. **Regretful** - Haunted by past; when you see an ally fail, you can take the failure yourself (transfer).
126. **Relentless** - Never gives up; when you fail a death save, you can reroll (once per long rest).
127. **Reliable** - Always does what they say; NPCs trust you automatically for small favors.
128. **Religious** - Sees omens; can detect nearby holy or unholy ground (feeling).
129. **Remorseless** - No guilt; can kill without alignment shift, but cannot be redeemed.
130. **Resentful** - Holds grudges; cannot forgive a betrayal, will seek revenge.
131. **Reserved** - Keeps feelings hidden; advantage on Deception to conceal emotions, disadvantage on Insight to read others.
132. **Resolute** - Once decided, cannot change; you must complete a chosen action even if better option appears.
133. **Resourceful** - Uses junk; can craft simple tools from scraps without a check.
134. **Respectful** - Honors others; gains advantage on Persuasion with elders and leaders.
135. **Responsible** - Takes blame; when a party plan fails, you take double share of consequences but party morale improves.
136. **Restless** - Cannot sit still; after 1 hour of inaction, you gain -1 to all rolls until you move.
137. **Reticent** - Secretive; disadvantage on Deception (too quiet) but advantage on saving throws vs. being interrogated.
138. **Retiring** - Shuns attention; cannot be the face of the party (refuses to speak for group).
139. **Revengeful** - Vengeance-driven; if an enemy damages you, you gain +2 damage against them until they die.
140. **Reverent** - In awe of nature/ancestors; can pray for a favorable wind or weather once a week.
141. **Rigid** - Inflexible; cannot adapt to changing plans; if a plan changes, you lose your action for 1 turn.
142. **Risky** - Loves gambling; can double or nothing on any d20 roll (reroll, but must take new result even if worse).
143. **Rivalrous** - Seeks to outdo a specific ally; when that ally succeeds, you get advantage on your next check.
144. **Romantic** - Believes in love; can charm humanoids more easily (advantage on Persuasion if you romanticize them).
145. **Rowdy** - Loud and brash; disadvantage on Stealth but advantage on Intimidation.
146. **Ruthless** - No mercy; can coup de grace as a bonus action.
147. **Sadistic** - Enjoys pain; when you cause an enemy to suffer a status effect, you gain 1d4 temp HP.
148. **Sage-like** - Wise old soul; party members can ask you for advice once per day (gain advantage on next save).
149. **Saintly** - Selfless; will sacrifice own HP to heal another (2:1 ratio).
150. **Sarcastic** - Makes biting remarks; advantage on Intimidation via insults, disadvantage on Persuasion.
151. **Savage** - Brutal in fight; when you kill an enemy, you may immediately make another attack (once per turn).
152. **Scatterbrained** - Unfocused; can maintain concentration on two spells at once, but each has a 25% chance to fail each turn.
153. **Scofflaw** - Disregards law; cannot be bound by oaths or contracts (magical ones still affect you).
154. **Scrupulous** - Very moral; must confess any minor sin to a priest or suffer disadvantage on next day's rolls.
155. **Secretive** - Hides past; advantage on Deception about your identity, disadvantage on Insight (you lie so much you trust no one).
156. **Seductive** - Tempts others; advantage on Charisma checks vs. targets who could be attracted to you.
157. **Selfish** - Puts self first; will not share healing potions unless paid.
158. **Self-pitying** - Whines; allies may give you a morale bonus (+1 to next roll) just to shut you up.
159. **Self-righteous** - Believes always right; immune to intimidation from enemies who are evil.
160. **Sensitive** - Easily hurt; disadvantage on saves vs. insults (Vicious Mockery) but advantage on Perception to read emotions.
161. **Sentimental** - Keeps mementos; can draw strength from a keepsake (reroll a failed death save).
162. **Serene** - Calm; cannot be surprised or frightened.
163. **Serious** - No humor; immune to Tasha's Hideous Laughter.
164. **Servile** - Seeks to serve; when you follow an order, you gain +1 to all rolls for 1 minute.
165. **Shameless** - No embarrassment; cannot be intimidated by shame-based threats.
166. **Sharp-tongued** - Whip-smart retorts; can use a reaction to insult an attacker, giving them disadvantage on the next attack.
167. **Sheepish** - Easily embarrassed; if someone compliments you, you lose your next turn (blushing).
168. **Shiftless** - Lazy as a trait; must be bribed (literally gold) to take initiative.
169. **Short-tempered** - Explodes easily; after 3 minor annoyances, you rage without control.
170. **Shrewd** - Sly merchant; can sell items for 20% more.
171. **Shy** - Avoids attention; you cannot be the target of a Help action because you refuse it.
172. **Silly** - Goofy; enemies may laugh and lose their reaction for 1 round (once per combat).
173. **Sincere** - Heart on sleeve; advantage on Persuasion when speaking truth, but cannot bluff.
174. **Skeptical** - Doubts magic; can attempt to disbelieve illusions twice per day.
175. **Sly** - Sneaky personality; advantage on Stealth and Sleight of Hand.
176. **Smug** - Self-satisfied; after a success, you gain +1 to next roll, but if you fail, you lose 2 on the following.
177. **Snobbish** - Looks down on poor; disadvantage on Persuasion with lower class but advantage with upper class.
178. **Solemn** - Grave demeanor; cannot be moved by jokes or taunts.
179. **Sorrowful** - Always in mourning; can sense death (detect corpses within 100 ft.).
180. **Sour** - Bitter expression; any good news you deliver gives allies disadvantage (they expect a catch).
181. **Spendthrift** - Spends lavishly; NPCs love you (advantage on all social rolls in a town after you tip well).
182. **Spiteful** - Hurts others in revenge; if someone wrongs you, you gain +2 to attacks against them for 24 hours.
183. **Sporting** - Loves fair fights; will not attack surprised enemies or use poison.
184. **Stoic** - Endures without complaint; can ignore the first failed concentration check per day.
185. **Stubborn** - Won't change mind; once you decide a course of action, you cannot be persuaded otherwise by any means.
186. **Suave** - Smooth operator; advantage on Persuasion when romance or charm is involved.
187. **Submissive** - Defers to others; when an ally gives you an order, you must obey (Wis save to resist).
188. **Sullen** - Gloomy and silent; allies cannot use Help actions on you.
189. **Suspicious** - Thinks everyone hides something; advantage on Insight, but you automatically distrust friendly NPCs.
190. **Sympathetic** - Feels for underdogs; will side with the weak even against party interests.
191. **Tactful** - Says the right thing; can salvage any social failure once per day (reroll a failed Persuasion).
192. **Talkative** - Never shuts up; disadvantage on Stealth but advantage on Performance when distracting.
193. **Temperamental** - Explodes unpredictably; when you take damage, roll d6; on a 1, you attack nearest creature.
194. **Tenacious (personality)** - Never yields; after being knocked prone, you stand up as a free action.
195. **Thrifty** - Saves everything; can repair broken mundane items with a DC 10 check.
196. **Timid** - Frightened easily; you must roll Wis save when a monster roars or suffer Frightened condition.
197. **Tolerant** - Accepts all; advantage on Persuasion with diverse groups.
198. **Tortured** - Haunted by past; you gain +1 damage when below half HP (adrenaline from trauma).
199. **Trusting** - Believes everyone; you cannot use Insight to detect lies (auto-fail).
200. **Zealous** - Fanatical about a cause; when acting for that cause, you have advantage on saves vs. fear and charm.

---

## Design Notes

- These lists intentionally mix tabletop-native effects, CRPG staples, and original flavor effects for emergent idle simulation.
- Recommended implementation pattern:
  - keep a large hidden candidate pool
  - reveal gradually via daily logs
  - expose only surfaced effects/traits in profile
  - retain deterministic selection via seeded daily simulation

