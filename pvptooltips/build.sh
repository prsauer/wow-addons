WOW_VERSION="90005"
ADDON_VERSION="2.1.1"

mkdir build
mkdir build/PVP_Tooltips_Shadowlands
cp addon/PVPTooltipsSL.lua build/PVP_Tooltips_Shadowlands/PVPTooltipsSL.lua

echo "## Interface: $WOW_VERSION" > build/PVP_Tooltips_Shadowlands/PVP_Tooltips_Shadowlands.toc
echo "## Title: PVP Tooltips: Shadowlands" >> build/PVP_Tooltips_Shadowlands/PVP_Tooltips_Shadowlands.toc
echo "## Notes: PvP tooltip changes" >> build/PVP_Tooltips_Shadowlands/PVP_Tooltips_Shadowlands.toc
echo "## Author: Armsperson" >> build/PVP_Tooltips_Shadowlands/PVP_Tooltips_Shadowlands.toc
echo "## Version: $ADDON_VERSION" >> build/PVP_Tooltips_Shadowlands/PVP_Tooltips_Shadowlands.toc
echo "" >> build/PVP_Tooltips_Shadowlands/PVP_Tooltips_Shadowlands.toc
echo "PVPTooltipsSL.lua" >> build/PVP_Tooltips_Shadowlands/PVP_Tooltips_Shadowlands.toc

pushd build
zip -r PVP_Tooltips_Shadowlands_$ADDON_VERSION.zip PVP_Tooltips_Shadowlands
popd
