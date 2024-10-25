import type { Color, MapViewState } from '@deck.gl/core';
import { Layer, MapView } from '@deck.gl/core';
import { CollisionFilterExtension, type CollisionFilterExtensionProps } from '@deck.gl/extensions';
import { TileLayer } from '@deck.gl/geo-layers';
import { BitmapLayer, GeoJsonLayer, IconLayer, TextLayer } from '@deck.gl/layers';
import DeckGL from '@deck.gl/react';
import type { Feature, Geometry } from 'geojson';
import React, { StrictMode, useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import blocks from './assets/blocks.json';
import candidates from './assets/candidates.json';
import cults from './assets/cults.json';
import districts from './assets/districts.json';
import kickbacks from './assets/kickbacks.json';
import geojsonBlocks from './assets/layers/geojson_blocks.json';
import geojsonDistricts from './assets/layers/geojson_districts.json';
import iconBlockKickbacks from './assets/layers/icon_block_kickbacks.json';
import iconDistrictKickbacks from './assets/layers/icon_district_kickbacks.json';
import textBlockNames from './assets/layers/text_block_names.json';
import textDistrictNames from './assets/layers/text_district_names.json';
import parties from './assets/parties.json';
import './index.css';

type PartyKey = keyof typeof parties;
type Party = typeof parties[PartyKey];
type CandidateKey = keyof typeof candidates;
type Candidate = typeof candidates[CandidateKey];
type CultBlockKey = keyof typeof cults.blocks;
type CultBlock = typeof cults.blocks[CultBlockKey];
type CultBlockPartyKey = keyof CultBlock;
type BlockKey = keyof typeof blocks;
type Block = typeof blocks[BlockKey];
type BlockPartiesKey = keyof Block['parties'];
type DistrictKey = keyof typeof districts;
type KickbackDetailKey = keyof typeof kickbacks.details;
type KickbackDetail = typeof kickbacks.details[KickbackDetailKey];
type KickbackDistrictKey = keyof typeof kickbacks.not_runs.districts;
type KickbackBlockKey = keyof typeof kickbacks.not_runs.blocks;
type KickbackCandidateKey = keyof typeof kickbacks.candidates;
type DistrictName = typeof textDistrictNames[number];
type DistrictFeature = typeof geojsonDistricts.features[number];
type DistrictProperties = DistrictFeature['properties'];
type BlockName = typeof textBlockNames[number];
type BlockFeature = typeof geojsonBlocks.features[number];
type BlockProperties = BlockFeature['properties'];


const createBlockColors = (colors: [string, number, number, number][]): Record<string, { fillColor: Color, borderColor: Color, backgroundColor: Color, fontColor: Color }> => colors.reduce((acc, [key, r, g, b]) => {
    acc[key] = {
        fillColor: [r, g, b, 0x1f],
        borderColor: [r, g, b, 0xff],
        backgroundColor: [Math.min(255, 128 + r), Math.min(255, 128 + g), Math.min(255, 128 + b), 0x7f],
        fontColor: [r / 1.7, g / 1.7, b / 1.7, 0xff]
    };
    return acc;
}, {} as Record<string, { fillColor: Color, borderColor: Color, backgroundColor: Color, fontColor: Color }>);

const BLOCK_COLORS = createBlockColors([
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

const isTouchDevice = 'ontouchstart' in window
    || navigator.maxTouchPoints > 0
    || window.matchMedia('(pointer: coarse)').matches;
const SCREEN_ORIENTATION_TYPE = window.screen.orientation?.type || 'portrait-primary';
const ZOOM_LEVEL = SCREEN_ORIENTATION_TYPE.includes("landscape") ? 5 : 4;

const INITIAL_VIEW_STATE: MapViewState = {
    latitude: 38,
    longitude: 136.8,
    zoom: ZOOM_LEVEL,
    maxZoom: 16,
    minZoom: ZOOM_LEVEL,
    maxPitch: 45,
    pitch: 0,
    bearing: 0,
    transitionDuration: 500,
};

const PARTY_IDS = Object.keys(parties).filter((p) => parties[p as PartyKey].block_candidate_count > 0).sort((a, b) => parties[b as PartyKey].block_candidate_count - parties[a as PartyKey].block_candidate_count);

const zip = <T, U>(a: T[], b: U[]): [T | undefined, U | undefined][] => Array.from(Array(Math.max(b.length, a.length)), (_, i) => [a[i], b[i]]);

enum SheetSize {
    Hidden,
    Small,
    Full,
}
function CandidateName({ name, kana }: { name: string, kana?: string }) {
    const nameFragment = name.split(' ');
    return zip(nameFragment, kana?.split(' ') ?? [...Array(nameFragment.length)].map(_ => "　")).map(
        ([name, name_kana], index) => name_kana
            ? <ruby key={index}>{name}<rp>(</rp><rt>{name_kana}</rt><rp>)</rp></ruby>
            : name
    );
}

function PartyLabel({ party, disabled, className, children }: { party: Party, disabled: boolean, className: string, children?: React.ReactNode }) {
    return <div
        style={{ backgroundColor: party.color, opacity: disabled ? 1.0 : 0.2 }}
        className={`text-white text-center font-bold text-xs font-medium me-2 px-2.5 py-0.5 rounded ${className}`}>
        {party.name}
        {children || <></>}
    </div>
}

function NewsLink({ href, children }: { href: string, children: React.ReactNode }) {
    return <a
        className="text-blue-600 hover:underline text-xs py-0.5 inline-flex items-center justify-center"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
    >
        {children}<span aria-hidden="true">→</span>
    </a>;
}


function KickbackCard({ kickback, className }: { kickback: KickbackDetail, className?: string }) {
    const party = parties["1"];
    const name_joined = kickback.name.replace(" ", "");
    return <div className={`w-svw md:w-96 align-top flex opacity-50 ${className || ''}`}>
        <KickbackFace kickback={kickback} size={16} showScandal={true} />
        <div className="flex flex-col px-2 leading-normal">
            <h5 className="text-2xl font-bold tracking-tight text-gray-900">
                <CandidateName name={kickback.name} />
            </h5>
            <div className="flex flex-col gap-1">
                <div className="flex flex-wrap gap-1">
                    <span className="text-xs ">⌕</span>
                    <NewsLink href={`https://perplexity.ai/search?q=衆議院選挙 ${name_joined} 不祥事 裏金 統一教会`}>不祥事</NewsLink>
                    <NewsLink href={`https://perplexity.ai/search?q=衆議院選挙 ${name_joined} ニュース`}>ニュース</NewsLink>
                </div>
                <div className="flex flex-wrap gap-1">
                    <span style={{ backgroundColor: party.color }} className="text-white text-xs font-medium px-2.5 py-0.5 rounded">{party.name}</span>
                    <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">{kickback.status || '不出馬'}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                    <span className="bg-red-500 text-white text-xs font-medium px-2.5 py-0.5 rounded">裏金<span className="text-xs">{kickback.amount}</span>万円</span>
                </div>
            </div>
        </div>
    </div>;
}
function CandidateCard({ candidate, className }: { candidate: Candidate, className?: string }) {
    const party = parties[candidate.pid as PartyKey];
    const kickbackId = kickbacks.candidates[candidate.id as KickbackCandidateKey];
    const kickback = kickbackId ? kickbacks.details[kickbackId as KickbackDetailKey] : null;
    const cult = cults.candidates[candidate.id as keyof typeof cults.candidates];
    const name_joined = candidate.name.replace(" ", "");

    return <div className={`w-svw md:w-96 align-top flex ${className || ''}`}>
        <CandidateFace candidate={candidate} size={16} showScandal={true} />
        <div className="flex flex-col px-2 leading-normal">
            <h5 className="text-2xl font-bold tracking-tight text-gray-900">
                <CandidateName name={candidate.name} kana={candidate.name_kana} />
                <span className="text-sm ml-1">({candidate.age}歳)</span>
            </h5>
            <div className="flex flex-col gap-1">
                <div className="flex flex-wrap gap-1">
                    <span className="text-xs ">⌕</span>
                    <NewsLink href={`https://perplexity.ai/search?q=衆議院選挙 ${name_joined} 不祥事 裏金 統一教会`}>不祥事</NewsLink>
                    <NewsLink href={`https://perplexity.ai/search?q=衆議院選挙 ${name_joined} ニュース`}>ニュース</NewsLink>
                </div>
                <div className="flex flex-wrap gap-1">
                    <span style={{ backgroundColor: party.color }} className="text-white text-xs font-medium px-2.5 py-0.5 rounded">{party.name}</span>
                    <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">{candidate.status}{candidate.win_count === 0 ? <></> : <span> 当選{candidate.win_count}回</span>}</span>
                    {candidate.did && candidate.bid && <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">比例重複</span>}
                    {candidate.endorser && <span className="bg-blue-100 text-blue-800 text-xs  px-2.5 py-0.5 rounded">{candidate.endorser}推薦</span>}
                    {candidate.supporter && <span className="bg-green-100 text-green-800 text-xs px-2.5 py-0.5 rounded">{candidate.supporter}支持</span>}
                    {kickback && <span className="bg-red-500 text-white text-xs font-medium px-2.5 py-0.5 rounded">裏金<span className="text-xs">{kickback.amount}</span>万円</span>}
                    {cult && cult.point && <span className="bg-gray-600 text-white text-xs font-medium px-2.5 py-0.5 rounded">カルト度{cult.point}</span>}
                    {cult && cult.links.map((link, index) => <span key={index} className="bg-yellow-500 text-white text-xs font-medium px-2.5 py-0.5 rounded">{link}</span>)}
                </div>
                <div className="flex flex-wrap gap-1">
                    {candidate.titles.map((title, index) => <span key={index} className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">{title}</span>)}
                </div>
            </div>
        </div>
    </div>;
}

function KickbackFace({ kickback, size, showScandal }: { kickback: KickbackDetail, size: number, showScandal: boolean }) {
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

function CandidateFace({ candidate, size, showScandal }: { candidate: Candidate, size: number, showScandal: boolean }) {
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

    return <div className={`h-${size} ${showScandal ? 'relative' : ''} flex flex-col items-center overflow-visible`}>
        <div
            style={{ borderColor: party.color }}
            className={`w-${size} h-${size} overflow-hidden rounded-full border-4`}
        >
            <img className="w-full h-full object-cover" src={`https://www.nhk.or.jp/senkyo-data/database/shugiin/2024/00/18852/photo/${candidate.face_image}`} />
        </div>
        {warning}
    </div>
}

function CandidateSmall({ candidateId }: { candidateId: CandidateKey }) {
    const candidate = candidates[candidateId];
    return <div className="flex-none p-3 h-24 overflow-hidden">
        <div className="w-16 h-16 flex flex-col items-center justify-center overflow-visible">
            <CandidateFace candidate={candidate} size={16} showScandal={true} />
            <span className="text-slate-900 text-xs h-6 font-bold"><CandidateName name={candidate.name} kana={candidate.name_kana} /></span>
        </div>
    </div>
}

function NotRunSmall({ kickbackId }: { kickbackId: KickbackDetailKey }) {
    const kickback = kickbacks.details[kickbackId];
    return <div className="flex-none p-3">
        <div className="w-16 h-16 flex flex-col items-center justify-center overflow-visible">
            <KickbackFace kickback={kickback} size={16} showScandal={true} />
            <span className="text-slate-900 text-xs h-6 font-bold"><CandidateName name={kickback.name} /></span>
        </div>
    </div>
}

function SheetSmall({ setSheetSize, children }: { setSheetSize: (size: SheetSize) => void, children: React.ReactNode }) {
    const [startY, setStartY] = useState(0);
    const [isSlidingDown, setIsSlidingDown] = useState(false);

    const handleTouchEnd = () => {
        if (isSlidingDown) {
            setSheetSize(SheetSize.Full);
        }
        setIsSlidingDown(false);
    };

    return <div
        onTouchStart={e => setStartY(e.touches[0].clientY)}
        onTouchMove={e => (e.touches[0].clientY < startY - 50) && setIsSlidingDown(true)}
        onTouchEnd={handleTouchEnd}
    >
        {children}
    </div>;
}

function DistrictSmall({ districtId, setSheetSize }: { districtId: DistrictKey, setSheetSize: (size: SheetSize) => void }) {
    const district = districts[districtId];
    return <SheetSmall setSheetSize={setSheetSize}>
        <h5 className="text-2xl px-4 pt-4 font-bold tracking-tight text-gray-900">{district.name}<span className="text-sm ml-4">立候補者</span>{district.cids.length}<span className="text-sm">人</span></h5>
        <div className="overflow-x-scroll flex">
            {districts[districtId].cids.map((cid) => <CandidateSmall key={cid} candidateId={cid as CandidateKey} />)}
            {kickbacks.not_runs.districts[districtId as KickbackDistrictKey]?.map((kid) => <NotRunSmall key={kid} kickbackId={kid as KickbackDetailKey} />)}
        </div>
    </SheetSmall>
}


function BlockSmall({ blockId, setSheetSize }: { blockId: BlockKey, setSheetSize: (size: SheetSize) => void }) {
    const block = blocks[blockId];
    const blockParties = block.parties;
    return <SheetSmall setSheetSize={setSheetSize}>
        <h5 className="text-2xl px-4 pt-4 font-bold tracking-tight text-gray-900">比例{block.name}<span className="text-sm ml-4">定員</span>{block.quota}</h5>
        <div className="overflow-x-scroll flex">
            {PARTY_IDS.map((pid) => <div key={pid} className="flex-none px-0 pb-4 first:pl-4 last:pr-4">
                <PartyLabel party={parties[pid as PartyKey]} disabled={pid in blockParties} className="w-[4.5rem]"> {blockParties[pid as BlockPartiesKey]?.length || "0"}</PartyLabel>
            </div>)}
        </div>
    </SheetSmall>;
}


function SheetFull({ setSheetSize, children }: { setSheetSize: (size: SheetSize) => void, children: React.ReactNode }) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setSheetSize(SheetSize.Small);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);


    return <div className="relative h-full overflow-y-scroll"    >
        {children}
    </div>;
}

function DistrictFull({ districtId, setSheetSize }: { districtId: DistrictKey, setSheetSize: (size: SheetSize) => void }) {
    const district = districts[districtId];
    const districtKickbacks = kickbacks.not_runs.districts[districtId as KickbackDistrictKey]?.map((kid) => kickbacks.details[kid as KickbackDetailKey]);
    return <SheetFull setSheetSize={setSheetSize}>
        <div className="sticky top-0 left-0 px-4 pt-4 h-12 z-10 bg-white bg-opacity-80">
            <h5 className="text-2xl font-bold tracking-tight text-gray-900">{district.name}<span className="text-sm ml-4">立候補者</span>{district.cids.length}<span className="text-sm">人</span>        </h5>
            <button
                type="button"
                className="absolute top-2 right-4 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center"
                onClick={() => setSheetSize(SheetSize.Small)}
            >
                <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
                </svg>
            </button>
        </div>
        <div className="flex flex-wrap min-w-32 m-4 gap-2 divide-y">
            {district.cids.map((cid) => <CandidateCard key={cid} candidate={candidates[cid as CandidateKey]} className="p-2 bg-white md:border md:border-gray-200 md:rounded-lg md:shadow" />)}
            {districtKickbacks && districtKickbacks.map((kickback) => <KickbackCard key={kickback.id} kickback={kickback} className="p-2 bg-white md:border md:border-gray-200 md:rounded-lg md:shadow" />)}
        </div>

        <hr className="my-4 bg-gray-200 border-0 dark:bg-gray-700"></hr>

        <h5 className="text-2xl px-4 font-bold tracking-tight text-gray-900 bg-white bg-opacity-80">地域</h5>
        <div className="flex flex-wrap min-w-32 mx-4 gap-1">
            {district.areas.map((area, i) => <span key={i} className="bg-white text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded border border-gray-500">{area}</span>)}
        </div>
    </SheetFull>;
}

const isSafari = (() => {
    const userAgent = window.navigator.userAgent;
    return userAgent.includes('Safari') && !userAgent.includes('Chrome');
})();

function BlockFull({ blockId, setSheetSize }: { blockId: BlockKey, setSheetSize: (size: SheetSize) => void }) {
    const block = blocks[blockId];
    const blockPartyIds = PARTY_IDS.filter((pid) => block.parties[pid as BlockPartiesKey] !== undefined);
    const partyColors = blockPartyIds.map((pid) => parties[pid as PartyKey].color);
    const partyPaleColors = blockPartyIds.map((pid) => parties[pid as PartyKey].color + '10');
    const blockParties = blockPartyIds.map((pid) => block.parties[pid as BlockPartiesKey]);
    const maxCandidateCount = Math.max(...blockPartyIds.map((pid) => blockParties[pid as BlockPartiesKey]?.length || 0));
    const kickbackDetails = kickbacks.not_runs.blocks[blockId as KickbackBlockKey]?.map((kid) => kickbacks.details[kid as KickbackDetailKey]);
    const kickbackAmount = kickbacks.blocks[blockId as KickbackBlockKey]

    return <SheetFull setSheetSize={setSheetSize}>
        <div className="sticky top-0 left-0 px-4 pt-4 h-12 z-10 bg-white bg-opacity-80">
            <h5 className="text-2xl font-bold tracking-tight text-gray-900">比例{block.name}<span className="text-sm ml-4">定員</span>{block.quota}</h5>
            <button
                type="button"
                className="absolute top-2 right-4 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center"
                onClick={() => setSheetSize(SheetSize.Small)}
            >
                <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
                </svg>
            </button>
        </div>
        <div>
            <table className="w-full overflow-hidden">
                <thead>
                    <tr>{blockPartyIds.map((pid, colIndex) =>
                        <th key={pid} style={{ backgroundColor: partyColors[colIndex] }} className={`${isSafari ? "" : "sticky top-12 z-10"} w-96 text-white p-2 border-b border-gray-200`}>{parties[pid as PartyKey].name_full}</th>
                    )}</tr>
                </thead>
                <tbody className="bg-white divide-x divide-gray-200 overflow-y-auto">
                    <tr>{blockPartyIds.map((pid, colIndex) => {
                        const point = cults.blocks[blockId as BlockKey][pid as CultBlockPartyKey]?.point;
                        return <td key={colIndex} style={{ backgroundColor: partyPaleColors[colIndex] }} className="p-2 border-b border-gray-200">
                            <div className="flex justify-center gap-1 ">
                                {colIndex === 0 && kickbackAmount && <span className="bg-red-500 text-white text-xs font-medium px-2.5 py-0.5 rounded">裏金合計<span className="text-xs">{kickbackAmount}</span>万円</span>}
                                {point && <span className="bg-gray-600 text-white text-xs font-medium px-2.5 py-0.5 rounded">カルト度合計{point}</span>}
                            </div>
                        </td>;
                    })}</tr>
                    {Array.from({ length: maxCandidateCount }, (_, rowIndex) =>
                        <tr key={rowIndex}>{blockParties.map((blockParty, colIndex) => {
                            const element = blockParty[rowIndex];
                            if (!element) {
                                return <td key={colIndex} className="p-2 border-b border-gray-200"></td>;
                            }
                            return <td key={colIndex} style={{ backgroundColor: partyPaleColors[colIndex] }} className="relative p-2 border-b border-gray-200">
                                <CandidateCard candidate={candidates[element.cid as CandidateKey]} />
                                <span className="absolute top-2 right-2 text-xs text-gray-900">名簿順位 {element.order}</span>
                            </td>;
                        })}
                        </tr>
                    )}
                    {kickbackDetails && kickbackDetails.map((kickback) => <tr key={kickback.id}>
                        {blockPartyIds.map((pid, colIndex) => (pid !== "1"
                            ? <td key={colIndex} className="p-2 border-b border-gray-200"></td>
                            : <td key={colIndex} style={{ backgroundColor: partyPaleColors[colIndex] }} className="relative p-2 border-b border-gray-200">
                                <KickbackCard kickback={kickback} />
                            </td>
                        ))}
                    </tr>)}
                </tbody>
            </table>
        </div>
    </SheetFull>;
}

function Sheet({ size, smallHeight, isBlockScale, children }: { size: SheetSize, smallHeight: string, isBlockScale: boolean, children: React.ReactNode }) {
    const visible = size === SheetSize.Full ? 'h-svh' : ((size === SheetSize.Small && isBlockScale) ? smallHeight : 'h-0');
    const bgClass = size === SheetSize.Full ? 'bg-white' : 'bg-white/[.6]';
    return (
        <div className={`${visible} fixed w-svw bottom-0 px-0 mx-0 transition-height overflow-hidden duration-300 ease-in-out`}>
            <div className={`${size !== SheetSize.Full ? 'bottomSheetKnob rounded-t-xl' : ''} h-full min-w-96 border border-gray-200 shadow transition-colors duration-300 ease-in-out ${bgClass}`}>
                {children}
            </div>
        </div>
    );
}

function AboutPanel({ showAboutPanel, setShowAboutPanel }: { showAboutPanel: boolean, setShowAboutPanel: (show: boolean) => void }) {
    if (!showAboutPanel) {
        return <></>;
    }
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setShowAboutPanel(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="relative z-10" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="fixed inset-0 z-10 w-screen">
                <div className="flex items-end justify-center text-center">
                    <div className="h-dvh w-full bg-white text-left overflow-y-scroll">
                        <div className="relative bg-white px-4">
                            <div className="sticky top-0 pt-4 z-10 bg-white bg-opacity-80 overflow-hidden">
                                <h1 className="text-3xl font-extrabold leading-none tracking-tight text-gray-900">衆院選2024候補者マップ</h1>
                                <button
                                    type="button"
                                    className="fixed top-4 right-4 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center"
                                    onClick={() => setShowAboutPanel(false)}
                                >
                                    <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
                                    </svg>
                                </button>
                            </div>

                            <h3 className="mt-2 text-2xl font-semibold text-gray-900">データ引用元</h3>
                            <p className="my-4">
                                <ul className="space-y-1 text-gray-500 list-disc list-inside dark:text-gray-400">
                                    <li><a className="font-medium text-blue-600 dark:text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer"
                                        href="https://www.nhk.or.jp/senkyo/database/shugiin/">衆議院選挙2024特設サイト | NHK
                                    </a></li>
                                    <li><a className="font-medium text-blue-600 dark:text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer"
                                        href="https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N03-2024.html">行政区域データ: データ基準年 2024年（令和6年）版 | 国土数値情報ダウンロードサイト
                                    </a></li>
                                    <li><a className="font-medium text-blue-600 dark:text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer"
                                        href="https://maps.gsi.go.jp/development/ichiran.html">地理院タイル一覧 | 国土地理院
                                    </a></li>
                                    <li><a className="font-medium text-blue-600 dark:text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer"
                                        href="https://qiita.com/uedayou/items/806ed80a45ec9855c554">住所LODから行政区画のGeoJSONファイルを作成する方法 | Qiita
                                    </a></li>
                                    <li><a className="font-medium text-blue-600 dark:text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer"
                                        href="https://github.com/smartnews-smri/japan-topography">市区町村・選挙区 地形データ | GitHub
                                    </a></li>
                                    <li><a className="font-medium text-blue-600 dark:text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer"
                                        href="http://dailycult.blogspot.com/2021/10/2021.html">【衆院選2021】総力特集・カルト候補ぜんぶ載せ！ | やや日刊カルト新聞
                                    </a></li>
                                    <li><a className="font-medium text-blue-600 dark:text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer"
                                        href="https://clearing-house.org/?p=6069">政治資金パーティー収入　裏金はおいくらでしたか？（裏金国会議員一覧） | 情報公開クリアリングハウス
                                    </a></li>
                                    <li><a className="font-medium text-blue-600 dark:text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer"
                                        href="https://news.ntv.co.jp/pages/uragane">【一覧】自民党国会議員の"裏金"リスト 88人 | 日テレNEWS
                                    </a></li>
                                    <li><a className="font-medium text-blue-600 dark:text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer"
                                        href="https://www.tokyo-np.co.jp/article/200852">【自民党、旧統一教会と接点ある国会議員は179人　うち121人を公表　選挙支援の依頼は2人 | 東京新聞
                                    </a></li>
                                </ul>
                            </p>

                            <h3 className="mt-2 text-2xl font-semibold text-gray-900">利用サービス</h3>
                            <p className="my-4">
                                <ul className="space-y-1 text-gray-500 list-disc list-inside dark:text-gray-400">
                                    <li><a className="font-medium text-blue-600 dark:text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer"
                                        href="https://github.com">GitHub
                                    </a></li>
                                    <li><a className="font-medium text-blue-600 dark:text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer"
                                        href="https://docs.github.com/ja/pages/getting-started-with-github-pages/about-github-pages">GitHub Pages | GitHub
                                    </a></li>
                                    <li><a className="font-medium text-blue-600 dark:text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer"
                                        href="https://www.perplexity.ai/">Perplexity AI
                                    </a></li>
                                </ul>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const devicePixelRatio = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;

export default function App({ }: {}) {
    const fontSize = 32;

    const [showAboutPanel, setShowAboutPanel] = useState(false);
    const [viewState, setViewState] = useState<MapViewState>(INITIAL_VIEW_STATE);
    const [blockId, setBlockId] = useState<BlockKey | null>(null);
    const [blockSheetSize, setBlockSheetSize] = useState<SheetSize>(SheetSize.Hidden);
    const [districtId, setDistrictId] = useState<DistrictKey | null>(null);
    const [districtSheetSize, setDistrictSheetSize] = useState<SheetSize>(SheetSize.Hidden);

    const onViewStateChange = useCallback(({ viewState }: { viewState: MapViewState }) => {
        setViewState(viewState);
    }, []);

    // const getUserLocation = () => {
    //     if (!navigator.geolocation) {
    //         console.error('Geolocation is not supported by this browser.');
    //     }
    //     navigator.geolocation.getCurrentPosition(
    //         (position) => {
    //             const newViewState = { ...viewState, "longitude": position.coords.longitude, "latitude": position.coords.latitude, "zoom": 8, transitionDuration: 500, }
    //             setViewState(newViewState);

    //         },
    //         (error) => {
    //             console.error('Error getting user location:', error);
    //         }
    //     );
    // };

    const zoom = viewState.zoom;
    const scale = 2 ** zoom;
    const sizeMaxPixels = (scale / 3) * fontSize;
    const sizeMinPixels = Math.min(scale / 1000, 0.5) * fontSize;
    const districtLineWidth = Math.min(1.2 ** (zoom - 5), 4);
    const isBlockScale = zoom < 6;

    const layers: Layer[] = [];
    if (zoom >= 11) {
        layers.push(
            new TileLayer<ImageBitmap>({
                id: 'tile-pale',
                data: ['https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png'],
                maxRequests: 20,
                pickable: false,
                minZoom: 0,
                maxZoom: 19,
                tileSize: 256,
                zoomOffset: devicePixelRatio === 1 ? -1 : 0,
                renderSubLayers: props => {
                    const [[west, south], [east, north]] = props.tile.boundingBox;
                    const { data, ...otherProps } = props;

                    return [
                        new BitmapLayer(otherProps, {
                            image: data,
                            bounds: [west, south, east, north]
                        })
                    ];
                },
            })
        );
    }

    layers.push(
        new GeoJsonLayer({
            id: 'geojson-districts',
            data: geojsonDistricts as unknown as Feature<Geometry, DistrictProperties>[],
            visible: zoom >= 6,
            stroked: true,
            filled: true,
            pickable: true,
            getFillColor: (f: Feature<Geometry, DistrictProperties>) => BLOCK_COLORS[f.properties.bid].fillColor,
            getLineColor: (f: Feature<Geometry, DistrictProperties>) => BLOCK_COLORS[f.properties.bid].borderColor,
            getLineWidth: (f: Feature<Geometry, DistrictProperties>) => (districtId === f.properties.did) ? districtLineWidth * 2 : districtLineWidth,
            lineWidthUnits: 'pixels',
            onHover: ({ object }) => {
                if (object) {
                    setDistrictId(object.properties.did as DistrictKey);
                    setDistrictSheetSize(SheetSize.Small);
                    setBlockId(object.properties.bid as BlockKey);
                    setBlockSheetSize(SheetSize.Small);
                } else {
                    setDistrictSheetSize(SheetSize.Hidden);
                    setBlockSheetSize(SheetSize.Hidden);
                }
            },
            onClick: ({ object }) => {
                if (isTouchDevice) {
                    return;
                };
                setDistrictId(object?.properties.did as DistrictKey);
                setDistrictSheetSize(SheetSize.Full);
                setBlockId(object?.properties.bid as BlockKey);
                setBlockSheetSize(SheetSize.Hidden);
            },
            onTouchStart: ({ object }: { object: Feature<Geometry, DistrictProperties> | null }) => {
                setDistrictId(object?.properties.did as DistrictKey);
                setDistrictSheetSize(SheetSize.Full);
                setBlockId(object?.properties.bid as BlockKey);
                setBlockSheetSize(SheetSize.Hidden);
            },
            updateTriggers: {
                getLineWidth: [districtId, districtLineWidth]
            },
        })
    );
    layers.push(
        new GeoJsonLayer({
            id: 'geojson-blocks',
            data: geojsonBlocks as unknown as Feature<Geometry, BlockProperties>[],
            visible: zoom < 6,
            stroked: true,
            filled: true,
            pickable: true,
            getFillColor: (f: Feature<Geometry, BlockProperties>) => BLOCK_COLORS[f.properties.bid].fillColor,
            getLineColor: (f: Feature<Geometry, BlockProperties>) => BLOCK_COLORS[f.properties.bid].borderColor,
            getLineWidth: (f: Feature<Geometry, BlockProperties>) => (blockId === f.properties.bid) ? districtLineWidth * 2 : districtLineWidth,
            lineWidthUnits: 'pixels',
            onHover: ({ object }) => {
                if (object) {
                    setBlockId(object.properties.bid as BlockKey);
                    setBlockSheetSize(SheetSize.Small);
                } else {
                    setBlockSheetSize(SheetSize.Hidden);
                }
            },
            onClick: ({ object }) => {
                if (isTouchDevice) {
                    return;
                };
                setDistrictSheetSize(SheetSize.Hidden);
                setBlockId(object?.properties.bid as BlockKey);
                setBlockSheetSize(SheetSize.Full);
            },
            onTouchStart: ({ object }: { object: Feature<Geometry, DistrictProperties> | null }) => {
                setDistrictSheetSize(SheetSize.Hidden);
                setBlockId(object?.properties.bid as BlockKey);
                setBlockSheetSize(SheetSize.Full);
            },
            updateTriggers: {
                getLineWidth: [blockId, districtLineWidth]
            },
        })
    );

    layers.push(
        new TextLayer<DistrictName, CollisionFilterExtensionProps<DistrictName>>({
            id: 'text-district-names',
            data: textDistrictNames,
            billboard: true,
            visible: zoom >= 7,
            characterSet: 'auto',
            fontSettings: { buffer: 8 },

            // TextLayer options
            getText: d => districts[d.d as keyof typeof districts].name,
            getPosition: d => [d.p[0], d.p[1], 200],
            getColor: d => BLOCK_COLORS[d.b].fontColor,
            getSize: d => Math.pow(d.a, 0.25),
            sizeScale: fontSize,
            sizeMaxPixels,
            sizeMinPixels,
            background: true,
            getBackgroundColor: d => BLOCK_COLORS[d.b].backgroundColor,
            maxWidth: 64 * 12,

            // CollideExtension options
            collisionEnabled: true,
            getCollisionPriority: d => Math.log10(d.a),
            collisionTestProps: {
                sizeScale: 32 * 2,
                sizeMaxPixels: sizeMaxPixels * 2,
                sizeMinPixels: sizeMinPixels * 2
            },
            extensions: [new CollisionFilterExtension()]
        })
    );


    layers.push(
        new IconLayer({
            id: 'icon-district-kickbacks',
            data: iconDistrictKickbacks,
            billboard: true,
            iconAtlas: 'money_emoji.png',
            iconMapping: {
                marker: {
                    x: 0, y: 0,
                    width: 256, height: 256,
                }
            },
            getPixelOffset: [0, Math.max(sizeMinPixels, zoom - 3)],
            getSize: d => (8 + Math.pow(d.a, 0.4)) * Math.max(0, Math.log(zoom - 4)),
            getIcon: _ => 'marker',
            getPosition: d => [d.p[0], d.p[1], 200],
            updateTriggers: {
                getPixelOffset: [zoom],
                getSize: [zoom],
            },
        })
    );

    layers.push(
        new TextLayer<BlockName, CollisionFilterExtensionProps<BlockName>>({
            id: 'text-block-names',
            data: textBlockNames,
            visible: zoom < 7,
            characterSet: 'auto',
            fontSettings: {
                buffer: 8
            },

            // TextLayer options
            getText: d => blocks[d.b as keyof typeof blocks].name,
            getPosition: d => [d.p[0], d.p[1], d.a * 2000],
            getColor: d => BLOCK_COLORS[d.b].fontColor,
            getSize: d => Math.pow(d.a, 0.25),
            sizeScale: fontSize,
            sizeMaxPixels,
            sizeMinPixels,
            maxWidth: 64 * 12,

            // CollideExtension options
            collisionEnabled: true,
            getCollisionPriority: d => Math.log10(d.a),
            collisionTestProps: {
                sizeScale: 32 * 2,
                sizeMaxPixels: sizeMaxPixels * 2,
                sizeMinPixels: sizeMinPixels * 2
            },
            extensions: [new CollisionFilterExtension()]
        })
    );

    layers.push(
        new IconLayer({
            id: 'icon-block-kickbacks',
            data: iconBlockKickbacks,
            visible: zoom < 7,
            iconAtlas: 'money_emoji.png',
            iconMapping: {
                marker: {
                    x: 0, y: 0,
                    width: 256, height: 256,
                }
            },
            getSize: d => 8 + Math.pow(d.a, 0.4),
            getIcon: _ => 'marker',
            getPosition: d => [d.p[0], d.p[1], 200],
            getPixelOffset: [0, 20],
        })
    );

    return (
        <div id="app" className="overscroll-none w-svw h-svh flex">
            <main>
                <DeckGL
                    layers={layers}
                    views={new MapView()}
                    viewState={viewState}
                    controller={{ doubleClickZoom: true }}
                    onViewStateChange={onViewStateChange}
                />
                <div
                    className="absolute top-0 right-0 p-4 opacity-50 cursor-pointer"
                    onClick={() => setShowAboutPanel(true)}
                >
                    <h2 className="text-md font-bold text-gray-900 tracking-tight">衆院選2024候補者マップ</h2>
                </div>
                <Sheet size={districtSheetSize} smallHeight="h-36" isBlockScale={!isBlockScale}>
                    {districtId && (districtSheetSize === SheetSize.Full
                        ? <DistrictFull districtId={districtId} setSheetSize={setDistrictSheetSize} />
                        : <DistrictSmall districtId={districtId} setSheetSize={setDistrictSheetSize} />
                    )}
                </Sheet>
                <Sheet size={blockSheetSize} smallHeight="h-20" isBlockScale={isBlockScale}>
                    {blockId && (blockSheetSize === SheetSize.Full
                        ? <BlockFull blockId={blockId} setSheetSize={setBlockSheetSize} />
                        : <BlockSmall blockId={blockId} setSheetSize={setBlockSheetSize} />
                    )}
                </Sheet>
            </main>
            <AboutPanel showAboutPanel={showAboutPanel} setShowAboutPanel={setShowAboutPanel} />
        </div>
    );
}

const ROOT = createRoot(document.getElementById('root')!);
ROOT.render(<StrictMode><App /></StrictMode>)