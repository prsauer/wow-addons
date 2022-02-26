var fs = require("fs");
const commonPvpSpellsFileData = fs.readFileSync("pvpCommonSpells.json", "utf8");
const commonPvpSpells: number[] = JSON.parse(commonPvpSpellsFileData);

const MAX_SCAN_DEPTH = 25;

type PvPModifier = [number, string];

type SpellInfo = {
  spellId: number;
  name: string;
  pvpModifiers: PvPModifier[];
  /**
   * Spells that directly (1-hop) trigger this spell; DB entry
   */
  triggeredBy: number[];
  /**
   * Spells that directly (1-hop) affect this spell; DB entry
   */
  affectedBy: number[];
  /**
   * All spells that this spell triggers; computed
   */
  triggerChain: number[];
  /**
   * All spells that affect this spell; computed
   */
  affectedByChain: number[];
  pvpModifiersFromTriggers: PvPModifier[];
  pvpModifiersFromAffectors: PvPModifier[];
};

console.log("Loaded", FILEPATH);

const lines = data.split("\n");

function parseNameLine(line) {
  /*
    This regex filters out all the noise in ability names in the simc data
    */
  const findName = new RegExp(
    /^Name\s*: (?<spellName>[\[\]\.&><_a-zA-Z-+,%/:0-9!" ']*( \(Test\))?( \(Self\) \(Aura Applied\/Removed\))?( \(unused\))?( \(DNT\))?( \(Visual\))?( \(Enveloping Mist\))?( \(Vivify\))?( \(CSA\))?( \(Fel-Touched\))?( \(Traveler's\))?( \(Bulging\))?( \(Holy\))?( \(Guaranteed Loot\))?( \(HARDCODED\))?( \(2H PVP Weapon Budget\))?( \(5\))?( \(Player\))?( \(Purple\))?( \(DND\))?( \(Lunar\))?( \(Solar\))?( \(Passive\))?) (\(desc=(?<desc>[a-zA-Z 0-9,]*)\) )?(\(id=(?<spellId>[0-9]*)\))? (?<tags>\[.*\])?/
  );
  const res = findName.exec(line);
  const spellInfo = res?.groups;

  if (!spellInfo || !spellInfo.spellId) {
    console.log(res?.groups);
    console.log(line);
    throw new Error("Could not parse Name line!");
  }
  return { spellId: parseInt(spellInfo.spellId), name: spellInfo.spellName };
}

function makeEmptySpellInfo(): SpellInfo {
  return {
    spellId: -1,
    name: "",
    pvpModifiers: [],
    triggeredBy: [],
    affectedBy: [],
    triggerChain: [],
    affectedByChain: [],
    pvpModifiersFromTriggers: [],
    pvpModifiersFromAffectors: [],
  };
}
let currentSpellInfo: SpellInfo = makeEmptySpellInfo();

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.search("Name") > -1) {
    currentSpellInfo = makeEmptySpellInfo();
    const parsedNameLine = parseNameLine(line);
    currentSpellInfo.name = parsedNameLine.name;
    curSpell = spellInfo.spellId;
    spellObjects[curSpell] = {
      info: spellInfo,
      affectingSpellIds: [],
      pvpCoeffs: [],
      triggerSpellIds: [],
    };
  }
  if (line.search("^GCD  ") > -1) {
    spellObjects[curSpell].gcd = /\s*GCD\s*: (.*) seconds/.exec(line)[1];
  }
  if (line.search("^Class  ") > -1) {
    spellObjects[curSpell].class = /\s*Class\s*: (.*)/.exec(line)[1];
  }
  if (line.search("^Duration  ") > -1) {
    spellObjects[curSpell].duration = /\s*Duration\s*: (.*)/.exec(line)[1];
  }
  if (line.search("^Cooldown   ") > -1) {
    spellObjects[curSpell].cooldown = /\s*Cooldown\s*: (.*)/.exec(line)[1];
  }
  if (line.search("^Charges") > -1) {
    spellObjects[curSpell].charges = /\s*Charges\s*: (.*)/.exec(line)[1];
  }
  if (line.search("^Azerite Power Id") > -1) {
    spellObjects[curSpell].azeritePowerId = /\s*Azerite Power Id\s*: (.*)/.exec(
      line
    )[1];
  }
  if (line.search("^Affecting spells") > -1) {
    let affs = [];
    const rx = /(\((?<spellId>[0-9]*) )/g;
    while ((match = rx.exec(line)) != null) {
      if (isNaN(parseInt(match.groups.spellId))) {
        console.log(line);
        throw new Error("Failed parse");
      }
      affs.push(parseInt(match.groups.spellId));
    }
    spellObjects[curSpell].affectingSpellIds = affs;
  }
  if (line.search("PvP Coefficient") > -1) {
    //                    Base Value: 5000 | Scaled Value: 5000 | PvP Coefficient: 0.50000 | Target: Self (1)
    const pvpCoeff = parseFloat(
      /.*PvP Coefficient: ([0-9\.]*) |/.exec(line)[1]
    );
    const prev = lines[i - 1];
    const effects = prev.slice(19).split("|");
    const simpleName = effects[effects.length - 1].trim().split("(")[0].trim();
    spellObjects[curSpell].pvpCoeffs.push([pvpCoeff, simpleName]);
  }
  // Triggered by     : Soul Fragment (203795), Soul Fragment (204255)
  if (line.search("^Triggered by") > -1) {
    let trigs = [];
    const rx = /(\((?<spellId>[0-9]{3,}))/g;
    while ((match = rx.exec(line)) != null) {
      if (isNaN(parseInt(match.groups.spellId))) {
        console.log(line);
        throw new Error("Failed parse");
      }
      trigs.push(parseInt(match.groups.spellId));
    }
    spellObjects[curSpell].triggerSpellIds = trigs;
  }
}

function getSpellInfo(id: number) {
  return spellData.find((a) => a.spellId === id);
}

function recurseTriggersAndCollectModifiers(
  curSpell: SpellInfo,
  acc: PvPModifier[]
) {
  curSpell.triggeredBy.forEach((t) =>
    recurseTriggersAndCollectModifiers(getSpellInfo(t), acc)
  );
  acc.push(...curSpell.pvpModifiers);
  return acc;
}

const spellData: SpellInfo[] = [];

// A {
//   id: 100,
//   triggeredBy: [],
// }

// B {
//   id: 101,
//   triggeredBy: [100]
// }

// C {
//   id: 102,
//   triggeredBy: [101]
// }

// A -> B -> C

// Process spells with no triggered by data: this implies that they are the
// first in any potential a-trigs-b chain
const spellsWithNoTriggers = spellData.filter(
  (s) => s.triggeredBy.length === 0
);
// Scan each spell for potential PvP modifiers later in the triggers chain
for (let idx = 0; idx < spellsWithNoTriggers.length; idx += 1) {
  const curSpell = spellsWithNoTriggers[idx];
  const triggersChain = new Set<number>();
  for (let depth = 0; depth < MAX_SCAN_DEPTH; depth += 1) {
    const preScanLength = triggersChain.size;
    // Scan
    for (let jdx = 0; jdx < spellData.length; jdx += 1) {
      if (idx === jdx) continue;
      const compSpell = spellData[jdx];
      // Some spell triggers the current spell directly
      if (compSpell.triggeredBy.includes(curSpell.spellId)) {
        triggersChain.add(compSpell.spellId);
      }
      // Some spell is triggered by something else in the chain
      triggersChain.forEach((t) => {
        if (compSpell.triggeredBy.includes(t)) {
          triggersChain.add(compSpell.spellId);
        }
      });
    }
    // We completed a scan and didn't add anything
    // This must be the end of the chain
    if (triggersChain.size === preScanLength) {
      break;
    }
  }
  curSpell.triggerChain = Array.from(triggersChain);
  curSpell.pvpModifiersFromTriggers = curSpell.triggerChain
    .map((s) => getSpellInfo(s).pvpModifiers)
    .flat();
}

// Process 'affected-by' statements in the spells db
function recurseAffectsAndCollectModifiers(curSpell: SpellInfo, acc: number[]) {
  curSpell.affectedBy.forEach((t) =>
    recurseAffectsAndCollectModifiers(getSpellInfo(t), acc)
  );
  acc.push(curSpell.spellId);
  return acc;
}
// For each spell, recurse over the 'affected-by' chain and accumulate the list of all spells
// that affect this spell's entire chain
for (let idx = 0; idx < spellData.length; idx += 1) {
  const curSpell = spellData[idx];
  const affectedByChain = recurseAffectsAndCollectModifiers(
    curSpell,
    []
  ).filter((s) => s !== curSpell.spellId);
  curSpell.affectedByChain = affectedByChain;
  curSpell.pvpModifiersFromAffectors = curSpell.affectedByChain
    .map((s) => getSpellInfo(s).pvpModifiers)
    .flat();
}

// Dump data to examine
fs.writeFileSync("spellDataParsed.json", JSON.stringify(spellData, null, " "));

// Write the tooltip data file
function nerfCoeffToString(n) {
  return (100.0 * (1 - n)).toFixed(1) + "%";
}

function makeRed(s) {
  return `|cFFFF0000${s}|r`;
}

let lualines = "";
const commonSpellObjects = commonPvpSpells
  .map((id) => getSpellInfo(id))
  .filter((o) => Boolean(o));

commonSpellObjects.forEach((o) => {
  let naturalModifiers = o.pvpModifiers.map(
    (n) =>
      `Affected by ${makeRed(nerfCoeffToString(n[0]))} nerf to ${o.name}'s ${
        n[1]
      } effect\n`
  );
  let affectedByEffects = o.pvpModifiersFromAffectors.map(
    (n) =>
      `Affected by ${makeRed(nerfCoeffToString(n[0]))} nerf to ${o.name}'s ${
        n[1]
      } effect\n`
  );
  let triggerEffects = o.pvpModifiersFromTriggers.map(
    (n) =>
      `Affected by ${makeRed(nerfCoeffToString(n[0]))} nerf to ${o.name}'s ${
        n[1]
      } effect\n`
  );

  let nerfStrings = [
    ...new Set(naturalModifiers),
    ...new Set(affectedByEffects),
    ...new Set(triggerEffects),
  ].join("");
  if (nerfStrings) {
    lualines =
      lualines +
      `[${o.spellId}] = {["edits"] = {}, ["text"] = "${nerfStrings.replace(
        /\n/g,
        "\\n"
      )}"},\n`;
  }
});

fs.writeFileSync("luaChanges.lua", lualines);
console.log("luaChanges.lua written");
