var fs = require("fs");
const FILEPATH = "../../simc/SpellDataDump/allspells.txt";
const MAX_SCAN_DEPTH = 25;

const simcSpellDumpData = fs.readFileSync(FILEPATH, "utf8");

const spellData: SpellInfo[] = [];

//                 coeff,   effectName,  spellId, spellName
type PvPModifier = [number, string, number, string];

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
  azeritePowerId: string;
  affectedByChain: number[];
  pvpModifiersFromTriggers: PvPModifier[];
  pvpModifiersFromAffectors: PvPModifier[];
};

console.log("Loaded", FILEPATH);

const lines = simcSpellDumpData.split("\n");

function parseNameLine(line: string) {
  /*
    This regex filters out all the noise in ability names in the simc data
    */
  //// Name             : Rejuvenation (Germination) (id=155777) [Spell Family (7)]
  const findName = new RegExp(
    /^Name\s*: (?<spellName>[\[\]\.&><_a-zA-Z-+,%/:0-9!" ']*( \(Test\))?( \(Self\) \(Aura Applied\/Removed\))?( \(unused\))?( \(DNT\))?( \(Visual\))?( \(Enveloping Mist\))?( \(Vivify\))?( \(CSA\))?( \(Fel-Touched\))?( \(Traveler's\))?( \(Bulging\))?( \(Holy\))?( \(Guaranteed Loot\))?( \(HARDCODED\))?( \(2H PVP Weapon Budget\))?( \(5\))?( \(Player\))?( \(Purple\)?( \(\)))?( \(Germination\))?( \(Purple\))?( \(DND\))?( \(Lunar\))?( \(Solar\))?( \(Passive\))?) (\(desc=(?<desc>[a-zA-Z 0-9,]*)\) )?(\(id=(?<spellId>[0-9]*)\))? (?<tags>\[.*\])?/
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
    azeritePowerId: "",
  };
}
let currentSpellInfo: SpellInfo = makeEmptySpellInfo();

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.search("Name             :") > -1) {
    if (currentSpellInfo.spellId > -1) spellData.push(currentSpellInfo);
    currentSpellInfo = makeEmptySpellInfo();
    const parsedNameLine = parseNameLine(line);
    currentSpellInfo.name = parsedNameLine.name;
    currentSpellInfo.spellId = parsedNameLine.spellId;
  }
  // if (line.search("^GCD  ") > -1) {
  //   currentSpellInfo.gcd = /\s*GCD\s*: (.*) seconds/.exec(line)[1];
  // }
  // if (line.search("^Class  ") > -1) {
  //   currentSpellInfo.class = /\s*Class\s*: (.*)/.exec(line)[1];
  // }
  // if (line.search("^Duration  ") > -1) {
  //   currentSpellInfo.duration = /\s*Duration\s*: (.*)/.exec(line)[1];
  // }
  // if (line.search("^Cooldown   ") > -1) {
  //   currentSpellInfo.cooldown = /\s*Cooldown\s*: (.*)/.exec(line)[1];
  // }
  // if (line.search("^Charges") > -1) {
  //   currentSpellInfo.charges = /\s*Charges\s*: (.*)/.exec(line)[1];
  // }
  if (line.search("^Azerite Power Id") > -1) {
    const azGrep = /\s*Azerite Power Id\s*: (.*)/.exec(line);
    currentSpellInfo.azeritePowerId = azGrep && azGrep[1] ? azGrep[1] : "";
  }
  if (line.search("^Affecting spells") > -1) {
    let affs = [];
    let match: RegExpExecArray | null;
    const rx = /(\((?<spellId>[0-9]*) )/g;
    while ((match = rx.exec(line)) != null) {
      if (match.groups && isNaN(parseInt(match.groups.spellId))) {
        console.log(line);
        throw new Error("Failed parse");
      }
      if (match.groups) affs.push(parseInt(match.groups.spellId));
    }
    currentSpellInfo.affectedBy = affs;
  }
  if (line.search("PvP Coefficient") > -1) {
    //                    Base Value: 5000 | Scaled Value: 5000 | PvP Coefficient: 0.50000 | Target: Self (1)
    const pvpGrep = /.*PvP Coefficient: ([0-9\.]*) |/.exec(line);
    const pvpCoeff = parseFloat(pvpGrep && pvpGrep[1] ? pvpGrep[1] : "");
    const prev = lines[i - 1];
    const effects = prev.slice(19).split("|");
    const simpleName = effects[effects.length - 1].trim().split("(")[0].trim();
    if (pvpCoeff <= 0.9999 || pvpCoeff >= 1.001)
      currentSpellInfo.pvpModifiers.push([
        pvpCoeff,
        simpleName,
        currentSpellInfo.spellId,
        currentSpellInfo.name,
      ]);
  }
  // Triggered by     : Soul Fragment (203795), Soul Fragment (204255)
  if (line.search("^Triggered by") > -1) {
    let match;
    let trigs = [];
    const rx = /(\((?<spellId>[0-9]{3,}))/g;
    while ((match = rx.exec(line)) != null) {
      if (match.groups && isNaN(parseInt(match.groups.spellId))) {
        console.log(line);
        throw new Error("Failed parse");
      }
      if (match.groups) trigs.push(parseInt(match.groups.spellId));
    }
    currentSpellInfo.triggeredBy = trigs;
  }
}

function getSpellInfo(id: number): SpellInfo {
  const s = spellData.find((a) => a.spellId === id);
  if (s) return s;
  throw new Error(`SpellInfo missing from spellData for ${id}`);
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

console.log("Ingesting triggered-by data");
// Process spells with no triggered by data: this implies that they are the
// first in any potential a-trigs-b chain
const spellsWithNoTriggers = spellData.filter(
  (s) => s.triggeredBy.length === 0
);
// Scan each spell for potential PvP modifiers later in the triggers chain
for (let idx = 0; idx < spellsWithNoTriggers.length; idx += 1) {
  const curSpell = spellsWithNoTriggers[idx];
  // console.log("Trigger - ", curSpell.name, curSpell.spellId);
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

console.log("Ingesting affected-by data");
// Process 'affected-by' statements in the spells db
function recurseAffectsAndCollectModifiers(
  curSpell: SpellInfo,
  acc: number[],
  dep: number
) {
  if (dep > 5) {
    return acc;
  }
  curSpell.affectedBy.forEach((t) =>
    recurseAffectsAndCollectModifiers(getSpellInfo(t), acc, dep + 1)
  );
  acc.push(curSpell.spellId);
  return acc;
}
// For each spell, recurse over the 'affected-by' chain and accumulate the list of all spells
// that affect this spell's entire chain
for (let idx = 0; idx < spellData.length; idx += 1) {
  const curSpell = spellData[idx];
  // console.log("Affected-by", curSpell);
  const affectedByChain = recurseAffectsAndCollectModifiers(
    curSpell,
    [],
    0
  ).filter((s) => s !== curSpell.spellId);
  curSpell.affectedByChain = affectedByChain;
  curSpell.pvpModifiersFromAffectors = curSpell.affectedByChain
    .map((s) => getSpellInfo(s).pvpModifiers)
    .flat();
}

// Dump data to examine
fs.writeFileSync("spellDataParsed.json", JSON.stringify(spellData, null, " "));

// Write the tooltip data file
function nerfCoeffToString(n: number) {
  if (n < 1) return (100.0 * (1 - n)).toFixed(1) + "%";
  return (100.0 * (n - 1)).toFixed(1) + "%";
}

function makeRed(s: string) {
  return `|cFFFF0000${s}|r`;
}

function makeYellowish(s: string) {
  return `|cFFFFFF00${s}|r`;
}

let lualines = "";
console.log("Mapping common pvp spells");
// 528 before
const commonSpellObjects = spellData;

function isAzeritePower(s: number) {
  return Boolean(getSpellInfo(s).azeritePowerId);
}

function nerfToString(n: PvPModifier) {
  if (n[0] < 1) {
    return `Affected by ${makeRed(nerfCoeffToString(n[0]))} nerf to ${n[3]}'s ${
      n[1]
    } effect\n`;
  }
  return `Affected by ${makeYellowish(nerfCoeffToString(n[0]))} buff to ${
    n[3]
  }'s ${n[1]} effect\n`;
}

console.log("Parsing triggers and affects");
commonSpellObjects.forEach((o) => {
  let naturalModifiers = o.pvpModifiers
    .filter((s) => !isAzeritePower(s[2]))
    .map((n) => nerfToString(n));
  let affectedByEffects = o.pvpModifiersFromAffectors
    .filter((s) => !isAzeritePower(s[2]))
    .map((n) => nerfToString(n));
  let triggerEffects = o.pvpModifiersFromTriggers
    .filter((s) => !isAzeritePower(s[2]))
    .map((n) => nerfToString(n));

  let nerfStrings = [
    ...Array.from(new Set(naturalModifiers)),
    ...Array.from(new Set(affectedByEffects)),
    ...Array.from(new Set(triggerEffects)),
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

console.log("Writing lua changes");
fs.writeFileSync("luaChanges.lua", lualines);
console.log("luaChanges.lua written");
