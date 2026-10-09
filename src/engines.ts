export interface Engine {
    id: string;
    name: string;
    url: (imageUrl: string) => string;
}

export const ENGINES: Engine[] = [
    { id: "google", name: "Google Lens", url: (u) => `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(u)}` },
    { id: "yandex", name: "Yandex", url: (u) => `https://yandex.com/images/search?rpt=imageview&url=${encodeURIComponent(u)}` },
    { id: "tineye", name: "TinEye", url: (u) => `https://tineye.com/search?url=${encodeURIComponent(u)}` },
    { id: "bing", name: "Bing", url: (u) => `https://www.bing.com/images/search?view=detailv2&iss=sbi&q=imgurl:${encodeURIComponent(u)}` },
];

export const getEngine = (id?: string): Engine => ENGINES.find((e) => e.id === (id ?? "").toLowerCase()) ?? ENGINES[0];
