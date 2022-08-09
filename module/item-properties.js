
const durationUnits = ["day", "hour", "minute", "month", "round", "turn", "year"];
const attackTypes = ["msak", "mwak", "rsak", "rwak"];
const tokenTargetables = ["ally", "creature", "enemy", ""];

export function hasConcentration(item) {
    return item.data.data.components.concentration;
}

export function hasDuration(item) {
    return durationUnits.includes(item.data.data.duration.units);
}

export function isInstantaneous(item) {
    const units = item.data.data.duration.units;
    return !units || units === "inst";
}

export function isAttack(item) {
    return item.hasAttack;
}

export function isTokenTargetable(item) {
    return tokenTargetables.includes(item.data.data.target.type);
}

export function targetsSingleToken(item) {
    return (!item.data.data.target.value || item.data.data.target.value === 1) && isTokenTargetable(item);
}

export function isSelfTarget(item) {
    return item.data.data.target.type === "self";
}

export function hasDamageOfType(item, applicationType) {
    return item.data.data.damage.parts.some(part => part[3] === applicationType);
}

export function hasEffectsOfType(item, applicationType) {
    return item.effects.some(e => !e.isSuppressed && !e.isTemporary && !e.data.transfer && 
        (e.getFlag("wire", "applicationType") || "immediate") === applicationType);
}

export function hasApplicationsOfType(item, applicationType) {
    return hasDamageOfType(item, applicationType) || hasEffectsOfType(item, applicationType);
}

export function hasUnavoidableDamageOfType(item, applicationType) {
    return item.data.data.damage.parts.some(part => part[3] === applicationType && ["full", "half"].includes(part[2]));
}

export function hasUnavoidableEffectsOfType(item, applicationType) {
    return item.effects.some(e => !e.isSuppressed && !e.isTemporary && !e.data.transfer && 
        (e.getFlag("wire", "applicationType") || "immediate") === applicationType && 
        e.getFlag("wire", "applyOnSaveOrMiss"));
}

export function getUnavoidableApplicationsOfType(item, applicationType) {
    let result = [];
    if (hasUnavoidableEffectsOfType(item, applicationType)) result.push("effects");
    if (hasUnavoidableDamageOfType(item, applicationType)) result.push("damage");
    return result;
}
