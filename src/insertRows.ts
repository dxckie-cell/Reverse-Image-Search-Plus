// Finds the row list inside a rendered MessageLongPressActionSheet and splices our rows into it.
// Kept free of Discord imports so it can be tested against a fake element tree.

const isRowLike = (el: any) => typeof el?.props?.label === "string" && typeof el?.props?.onPress === "function";
const labelOf = (el: any): string => (typeof el?.props?.label === "string" ? el.props.label.toLowerCase() : "");

/** Depth-first search over React elements (props.children) for the first array matching `test`. */
function findArray(root: any, test: (arr: any[]) => boolean, maxDepth = 40): any[] | null {
    const seen = new WeakSet<object>();

    const walk = (node: any, depth: number): any[] | null => {
        if (!node || typeof node !== "object" || depth > maxDepth || seen.has(node)) return null;
        seen.add(node);

        if (Array.isArray(node)) {
            if (test(node)) return node;
            for (const child of node) {
                const hit = walk(child, depth + 1);
                if (hit) return hit;
            }
            return null;
        }

        return walk(node.props?.children, depth + 1) ?? walk(node.props?.rows, depth + 1);
    };

    return walk(root, 0);
}

/**
 * Inserts `rows` into the action sheet tree. Prefers the spot right below "Save Image", then next to
 * "Copy Media Link", then above "Reply", then any group of rows. Returns whether anything was inserted.
 */
export function insertRows(tree: any, rows: any[]): boolean {
    if (!rows.length) return false;

    // [find index, offset]: offset 1 inserts right after the match, 0 right before it.
    const strategies: [(arr: any[]) => number, number][] = [
        [(arr) => arr.findIndex((el) => /save.*(image|media)/.test(labelOf(el))), 1],
        [(arr) => arr.findIndex((el) => /copy.*(image|media).*link|image.*link/.test(labelOf(el))), 0],
        [(arr) => arr.findIndex((el) => labelOf(el) === "reply"), 0],
    ];

    for (const [find, offset] of strategies) {
        const list = findArray(tree, (arr) => arr.some(isRowLike) && find(arr) !== -1);
        if (list) {
            list.splice(find(list) + offset, 0, ...rows);
            return true;
        }
    }

    // Last resort: any list made up entirely of rows.
    const generic = findArray(tree, (arr) => arr.length > 0 && arr.every(isRowLike));
    if (generic) {
        generic.unshift(...rows);
        return true;
    }

    return false;
}
