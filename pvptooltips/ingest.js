var fs = require('fs');
const spellObjects = {};
const FILEPATH = '../../simc/SpellDataDump/allspells_ptr.txt';
const data = fs.readFileSync(FILEPATH, 'utf8');
const commonPvpSpellsFileData = fs.readFileSync('pvpCommonSpells.json', 'utf8');
const commonPvpSpells = JSON.parse(commonPvpSpellsFileData);

console.log('Loaded', FILEPATH);

const lines = data.split('\n');

function parseNameLine(line) {
    /*
    This regex filters out all the noise in ability names in the simc data
    */
    const findName = new RegExp(/^Name\s*: (?<spellName>[\[\]\.&><_a-zA-Z-+,%/:0-9!" ']*( \(Test\))?( \(Self\) \(Aura Applied\/Removed\))?( \(unused\))?( \(DNT\))?( \(Visual\))?( \(Enveloping Mist\))?( \(Vivify\))?( \(CSA\))?( \(Fel-Touched\))?( \(Traveler's\))?( \(Bulging\))?( \(Holy\))?( \(Guaranteed Loot\))?( \(HARDCODED\))?( \(2H PVP Weapon Budget\))?( \(5\))?( \(Player\))?( \(Purple\))?( \(DND\))?( \(Lunar\))?( \(Solar\))?( \(Passive\))?) (\(desc=(?<desc>[a-zA-Z 0-9,]*)\) )?(\(id=(?<spellId>[0-9]*)\))? (?<tags>\[.*\])?/);
    const res = findName.exec(line);
    const spellInfo = res?.groups;

    if (!spellInfo || !spellInfo.spellId) {
        console.log(res?.groups);
        console.log(line);
        throw new Error("Could not parse Name line!");
    }
    spellInfo.spellId = parseInt(spellInfo.spellId);
    return spellInfo;
}

let curSpell = '';

for(let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.search('Name') > -1) {
        let spellInfo = parseNameLine(line);
        curSpell = spellInfo.spellId;
        spellObjects[curSpell] = {
            info: spellInfo,
            affectingSpellIds: [],
            pvpCoeffs: [],
            triggerSpellIds: [],
        }
    }
    if (line.search('^GCD  ') > -1) {
        spellObjects[curSpell].gcd = /\s*GCD\s*: (.*) seconds/.exec(line)[1];
    }
    if (line.search('^Class  ') > -1) {
        spellObjects[curSpell].class = /\s*Class\s*: (.*)/.exec(line)[1];
    }
    if (line.search('^Duration  ') > -1) {
        spellObjects[curSpell].duration = /\s*Duration\s*: (.*)/.exec(line)[1];
    }
    if (line.search('^Cooldown   ') > -1) {
        spellObjects[curSpell].cooldown = /\s*Cooldown\s*: (.*)/.exec(line)[1];
    }
    if (line.search('^Charges') > -1) {
        spellObjects[curSpell].charges = /\s*Charges\s*: (.*)/.exec(line)[1];
    }
    if (line.search('^Azerite Power Id') > -1) {
        spellObjects[curSpell].azeritePowerId = /\s*Azerite Power Id\s*: (.*)/.exec(line)[1];
    }
    if (line.search('^Affecting spells') > -1) {
        let affs = [];
        const rx = /(\((?<spellId>[0-9]*) )/g;
        while( (match = rx.exec( line )) != null ) {
            if (isNaN(parseInt(match.groups.spellId))) {
                console.log(line);
                throw new Error("Failed parse");
            }
            affs.push(parseInt(match.groups.spellId));
        }
        spellObjects[curSpell].affectingSpellIds = affs;
    }
    if (line.search('PvP Coefficient') > -1) {
        //                    Base Value: 5000 | Scaled Value: 5000 | PvP Coefficient: 0.50000 | Target: Self (1)
        const pvpCoeff = parseFloat(/.*PvP Coefficient: ([0-9\.]*) |/.exec(line)[1]);
        const prev = lines[i - 1];
        const effects = prev.slice(19).split('|');
        const simpleName = effects[effects.length - 1].trim().split('(')[0].trim();
        spellObjects[curSpell].pvpCoeffs.push([pvpCoeff, simpleName]);   
    }
    // Triggered by     : Soul Fragment (203795), Soul Fragment (204255)
    if (line.search('^Triggered by') > -1) {
        let trigs = [];
        const rx = /(\((?<spellId>[0-9]{3,}))/g;
        while( (match = rx.exec( line )) != null ) {
            if (isNaN(parseInt(match.groups.spellId))) {
                console.log(line);
                throw new Error("Failed parse");
            }
            trigs.push(parseInt(match.groups.spellId));
        }
        spellObjects[curSpell].triggerSpellIds = trigs;
    }
}

// 1st Pass - Calculate Worst PvP Coefficients found on FX
Object.values(spellObjects).forEach(o => {
    const min = Math.min(...o.pvpCoeffs.map(p => p[0]));
    o.worstPvPCoefficient = o.pvpCoeffs.find(m => m[0] == min);
});

// 2nd Pass - Determine Inherited Nerfs
Object.values(spellObjects).forEach(o => {
    const affCoeffs = o.affectingSpellIds
        .filter(sid => !spellObjects[sid].azeritePowerId)
        .map(sid =>  [sid, spellObjects[sid].worstPvPCoefficient])
        .filter(af => af[1] && af[1][0] < 1);
    o.inheritedPvpNerfs = affCoeffs;
});

// 3rd Pass - Inherit A-triggers-B nerfs
Object.values(spellObjects).forEach(o => {
    if (o.triggerSpellIds.length > 0) {
        o.remap = o.triggerSpellIds.map(tId => spellObjects[tId].inheritedPvpNerfs);
        o.triggerSpellIds.forEach(tId => {
            if (o.worstPvPCoefficient) {
                spellObjects[tId].inheritedPvpNerfs = spellObjects[tId].inheritedPvpNerfs.concat([[o.info.spellId, o.worstPvPCoefficient]]);
            }
            spellObjects[tId].inheritedPvpNerfs = spellObjects[tId].inheritedPvpNerfs.concat(o.inheritedPvpNerfs);
        })
    }
});

// Dump our data
fs.writeFileSync('spells.json', JSON.stringify(spellObjects, null, ' '));
console.log("spells.json written");

// Write the tooltip data file
function nerfCoeffToString(n) {
    return (100.0*(1 - n)).toFixed(1) + '%'
}

function makeRed(s) {
    return `|cFFFF0000${s}|r`;
}

let lualines = "";
const commonSpellObjects = commonPvpSpells
    .map(id => spellObjects[id])
    .filter(o => Boolean(o));
commonSpellObjects.forEach(o => {
    
    let nerfEffects = o.inheritedPvpNerfs
        .map(n => `Affected by ${makeRed(nerfCoeffToString(n[1][0]))} nerf to ${spellObjects[n[0]].info.spellName}'s ${n[1][1]} effect\n`);
    let nerfStrings = [...new Set(nerfEffects)].join('');
    if (o.worstPvPCoefficient && o.worstPvPCoefficient[0] < 1) {
        nerfStrings = `A ${makeRed(nerfCoeffToString(o.worstPvPCoefficient[0]))} nerf to ${o.worstPvPCoefficient[1]} effect\n` + nerfStrings;
    }
    if (nerfStrings) {
        lualines = lualines + `[${o.info.spellId}] = {["edits"] = {}, ["text"] = "${nerfStrings.replace(/\n/g,'\\n')}"},\n`;
    }
});

fs.writeFileSync('luaChanges.lua', lualines);
console.log("luaChanges.lua written");
