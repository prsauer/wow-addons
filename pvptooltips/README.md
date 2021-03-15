# PvP Tooltips

This addon attempts to add pvp tooltips to all abilities that change when in combat with players.

# Generation

This addon isn't entirely built by hand. There exist a set of tools to generate the data that should be shown -- this is based on dumping the raw spell data from WoW and examining abilities that have non-1.0 PvP coefficients.

- Ingest SpellDump data from simc repo
- Filter for spellIds which have non-1.0 PvP coefficients
- Generate string data for the client


