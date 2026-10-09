import { registerCommand } from "@vendetta/commands";
import { storage } from "@vendetta/plugin";
import { openSearch } from "./actionSheet";

const STRING = 3;

export default function loadCommands(): (() => void)[] {
    const unregister = registerCommand({
        name: "reverse-image-search",
        description: "Open an image URL in a reverse image search engine",
        options: [
            { name: "image-url", description: "Direct link to the image", type: STRING, required: true },
            { name: "engine", description: "google, yandex, tineye or bing (default: your setting)", type: STRING, required: false },
        ],
        execute: (args) => {
            const imageUrl = args.find((a: any) => a.name === "image-url")?.value;
            if (!imageUrl) return;

            const engine = args.find((a: any) => a.name === "engine")?.value || storage.engine;
            openSearch(engine, imageUrl);
        },
    } as any);

    return [unregister];
}
