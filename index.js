
const base = 5;
const log = Math.log(base);
const w = 500;
const h = 500;
const minDurationSeconds = 10;

const pos = (i, len) => {
    const rank = Math.ceil(Math.log(i + 1) / log);
    const spaceEnd = Math.pow(base, rank);
    const spaceStart = Math.pow(base, rank - 1);
    const space = spaceEnd - spaceStart;
    const offset = (i - spaceEnd + 1) / space
    const xMult = Math.cos(2 * Math.PI * offset);
    const yMult = Math.sin(2 * Math.PI * offset);
    const rings = Math.ceil(Math.log(len) / log) + 1;
    const rankStrength = (Math.min(w, h) / 2) / rings;

    const x = w / 2 + xMult * rank * rankStrength;
    const y = h / 2 + yMult * rank * rankStrength;

    return [x, y];
};

const now = () => {
    if (typeof process !== undefined && process.hrtime) {
        const hrTime = process.hrtime();
        return hrTime[0] * 1000 + hrTime[1] / 1000000;
    } else if (typeof window !== undefined && window.performance && window.performance.now) {
        return window.performance.now();
    } else {
        return Date.now();
    }
};


const flatten = arrays => [].concat.apply([], arrays);

// hitviz factory
module.exports = () => {
    const state = {
        hits: {}
    };

    const getItems = () => flatten(Object.keys(state.hits)
        .map(key => state.hits[key].items));

    const getStart = () => Math.min(...getItems().map(x => x.t));
    const getEnd = () => Math.max(...getItems().map(x => x.t));


    const svg = () => {
        const start = getStart();
        const end = getEnd();
        const span = end - start;

        const animationTime = (span) / Math.min(1000 / minDurationSeconds, span) * minDurationSeconds;

        const contents = [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<!DOCTYPE svg>',
            `<svg version="1.1" baseProfile="full" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">`,
            `<defs>`,
            `<radialGradient id="gradient1" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">`,
            `<stop offset="0%" style="stop-color:#FF00FF;" />`,
            `<stop offset="100%" style="stop-color:#FFBD2E00;" />`,
            `</radialGradient>`,
            `</defs>`,
            `<g>`,
            `<text x="20" y="35">Hit Visualizer (author: Sem Postma, esstudio.site)</text>`,
            `<animate id="start" begin="2s;final.end" dur="${animationTime}s" attributeName="visibility" from="hidden" to="hidden"/>`,
            `</g>`,
            `<g>`,
            `<text x="20" y="35">Simulating...</text>`,
            `<animate begin="0" dur="2s" attributeName="visibility" from="hidden" to="hidden"/>`,
            `<animate id="final" begin="start.end" dur="2s" attributeName="visibility" from="hidden" to="hidden"/>`,
            `</g>`,
            `<g>`,
            ...flatten(new Array(Math.floor(animationTime * 60)).fill(0).map((x, i, arr) => {
                const stamp = i / 60;
                const label = stamp.toFixed(2);
                const msTime = 1000 / 60

                const timestamp = ((stamp / animationTime) * span);

                return [
                    `<g visibility="hidden">`,
                    `<text x="20" y="55">${label}s (real time) / ${timestamp.toFixed(10)}ms (execution time)</text>`,
                    `<animate begin="start.begin+${stamp}s" dur="${msTime}ms" attributeName="visibility" from="visible" to="visible"/>`,
                    `</g>`,
                ]
            })),
            `</g>`,
            `<g>`,
            `<animate begin="0" dur="2s" attributeName="visibility" from="hidden" to="hidden"/>`,
            `<animate id="final" begin="start.end" dur="2s" attributeName="visibility" from="hidden" to="hidden"/>`,
            ...flatten(Object.keys(state.hits).map((key, i, arr) => {
                const { items } = state.hits[key];
                const [x, y] = pos(i, arr.length);
                return [
                    `<g>`,
                    `<circle opacity="0" cx="${x}" cy="${y}" r="30" fill="url(#gradient1)">`,
                    ...flatten(items.map(({ t }) => {
                        const stamp = (t - start) / Math.min(1000 / minDurationSeconds, span) * minDurationSeconds;
                        console.log(stamp);
                        return [
                            `<animate attributeName="opacity" from="0" to="1" dur="100ms" begin="start.begin+${stamp}s" />`
                        ]
                    })),
                    `</circle>`,
                    `<text text-anchor="middle" x="${x}" y="${y + 40}">${key}</text>`,
                    `</g>`,
                ];
            })),
            `</g>`,
            `</svg>`,
        ];
        return contents.join('\n');
    }

    const json = () => {
        return JSON.parse(JSON.stringify(state));
    }

    const actions = { svg, json };

    return name => {
        state.hits[name] = state.hits[name] || { items: [] };
        state.hits[name].items.push({ t: now() });

        return actions;
    }
};

