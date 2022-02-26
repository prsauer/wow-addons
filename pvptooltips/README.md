# PvP Tooltips

## Generated Files

- spells.json
- luaChanges.lua

## Use

`./build.sh`
This command will build the new addon in the /build folder

Requires the simc repo to be in a folder adjacent to this repo!

This generates:
spellDataParsed.json - a raw dump of the data parsed, used for debugging or curiosity
luaChanges.lua - a block of changes to be imported into the PVPTooltipsSL.lua code

This script works by loading the simc spells database and parsing through all non-1.0 PvPcoefficients. A best effort is made to attempt to trace these coefficients along the spell-effects graph to attach the nerfs to all affected spells.

Example:

Spell A
PvPCoefficient: 1.0
triggers: [Spell B, ]

Spell B
PvPCoefficient: 0.5
triggers: []

In this scenario spell A triggers spell B; if we just did a simple analysis of Coefficients the nerf to the overall effect would be lost. The script parses these triggers and attaches the nerfs to both:

{
spellA: {
pvpCoeff: 1,
inheritedPvpNerfs: [ [spellB, 50%], ]
},
spellB: {
pvpCoeff: 0.5,
inheritedPvpNerfs: []
}
}

The output then loops through these and generates strings for the addon.
