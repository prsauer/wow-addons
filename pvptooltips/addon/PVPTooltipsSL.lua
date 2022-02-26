print("PvP tooltips brought to you by wowarenalogs.com!")

local function UpdateTooltip(id)
	-- If spellId was not passed, search for it
	if not id then
		local _, spellId = GameTooltip:GetSpell();
		id = spellId;
	end

    if pvpdiff[id] then
        GameTooltip:AddLine("\r\nIn PvP: ", 1, 0.3, 0.3);
        GameTooltip:AddLine("SpellId: " .. id, 0.62, 0.62, 0.62);
        GameTooltip:AddLine(pvpdiff[id]["text"], 0.90, 0.80, 0.50,  0)
    else 
        if id then
            GameTooltip:AddLine("SpellId: " .. id, 0.62, 0.62, 0.62);
        end
    end
	GameTooltip:Show();
end

do
	hooksecurefunc(GameTooltip, "SetAction", function() UpdateTooltip(); end);
	hooksecurefunc(GameTooltip, "SetSpellBookItem", function() UpdateTooltip(); end);
	hooksecurefunc(GameTooltip, "SetSpellByID", function() UpdateTooltip(); end);
	hooksecurefunc(GameTooltip, "SetTalent", function() UpdateTooltip(); end);
	hooksecurefunc(GameTooltip, "SetShapeshift", function() UpdateTooltip(); end);
end
