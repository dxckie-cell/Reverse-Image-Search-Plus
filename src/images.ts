export interface FoundImage {
    url: string;
    label: string;
}

const IMAGE_EXT = /\.(png|jpe?g|webp|gif|bmp|avif|heic)(?:[?#]|$)/i;
const MAX_IMAGES = 4;

const isHttp = (u: unknown): u is string => typeof u === "string" && /^https?:\/\//i.test(u);

function labelFor(url: string, filename?: string): string {
    if (filename) return filename;
    try {
        const last = decodeURIComponent(new URL(url).pathname.split("/").pop() || "");
        if (last) return last;
        return new URL(url).hostname;
    } catch {
        return "image";
    }
}

// Message objects on mobile mix snake_case (attachments) and camelCase (embeds), so every field is
// read both ways.
function collect(message: any, out: FoundImage[], seen: Set<string>) {
    const add = (url: unknown, filename?: string) => {
        if (!isHttp(url) || seen.has(url)) return;
        seen.add(url);
        out.push({ url, label: labelFor(url, filename) });
    };

    for (const a of message?.attachments ?? []) {
        const url = a?.url ?? a?.proxy_url ?? a?.proxyURL;
        const type: string | undefined = a?.content_type ?? a?.contentType;
        const looksLikeImage = type ? type.startsWith("image/") : IMAGE_EXT.test(a?.filename ?? url ?? "");
        if (looksLikeImage) add(url, a?.filename);
    }

    for (const e of message?.embeds ?? []) {
        // Image / GIF embeds carry their picture in `thumbnail`; rich embeds use `image`.
        const pic = e?.type === "image" || e?.type === "gifv" ? (e?.image ?? e?.thumbnail) : e?.image;
        if (pic) add(pic.url ?? pic.proxyURL ?? pic.proxy_url);
    }
}

/** Every image on a message (attachments + image embeds, including forwarded copies), de-duplicated. */
export function getMessageImages(message: any): FoundImage[] {
    const out: FoundImage[] = [];
    const seen = new Set<string>();

    collect(message, out, seen);
    for (const snap of message?.messageSnapshots ?? message?.message_snapshots ?? []) {
        collect(snap?.message ?? snap, out, seen);
    }

    return out.slice(0, MAX_IMAGES);
}
