import { before, after } from "@vendetta/patcher";
import { findByProps } from "@vendetta/metro";
import { React, ReactNative } from "@vendetta/metro/common";
import { getAssetIDByName } from "@vendetta/ui/assets";

const LazyActionSheet = findByProps("openLazy", "hideActionSheet");
const ActionSheetRow = findByProps("ActionSheetRow")?.ActionSheetRow;

const lens = (url: string) => `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(url)}`;
const isRow = (el: any) => typeof el?.props?.label === "string" && typeof el?.props?.onPress === "function";
const label = (el: any) => (isRow(el) ? el.props.label.toLowerCase() : "");

// Attachments + image embeds on a message, de-duplicated (max 4).
function getImages(message: any): string[] {
    const urls = new Set<string>();
    const add = (u: any) => typeof u === "string" && /^https?:\/\//i.test(u) && urls.add(u);

    for (const a of message?.attachments ?? []) {
        const type: string | undefined = a?.content_type ?? a?.contentType;
        if (type ? type.startsWith("image/") : /\.(png|jpe?g|webp|gif|bmp|avif|heic)(\?|#|$)/i.test(a?.filename ?? a?.url ?? "")) {
            add(a?.url ?? a?.proxy_url);
        }
    }
    for (const e of message?.embeds ?? []) {
        const pic = e?.type === "image" || e?.type === "gifv" ? (e.image ?? e.thumbnail) : e?.image;
        add(pic?.url ?? pic?.proxyURL ?? pic?.proxy_url);
    }
    return [...urls].slice(0, 4);
}

// First array of rows in the sheet tree matching `test`.
function findRows(node: any, test: (rows: any[]) => boolean, seen = new WeakSet()): any[] | null {
    if (!node || typeof node !== "object" || seen.has(node)) return null;
    seen.add(node);
    if (Array.isArray(node)) {
        if (test(node)) return node;
        for (const child of node) {
            const hit = findRows(child, test, seen);
            if (hit) return hit;
        }
        return null;
    }
    return findRows(node.props?.children, test, seen);
}

// Puts the rows right below "Save Image" (falls back to the top of any row list).
function insert(tree: any, rows: any[]) {
    if (!rows.length) return;
    const isSave = (el: any) => /save.*(image|media)/.test(label(el));
    const list = findRows(tree, (r) => r.some(isSave));
    if (list) return list.splice(list.findIndex(isSave) + 1, 0, ...rows);
    findRows(tree, (r) => r.length > 0 && r.every(isRow))?.unshift(...rows);
}

let unpatches: (() => void)[] = [];

export default {
    onLoad: () => {
        if (!LazyActionSheet || !ActionSheetRow) return;

        const icon = ["MagnifyingGlassIcon", "SearchIcon", "ic_search", "ic_search_24px"].map((n) => getAssetIDByName(n)).find(Boolean);
        const patched = new WeakSet<object>();
        let active: any = null;

        unpatches.push(
            before("openLazy", LazyActionSheet, ([component, key, msg]: any[]) => {
                if (key !== "MessageLongPressActionSheet" || !msg?.message) return;
                active = msg.message;

                component.then((instance: any) => {
                    if (!instance || patched.has(instance)) return;
                    patched.add(instance);

                    unpatches.push(
                        after("default", instance, (_: any, tree: any) => {
                            try {
                                const images = getImages(active);
                                insert(
                                    tree,
                                    images.map((url, i) =>
                                        React.createElement(ActionSheetRow, {
                                            key: `reverse-image-search-${i}`,
                                            label: images.length > 1 ? `Reverse Image Search (${i + 1}/${images.length})` : "Reverse Image Search",
                                            icon: icon ? React.createElement(ActionSheetRow.Icon, { source: icon }) : undefined,
                                            onPress: () => {
                                                LazyActionSheet.hideActionSheet();
                                                ReactNative.Linking.openURL(lens(url));
                                            },
                                        }),
                                    ),
                                );
                            } catch (e) {
                                console.error("[ReverseImageSearchPlus]", e);
                            }
                        }),
                    );
                });
            }),
        );
    },
    onUnload: () => {
        unpatches.forEach((u) => u());
        unpatches = [];
    },
};
