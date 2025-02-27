import { Activation } from "../activation.js";
import { ConfigureCheck } from "../apps/configure-check.js";
import { ConfigureSave } from "../apps/configure-save.js";
import { fromUuid, fudgeToActor, getActorToken } from "../utils.js";

export class ItemCard {
    static templateName = "modules/wire/templates/item-card.hbs";

    static async renderHtml(item, activation = null, { isPlayerView = false, isSecondary = false } = {}) {
        if (item) {
            const actor = item.actor;
            const token = getActorToken(actor);
            const activationData = await activation?._getChatTemplateData();
    
            const templateData = {
                isGM: isPlayerView ? false : game.user.isGM,
                isPlayerView,
                isGMActorPlayerView: isPlayerView && !actor.hasPlayerOwner && !activation.isPublic,
                hasPlayerOwner: item.hasPlayerOwner,
                actor: actor,
                tokenId: token?.uuid || null,
                item: item,
                data: await item.getChatData(),
                isVersatile: item.isVersatile,
                isSpell: item.type === "spell",
                activation: activationData,
                abilityNames: CONFIG.DND5E.abilities,
                isSecondary
            };
            return await renderTemplate(this.templateName, templateData);
        }
    }

    constructor(message, activation) {
        this.message = message;
        this.activation = activation;
    }

    async updateContent(options) {
        const activation = this.activation ?? new Activation(this.message);
        const html = await ItemCard.renderHtml(activation.item, activation, options);
        await this.message.update({ content: html });

        ui.chat.scrollBottom();
    }

    static activateListeners(html) {
        html.off("click", ".wire-item-card .card-buttons button");

        html.on("click", ".wire-item-card .card-buttons button", this._onChatCardAction.bind(this));
        html.on("click", ".wire-item-card .card-phases a", this._onChatCardAction.bind(this));

        html.on("click", ".wire-item-card .card-phases .dice-total", function(event) {
            const tip = event.target.closest('.roll-container').querySelector('.dice-tooltip');
            if ( !tip.classList.contains("expanded") ) $(tip).slideDown(200);
            else $(tip).slideUp(200);
            tip.classList.toggle("expanded");
        });

        html.on("click", ".wire-item-card .save-popup-toggle", function(event) {
            event.target.closest('.phase-saving-throws').classList.toggle('popup');
        });
    }

    static async _onChatCardAction(event) {
        event.preventDefault();

        // Extract card data
        const button = event.currentTarget;
        button.disabled = true;
        const card = button.closest(".chat-card");
        const messageId = card.closest(".message").dataset.messageId;
        const message = game.messages.get(messageId);
        const activation = new Activation(message);
        const action = button.dataset.action;

        switch (action) {
            case "removeTemplate":
                const template = await activation.template;
                template.delete();
                break;
            case "confirm-attack-hit":
                activation.applyAttackResult(true);
                break;
            case "confirm-attack-miss":
                activation.applyAttackResult(false);
                break;
            case "wire-damage":
                activation._rollDamage();
                break;
            case "wire-damage-configure":
                const options = {
                    top: event ? event.clientY - 80 : null,
                    left: window.innerWidth - 610
                }
                activation._rollDamage(true, options);
                break;
            case "wire-save":
            case "wire-save-success":
            case "wire-save-failure":
                const actorUuid = event.target.closest('.saving-throw-target').dataset.actorId;
                const actor = fudgeToActor(fromUuid(actorUuid));
                if (actor && (game.user.isGM || actor.isOwner)) {
                    const advantage = !!event.altKey;
                    const disadvantage = !advantage && (!!event.metaKey || !!event.ctrlKey);
                    const success = action === "wire-save-success";
                    const failure = action === "wire-save-failure";
                    activation._rollSave(actor, { advantage, disadvantage, success, failure });
                }
                break;
            case "wire-save-config":
                await (async () => {
                    const dialogOptions = {
                        top: event ? event.clientY - 80 : null,
                        left: window.innerWidth - 610
                    }
                    const actorUuid = event.target.closest('.saving-throw-target').dataset.actorId;
                    const actor = fudgeToActor(fromUuid(actorUuid));
                    const usedSave = activation.item.system.save.ability;
                    const usedCheck = activation.abilityToCheckForSave;
                    const config = activation.config;
                    const app = usedCheck ? new ConfigureCheck(actor, usedCheck, config, dialogOptions) : new ConfigureSave(actor, usedSave, config, dialogOptions);
                    const result = await app.render(true);
        
                    if (result != undefined) {
                        activation._rollSave(actor, result);
                    }
                })();
                break;
            case "roll-all-saves":
            case "roll-npc-saves":
                if (game.user.isGM) {
                    const actors = [...event.target
                        .closest('.phase-saving-throws')
                        .querySelectorAll('.saving-throw-target')
                        .values()]
                        .map(e => e.dataset.actorId)
                        .map(i => fudgeToActor(fromUuid(i)))
                        .filter(a => action === "roll-all-saves" || !a.hasPlayerOwner);

                    for (let actor of actors) {
                        activation._rollSave(actor);
                    }
                }
                break;
            case "confirm-targets":
                activation._confirmTargets();
                break;
            case "activate-action":
                activation._activateAction();
                break;
            }

        button.disabled = false;
    }
}