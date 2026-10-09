import { before, after } from "@vendetta/patcher";
import { findByProps } from "@vendetta/metro";
import { React, ReactNative } from "@vendetta/metro/common";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { showToast } from "@vendetta/ui/toasts";
import { storage } from "@vendetta/plugin";
import { ENGINES, getEngine } from "./engines";
import { getMessageImages } from "./images";
import { insertRows } from "./insertRows";

const ICON_NAMES = ["MagnifyingGlassIcon", "SearchIcon", "ic_search", "ic_search_24px", "search", "ic_image", "ImageIcon"];

export function openSearch(engineId: string | undefined, imageUrl: string) {
    ReactNative.Linking.openURL(getEngine(engineId).url(imageUrl)).catch(() => {
        showToast("Couldn't open the browser for this search", undefined);
    });
}

export function patchActionSheet(): () => void {
    const LazyActionSheet = findByProps("openLazy", "hideActionSheet");
    const ActionSheetRow = findByProps("ActionSheetRow")?.ActionSheetRow;
    if (!LazyActionSheet || !ActionSheetRow) {
        console.warn("[ReverseImageSearchPlus] ActionSheet not found - long-press button disabled");
        return () => {};
    }

    const iconId = ICON_NAMES.map((n) => getAssetIDByName(n)).find(Boolean);

    let activeMessage: any = null;
    const patchedInstances = new WeakSet<object>();
    const unpatches: (() => void)[] = [];

    function buildRows(message: any): any[] {
        const images = getMessageImages(message);
        if (!images.length) return [];

        const engines = storage.showAllEngines ? ENGINES : [getEngine(storage.engine)];
        const rows: any[] = [];

        images.forEach((img, i) => {
            for (const engine of engines) {
                const parts = [storage.showAllEngines ? engine.name : null, images.length > 1 ? `${i + 1}/${images.length}` : null].filter(Boolean);
                rows.push(
                    React.createElement(ActionSheetRow, {
                        key: `reverse-image-search-${i}-${engine.id}`,
                        label: parts.length ? `Reverse Image Search (${parts.join(" · ")})` : "Reverse Image Search",
                        subLabel: storage.showAllEngines ? undefined : engine.name,
                        icon: iconId ? React.createElement(ActionSheetRow.Icon, { source: iconId }) : undefined,
                        onPress: () => {
                            LazyActionSheet.hideActionSheet();
                            openSearch(engine.id, img.url);
                        },
                    }),
                );
            }
        });

        return rows;
    }

    unpatches.push(
        before("openLazy", LazyActionSheet, ([component, key, msg]: any[]) => {
            if (key !== "MessageLongPressActionSheet" || !msg?.message) return;
            activeMessage = msg.message;

            component.then((instance: any) => {
                // Discord reuses the lazy module across opens - patch it once, read the live message each render.
                if (!instance || patchedInstances.has(instance)) return;
                patchedInstances.add(instance);

                unpatches.push(
                    after("default", instance, (_: any, tree: any) => {
                        try {
                            insertRows(tree, buildRows(activeMessage));
                        } catch (e) {
                            console.error("[ReverseImageSearchPlus] failed to add button:", e);
                        }
                    }),
                );
            });
        }),
    );

    return () => {
        unpatches.forEach((u) => u());
        unpatches.length = 0;
    };
}
