import { Color } from 'deck.gl';

const toColor = (c: number): Color => [(c >> 16) & 0xff, (c >> 8) & 0xff, c & 0xff, 128];

export const palletChoice3 = [
    0x2563eb,
    0xdc2626,
    0xd1d5db,
].map(toColor);

export const palletChoice4 = [
    0x2563eb,
    0xf9fafb,
    0xdc2626,
    0xd1d5db,
].map(toColor);

export const palletChoice5 = [
    0x2563eb,
    0x93c5fd,
    0xfca5a5,
    0xdc2626,
    0xd1d5db,
].map(toColor);

export const palletChoice6 = [
    0x6929c4,
    0x1192e8,
    0x005d5d,
    0x9f1853,
    0xfa4d56,
    0xd1d5db,
].map(toColor);

export const colorPalette = [
    0x6929c4,
    0x1192e8,
    0x005d5d,
    0x9f1853,
    0xfa4d56,
    0x570408,
    0x198038,
    0x002d9c,
    0xee538b,
    0xb28600,
    0x009d9a,
    0x012749,
    0x8a3800,
    0xa56eff,
].map(toColor);

const createBlockColors = (colors: [string, number, number, number][]): Record<string, { fillColor: Color, borderColor: Color, backgroundColor: Color, fontColor: Color }> => colors.reduce((acc, [key, r, g, b]) => {
    acc[key] = {
        fillColor: [r, g, b, 0x1f],
        borderColor: [r, g, b, 0xff],
        backgroundColor: [Math.min(255, 128 + r), Math.min(255, 128 + g), Math.min(255, 128 + b), 0x7f],
        fontColor: [r / 1.7 | 0, g / 1.7 | 0, b / 1.7 | 0, 0xff]
    };
    return acc;
}, {} as Record<string, { fillColor: Color, borderColor: Color, backgroundColor: Color, fontColor: Color }>);

export const blockColors = createBlockColors([
    ["01", 0x00, 0xd7, 0xd2],
    ["02", 0x6a, 0xcf, 0x80],
    ["03", 0xf9, 0xa4, 0x5c],
    ["04", 0xf0, 0xac, 0xb7],
    ["05", 0xef, 0x62, 0x72],
    ["06", 0xf1, 0xcc, 0x71],
    ["07", 0xb7, 0xa4, 0xe1],
    ["08", 0x8a, 0x9f, 0xed],
    ["09", 0x7b, 0xc8, 0xfd],
    ["10", 0xae, 0xd9, 0x3a],
    ["11", 0x3c, 0xc1, 0x6d],
]);