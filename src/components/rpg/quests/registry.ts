import { quest001Origin } from './quest-001-origin';
import { quest002FirstNight } from './quest-002-first-night';
import { quest002BWillIStarve } from './quest-002-b-will-i-starve';
import { quest002CStrangeEggTree } from './quest-002-c-strange-egg-tree';
import { quest002BoarAmbush } from './quest-002-boar-ambush';
import { quest003BMeetMerchant } from './quest-003-b-meet-merchant';
import { quest003DyersCrypt } from './quest-003-dyers-crypt';
import { quest003SilverLake } from './quest-003-silver-lake';
import { quest004AbandonedShelter } from './quest-004-abandoned-shelter';
import { quest004BTheDoor } from './quest-004-b-the-door';
import { quest005ForestCave } from './quest-005-forest-cave';
import { quest005BHome } from './quest-005-b-home';
import { quest005CWolfPeltTribute } from './quest-005-c-wolf-pelt-tribute';
import { quest007DayTwoDream } from './quest-007-day-two-dream';
import { quest007GreenHand } from './quest-007-green-hand';
import { quest008WolfAttack } from './quest-008-wolf-attack';
import { quest009Waterfall } from './quest-009-waterfall';
import { quest010FindEarring } from './quest-010-find-earring';
import { quest011FindBracelet } from './quest-011-find-bracelet';
import { quest012FindShoe } from './quest-012-find-shoe';
import { quest013FindHat } from './quest-013-find-hat';
import { quest014MushroomPatch } from './quest-014-mushroom-patch';
import { quest015FeverDream } from './quest-015-fever-dream';
import { quest016SweetDream } from './quest-016-sweet-dream';
import { quest017IronwoodSwitch } from './quest-017-ironwood-switch';
import { quest018SilverLakeReflection } from './quest-018-silver-lake-reflection';
import { quest019PlaguebloomPhial } from './quest-019-plaguebloom-phial';
import { quest020IronCage } from './quest-020-iron-cage';
import { quest021NineOarRaft } from './quest-021-nine-oar-raft';
import { quest022WarlordsChoice } from './quest-022-warlords-choice';
import { quest023WhisperingTree } from './quest-023-whispering-tree';
import { quest024LoneSapling } from './quest-024-lone-sapling';
import { quest025CrookedCairn } from './quest-025-crooked-cairn';
import { quest026SunBleachedBone } from './quest-026-sun-bleached-bone';
import { quest027SleepingHare } from './quest-027-sleeping-hare';
import { quest028ToppledStones } from './quest-028-toppled-stones';
import { quest029HiddenSpring } from './quest-029-hidden-spring';
import { quest030CharcoalSigil } from './quest-030-charcoal-sigil';
import { quest031FallenCompanion } from './quest-031-fallen-companion';
import { quest032DistantSmoke } from './quest-032-distant-smoke';
import { quest033TwinMounds } from './quest-033-twin-mounds';
import { quest034CarvedAcorns } from './quest-034-carved-acorns';
import { quest035BuriedLantern } from './quest-035-buried-lantern';
import { quest036TheVillage } from './quest-036-the-village';
import { quest037DiscoverCemetery } from './quest-037-discover-cemetery';
import { quest038DiscoverQuarry } from './quest-038-discover-quarry';
import { quest039DiscoverMine } from './quest-039-discover-mine';
import { quest040PickAJob } from './quest-040-pick-a-job';
import { quest041Mayor } from './quest-041-mayor';
import { quest042MayorShannon } from './quest-042-mayor-shannon';
import type { QuestDefinition } from './types';

export const allQuests: QuestDefinition[] = [
  quest001Origin,
  quest002FirstNight,
  quest003DyersCrypt,
  quest002BWillIStarve,
  quest002CStrangeEggTree,
  quest002BoarAmbush,
  quest003BMeetMerchant,
  quest003SilverLake,
  quest004AbandonedShelter,
  quest004BTheDoor,
  quest005ForestCave,
  quest005BHome,
  quest005CWolfPeltTribute,
  quest007DayTwoDream,
  quest007GreenHand,
  quest008WolfAttack,
  quest009Waterfall,
  quest010FindEarring,
  quest011FindBracelet,
  quest012FindShoe,
  quest013FindHat,
  quest014MushroomPatch,
  quest015FeverDream,
  quest016SweetDream,
  quest017IronwoodSwitch,
  quest018SilverLakeReflection,
  quest019PlaguebloomPhial,
  quest020IronCage,
  quest021NineOarRaft,
  quest022WarlordsChoice,
  quest023WhisperingTree,
  quest024LoneSapling,
  quest025CrookedCairn,
  quest026SunBleachedBone,
  quest027SleepingHare,
  quest028ToppledStones,
  quest029HiddenSpring,
  quest030CharcoalSigil,
  quest031FallenCompanion,
  quest032DistantSmoke,
  quest033TwinMounds,
  quest034CarvedAcorns,
  quest035BuriedLantern,
  quest036TheVillage,
  quest037DiscoverCemetery,
  quest038DiscoverQuarry,
  quest039DiscoverMine,
  quest040PickAJob,
  quest041Mayor,
  quest042MayorShannon,
];

export const questById: Record<string, QuestDefinition> = allQuests.reduce<Record<string, QuestDefinition>>(
  (acc, quest) => {
    acc[quest.id] = quest;
    return acc;
  },
  {}
);
