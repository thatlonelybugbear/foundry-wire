import { i18n } from "../utils.js";
import { injectConditionList } from "./condition-list.js";

export function initActiveEffectSheetHooks() {
    Hooks.on("renderActiveEffectConfig", async (app, html, data) => {
        const effect = app.object;
        const applyOnSaveOrMiss = effect.getFlag("wire", "applyOnSaveOrMiss");
        const blocksAreaConditions = effect.getFlag("wire", "blocksAreaConditions");
        const applicationType = effect.getFlag("wire", "applicationType");
        const auraTargets = effect.getFlag("wire", "auraTargets");
        const checked = (value) => { return value ? "checked" : "" };
        const selected = (value, fieldValue) => { return value === fieldValue ? "selected" : "" };
        const detailsFields = `
            <div class="form-group">
                <label>${i18n("wire.active-effect.apply-on-save-or-miss")}</label>
                <input type="checkbox" name="flags.wire.applyOnSaveOrMiss" ${checked(applyOnSaveOrMiss)}>
            </div>
            <div class="form-group">
                <label>${i18n("wire.active-effect.blocks-area-conditions")}</label>
                <input type="checkbox" name="flags.wire.blocksAreaConditions" ${checked(blocksAreaConditions)}>
                <div class="hint">${i18n("wire.active-effect.blocks-area-conditions-hint")}</div>
            </div>
            <div class="form-group">
                <label>${i18n("wire.active-effect.aura-targets")}</label>
                <select name="flags.wire.auraTargets">
                    <option value="">${i18n("wire.active-effect.aura-target-none")}</option>
                    <option value="creature" ${selected(auraTargets, "creature")}>${i18n("wire.active-effect.aura-target-creature")}</option>
                    <option value="ally" ${selected(auraTargets, "ally")}>${i18n("wire.active-effect.aura-target-ally")}</option>
                    <option value="enemy" ${selected(auraTargets, "enemy")}>${i18n("wire.active-effect.aura-target-enemy")}</option>
                </select>
                <div class="hint">${i18n("wire.active-effect.aura-targets-hint")}</div>
            </div>
            <div class="form-group">
                <label>${i18n("wire.active-effect.application-phase")}</label>
                <select name="flags.wire.applicationType">
                    <option value="immediate">${i18n("wire.item.application-immediate")}</option>
                    <option value="delayed" ${selected(applicationType, "delayed")}>${i18n("wire.item.application-delayed")}</option>
                    <option value="overtime" ${selected(applicationType, "overtime")}>${i18n("wire.item.application-overtime")}</option>
                </select>
                <div class="hint">${i18n("wire.active-effect.application-phase-hint")}</div>
            </div>
        `;
        html.find('section[data-tab="details"] .form-group').last().after(detailsFields);

        await injectConditionList(app.object, html, 'section[data-tab="details"]', "effect");

        const independentDuration = effect.getFlag("wire", "independentDuration");
        const durationFields = `
            <div class="form-group">
                <label>${i18n("wire.active-effect.track-independent-duration")}</label>
                <input type="checkbox" name="flags.wire.independentDuration" ${checked(independentDuration)}>
                <div class="hint">${i18n("wire.active-effect.track-independent-duration-hint")}</div>
            </div>
        `;
        html.find('section[data-tab="duration"] .form-group').last().after(durationFields);
    });
}

export function setupActiveEffectSheetWrappers() {
    if (typeof DAE !== "undefined") {
        libWrapper.register("wire", "DAE.DAEActiveEffectConfig.prototype._getSubmitData", onItemSubmit, "MIXED");
    } else {
        libWrapper.register("wire", "ActiveEffectConfig.prototype._getSubmitData", onItemSubmit, "MIXED");
    }
}

function onItemSubmit(wrapped, updateData) {
    const submitData = wrapped(updateData);

    // Create the expanded update data object
    const fd = new FormDataExtended(this.form, {editors: this.editors});
    let data = fd.object;
    if ( updateData ) data = mergeObject(data, updateData);
    else data = expandObject(data);

    const conditions = data.flags?.wire?.conditions;
    if (conditions) submitData['flags.wire.conditions'] = Object.values(conditions);

    return submitData;
}

