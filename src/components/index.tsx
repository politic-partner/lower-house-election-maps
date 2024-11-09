import { Candidate, KickbackCandidateKey, KickbackDetail, KickbackDetailKey, Party, PartyKey, cults, kickbacks, parties } from "../data";

const zip = <T, U>(a: T[], b: U[]): [T | undefined, U | undefined][] => Array.from(Array(Math.max(b.length, a.length)), (_, i) => [a[i], b[i]]);

export function CandidateName({ name, kana }: { name: string, kana?: string }) {
    if (!kana) {
        return name;
    }
    const nameFragment = name.split(' ');
    return zip(nameFragment, kana?.split(' ') ?? [...Array(nameFragment.length)].map(_ => "　")).map(
        ([name, name_kana], index) => name_kana
            ? <ruby key={index}>{name}<rp>(</rp><rt>{name_kana}</rt><rp>)</rp></ruby>
            : name
    )
}

export function NewsLink({ href, children }: { href: string, children: React.ReactNode }) {
    return <a
        className="text-blue-600 hover:underline text-xs py-0.5 inline-flex items-center justify-center"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
    >
        {children}<span aria-hidden="true">→</span>
    </a>;
}

export const isStickyNotSupported = (() => {
    const userAgent = window.navigator.userAgent;
    return userAgent.includes('Safari') || userAgent.includes('Chrome');
})();

export const isTouchDevice = 'ontouchstart' in window
    || navigator.maxTouchPoints > 0
    || window.matchMedia('(pointer: coarse)').matches;

export const SCREEN_ORIENTATION_TYPE = window.screen.orientation?.type || 'portrait-primary';


export function KickbackFace({ kickback, size, showScandal }: { kickback: KickbackDetail, size: number, showScandal: boolean }) {
    return <div className={`h-${size} relative flex flex-col items-center overflow-visible`}>
        <div
            style={{ borderColor: parties["1" as PartyKey].color, opacity: showScandal ? 0.5 : 1.0 }}
            className={`w-${size} h-${size} overflow-hidden rounded-full border-4`}
        >
            <img className="w-full h-full object-cover" src={kickback.face_url!} />
        </div>
        {showScandal && <span className="absolute -bottom-1 whitespace-nowrap py-0.5 px-1 inline-flex items-center justify-center text-[0.5rem] text-nowrap font-bold text-white bg-red-500 rounded-full">
            裏金<span className="text-xs">{kickback.amount}</span>万円
        </span>}
    </div>;
}

export function CandidateFace({ candidate, size, showScandal }: { candidate: Candidate, size: number, showScandal: boolean }) {
    const party = parties[candidate.pid as PartyKey];
    let warning = null;

    if (showScandal) {
        const kickbackId = kickbacks.candidates[candidate.id as KickbackCandidateKey];
        const kickback = kickbackId ? kickbacks.details[kickbackId as KickbackDetailKey] : null;

        if (kickback) {
            warning = (<span className="absolute -bottom-1 whitespace-nowrap py-0.5 px-1 inline-flex items-center justify-center text-[0.5rem] text-nowrap font-bold text-white bg-red-500 rounded-full">
                裏金 <span className="text-xs" > {kickback.amount}</span > 万円
            </span >);
        } else {
            const cult = cults.candidates[candidate.id as keyof typeof cults.candidates];
            if (cult) {
                warning = (<span className="absolute -bottom-1 whitespace-nowrap py-0.5 px-1 inline-flex items-center justify-center text-[0.5rem] text-nowrap font-bold text-white bg-yellow-500 rounded-full">
                    {cult.links[0]}
                </span >);
            }
        }
    }

    let result = null;
    switch (candidate.result) {
        case "1":
            result = (<span className="absolute top-0 -left-2 h-8 w-8 whitespace-nowrap py-0.5 px-1 inline-flex items-center justify-center text-xl text-nowrap font-bold text-white bg-red-500 rounded-full">当</span >)
            break;
        case "4":
            result = (<span className="absolute top-0 -left-2 h-8 w-8 whitespace-nowrap py-0.5 px-1 inline-flex items-center justify-center text-xl text-nowrap font-bold text-white bg-red-500 rounded-full">比</span >)
            break;
    }

    return <div className={`h-${size} ${showScandal ? 'relative' : ''} flex flex-col items-center overflow-visible`}>
        <div
            style={{ borderColor: party.color }}
            className={`w-${size} h-${size} overflow-hidden rounded-full border-4`}
        >
            <img className="w-full h-full object-cover" src={`https://www.nhk.or.jp/senkyo-data/database/shugiin/2024/00/18852/photo/${candidate.face_image}`} />
        </div>
        {warning}
        {result}
    </div>
}

export function PartyLabel({ party, disabled, className, children }: { party: Party, disabled: boolean, className: string, children?: React.ReactNode }) {
    return <div
        style={{ backgroundColor: party.color, opacity: disabled ? 1.0 : 0.2 }}
        className={`text-white text-center font-bold text-xs font-medium me-2 px-2.5 py-0.5 rounded ${className}`}>
        {party.name}
        {children || <></>}
    </div>
}
