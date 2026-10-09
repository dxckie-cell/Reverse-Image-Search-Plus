import loadCommands from "./commands";
import { patchActionSheet } from "./actionSheet";
import { storage } from "@vendetta/plugin";
import Settings from "./Settings";

let unpatchFns: (() => void)[] = [];

export default {
    onLoad: () => {
        storage.engine ??= "google";
        storage.showAllEngines ??= false;

        unpatchFns = [patchActionSheet(), ...loadCommands()];
    },
    onUnload: () => {
        unpatchFns.forEach((fn) => fn());
        unpatchFns = [];
    },
    settings: Settings,
};
