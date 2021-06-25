var fs = require("fs");
/*
This file is a helper for wowarenalogs.com, used to generate
spell data the replay tool can ingest more easily
*/
const sdata = fs.readFileSync("spells.json", "utf8");
const spellObjects = JSON.parse(sdata);

const awcSpells = {
  //   DeathKnight_Blood = "250",
  250: ["48707", "47528", "49039", "48792", "51052"],

  //   DeathKnight_Frost = "251",
  251: [
    "47568",
    "212552",
    "51271",
    "48792",
    "145629",
    "48707",
    "47528",
    "49039",
    "51052",
    "279302",
    "152279",
    "207167",
    "48743",
  ],

  //   DeathKnight_Unholy = "252",
  252: [
    "48707",
    "47528",
    "49039",
    "48792",
    "51052",
    "275699",
    "63560",
    "42650",
    "48743",
    "49206",
  ],

  //   DemonHunter_Havoc = "577",
  577: ["198589", "191427", "196718", "196555", "205604", "206803"],

  //   DemonHunter_Vengeance = "581",
  581: ["198589", "191427"],

  //   Druid_Balance = "102",
  102: [
    "5211",
    "22842",
    "323764",
    "202770",
    "22812",
    "305497",
    "78675",
    "194223",
    "29166",
    "102560",
  ],

  //   Druid_Feral = "103",
  103: [
    "5211",
    "22842",
    "22812",
    "61336",
    "106951",
    "102793",
    "102543",
    "108238",
    "305497",
  ],

  //   Druid_Guardian = "104",
  104: ["5211", "22842", "22812", "305497"],

  //   Druid_Restoration = "105",
  105: [
    "5211",
    "22842",
    "22812",
    "305497",
    "102342",
    "102793",
    "29166",
    "132158",
    "33891",
    "197721",
    "203651",
  ],

  //   Hunter_BeastMastery = "253",
  253: [
    "187650",
    "186265",
    "109304",
    "272682",
    "19577",
    "19574",
    "193530",
    "147362",
    "131894",
    "201430",
    "205691",
    "53480",
  ],

  //   Hunter_Marksmanship = "254",
  254: [
    "187650",
    "186265",
    "109304",
    "272682",
    "109248",
    "147362",
    "288613",
    "260402",
    "53480",
  ],

  //   Hunter_Survival = "255",
  255: ["187650", "186265", "109304", "272682", "53480", "266779", "19577"],

  //   Mage_Arcane = "62",
  //      inv   icb     cs     images    rune      evc      arcpow
  62: ["66", "45438", "2139", "55342", "116011", "12051", "12042"],

  //   Mage_Fire = "63",
  // '116011', rune
  // '153561', meteor
  //      inv   icb       caut     cs     images  combust
  63: ["66", "45438", "86949", "2139", "55342", "190319"],

  //   Mage_Frost = "64",
  //      inv   icb     cs     images    rune      csnap      veins
  64: ["66", "45438", "2139", "55342", "116011", "235219", "12472"],

  //   Monk_BrewMaster = "268",
  268: ["119381", "115078", "243435"],

  //   Monk_Windwalker = "269",
  269: [
    "122470",
    "137639",
    "119381",
    "122783",
    "116841",
    "115078",
    "116705",
    "123904",
    "243435",
  ],

  //   Monk_Mistweaver = "270",
  270: ["119381", "115078", "243435", "116849", "115310", "322118"],

  //   Paladin_Holy = "65",
  65: ["498", "642", "1022", "199448", "853", "31884", "31821"],

  //   Paladin_Protection = "66",
  66: ["642", "31884", "853", "1022", "199448"],

  //   Paladin_Retribution = "70",
  70: ["642", "31884", "853", "96231", "1022", "199448", "343721"],

  //   Priest_Discipline = "256",
  256: [
    "19236",
    "8122",
    "10060",
    "73325",
    "34433",
    "33206",
    "109964",
    "197871",
  ],

  //   Priest_Holy = "257",
  257: ["19236", "8122", "10060", "73325", "47788", "64843", "64901", "109964"],

  //   Priest_Shadow = "258",
  258: ["10060", "73325", "47585", "15487", "15290", "64044", "213602", "8122"],

  //   Rogue_Assassination = "259",
  259: [
    "31224",
    "5277",
    "1966",
    "1856",
    "11327",
    "212182",
    "2094",
    "1766",
    "79140",
    "207736",
  ],

  //   Rogue_Outlaw = "260",
  260: [
    "31224",
    "5277",
    "1966",
    "1856",
    "11327",
    "212182",
    "2094",
    "1766",
    "13750",
    "207736",
  ],

  //   Rogue_Subtlety = "261",
  261: [
    "31224",
    "5277",
    "1966",
    "1856",
    "11327",
    "212182",
    "2094",
    "1766",
    "121471",
    "207736",
  ],

  //   Shaman_Elemental = "262",
  262: ["108271", "198103", "5394", "198067", "79206", "191634", "114051"],

  //   Shaman_Enhancement = "263",
  263: [
    "108271",
    "198103",
    "5394",
    "51533",
    "58875",
    "114051",
    "204331",
    "204330",
  ],

  //   Shaman_Restoration = "264",
  264: [
    "108271",
    "198103",
    "5394",
    "8143",
    "16191",
    "98008",
    "79206",
    "108280",
    "114052",
    "198838",
  ], // TODO: SHAMAN RESTO!

  //   Warlock_Affliction = "265",
  265: [
    "113860",
    "205180",
    "104773",
    "212295",
    "48020",
    "30282",
    "119910",
    "132409",
  ],

  //   Warlock_Demonology = "266",
  266: [
    "113860",
    "205180",
    "104773",
    "212295",
    "48020",
    "30282",
    "119910",
    "132409",
    "265187",
    "111898",
  ],

  //   Warlock_Destruction = "267",
  267: [
    "113860",
    "205180",
    "104773",
    "212295",
    "48020",
    "30282",
    "119910",
    "132409",
    "1122",
    "113858",
  ],

  //   Warrior_Arms = "71",
  71: ["97463", "118038", "5246", "107574", "198817", "6552", "262161"],

  //   Warrior_Fury = "72",
  72: ["97463", "118038", "5246", "107574", "198817", "6552", "262161"],

  //   Warrior_Protection = "73"
  73: ["97463", "118038", "5246", "107574", "198817", "6552", "262161"],
};

const specIds = Object.keys(awcSpells);
const trackerObjects = {};

function parseSeconds(cd) {
  if (!cd) return undefined;
  if (cd.search("seconds") > -1) {
    const n = cd.split(" ")[0];
    return parseInt(n);
  }
  return undefined;
}

// "charges": "1 (300 seconds cooldown)",
function parseCharegs(charges) {
  if (!charges) {
    return { charges: undefined, chargeCooldownSeconds: undefined };
  }
  const pieces = charges.split(" ");
  return {
    charges: parseInt(pieces[0]),
    chargeCooldownSeconds: parseInt(pieces[1].replace("(", "")),
  };
}

for (let sid of specIds) {
  awcSpells[sid].forEach((s) => {
    console.log(s, spellObjects[s] ? spellObjects[s].cooldown : "undef");
    trackerObjects[s] = {
      spellId: s,
      name: spellObjects[s]?.info.spellName,
      cooldownSeconds: parseSeconds(spellObjects[s]?.cooldown),
      charges: parseCharegs(spellObjects[s]?.charges),
      durationSeconds: parseSeconds(spellObjects[s]?.duration),
    };
  });
}

fs.writeFileSync("trackers.json", JSON.stringify(trackerObjects, null, " "));
