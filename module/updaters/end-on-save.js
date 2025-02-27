import { Updater } from "./base-updater.js";

export class EndOnSaveUpdater extends Updater {
    flow() {
        return this.hasSave(
            this.performSavingThrow(
                this.endEffectOnSave()
            )
        )
    }
}
