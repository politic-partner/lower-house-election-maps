import React, { useEffect, useState } from 'react';
import IconCross from '../assets/icons/cross.svg?react';
import { CandidateFace, CandidateName, isStickyNotSupported, KickbackFace, PartyLabel } from '.';
import { BlockKey, BlockPartiesKey, blocks, CandidateKey, candidates, CultBlockPartyKey, cults, DistrictKey, districts, KickbackBlockKey, KickbackDetailKey, KickbackDistrictKey, kickbacks, parties, PARTY_IDS, PartyKey } from '../data';
import { CandidateCard, KickbackCard } from './Cards';

export enum SheetSize {
    Hidden,
    Small,
    Full,
}

export function Sheet({ size, smallHeight, isBlockScale, children }: { size: SheetSize, smallHeight: string, isBlockScale: boolean, children: React.ReactNode }) {
    const visible = size === SheetSize.Full ? 'h-svh' : ((size === SheetSize.Small && isBlockScale) ? smallHeight : 'h-0');
    const bgClass = size === SheetSize.Full ? 'bg-white' : 'bg-white/[.6]';
    return (
        <div className={`${visible} fixed w-svw bottom-0 px-0 mx-0 z-10 transition-height overflow-hidden duration-300 ease-in-out`}>
            <div className={`${size !== SheetSize.Full ? 'bottomSheetKnob rounded-t-xl' : ''} h-full min-w-96 border border-gray-200 shadow transition-colors duration-300 ease-in-out ${bgClass}`}>
                {children}
            </div>
        </div>
    );
}


export function SheetFull({ setSheetSize, children }: { setSheetSize: (size: SheetSize) => void, children: React.ReactNode }) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setSheetSize(SheetSize.Small);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setSheetSize]);

    return (
        <div className="relative h-full overflow-y-scroll">
            {children}
        </div>
    );
}


export function DistrictFull({ districtId, setSheetSize }: { districtId: DistrictKey, setSheetSize: (size: SheetSize) => void }) {
    const district = districts[districtId];
    const districtKickbacks = kickbacks.not_runs.districts[districtId as KickbackDistrictKey]?.map((kid) => kickbacks.details[kid as KickbackDetailKey]);
    return (
        <SheetFull setSheetSize={setSheetSize}>
            <div className="sticky top-0 left-0 px-4 pt-4 h-12 z-10 bg-white bg-opacity-80">
                <h5 className="text-2xl font-bold tracking-tight text-gray-900">{district.name}<span className="text-sm ml-4">立候補者</span>{district.cids.length}<span className="text-sm">人</span></h5>
                <button
                    type="button"
                    className="absolute top-2 right-4 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center"
                    onClick={() => setSheetSize(SheetSize.Small)}
                >
                    <IconCross className="w-3 h-3" aria-hidden="true" />
                </button>
            </div>
            <div className="flex flex-wrap min-w-32 m-4 gap-2 divide-y">
                {district.cids.map((cid) => {
                    const candidate = candidates[cid as CandidateKey];
                    return <div key={cid} className="relative">
                        <CandidateCard candidate={candidate} className="p-2 bg-white md:border md:border-gray-200 md:rounded-lg md:shadow" />
                        <span className="absolute top-6 right-2 text-xs text-gray-900">得票率 {(candidate.share * 100).toFixed(1)}%</span>
                    </div>;
                })}
                {districtKickbacks && districtKickbacks.map((kickback) => <KickbackCard key={kickback.id} kickback={kickback} className="p-2 bg-white md:border md:border-gray-200 md:rounded-lg md:shadow" />)}
            </div>
            <hr className="my-4 bg-gray-200 border-0 dark:bg-gray-700"></hr>
            <h5 className="text-2xl px-4 font-bold tracking-tight text-gray-900 bg-white bg-opacity-80">地域</h5>
            <div className="flex flex-wrap min-w-32 mx-4 gap-1">
                {district.areas.map((area, i) => <span key={i} className="bg-white text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded border border-gray-500">{area}</span>)}
            </div>
        </SheetFull>
    );
}

export function BlockFull({ blockId, setSheetSize }: { blockId: BlockKey, setSheetSize: (size: SheetSize) => void }) {
    const block = blocks[blockId];
    const blockPartyIds = PARTY_IDS.filter((pid) => block.parties[pid as BlockPartiesKey] !== undefined);
    const partyColors = blockPartyIds.map((pid) => parties[pid as PartyKey].color);
    const partyPaleColors = blockPartyIds.map((pid) => parties[pid as PartyKey].color + '10');
    const blockParties = blockPartyIds.map((pid) => block.parties[pid as BlockPartiesKey]);
    const maxCandidateCount = Math.max(...blockPartyIds.map((pid) => blockParties[pid as BlockPartiesKey]?.length || 0));
    const kickbackDetails = kickbacks.not_runs.blocks[blockId as KickbackBlockKey]?.map((kid) => kickbacks.details[kid as KickbackDetailKey]);
    const kickbackAmount = kickbacks.blocks[blockId as KickbackBlockKey];

    return (
        <SheetFull setSheetSize={setSheetSize}>
            <div className="sticky top-0 left-0 px-4 pt-4 h-12 z-10 bg-white bg-opacity-80">
                <h5 className="text-2xl font-bold tracking-tight text-gray-900">比例{block.name}<span className="text-sm ml-4">定員</span>{block.quota}</h5>
                <button
                    type="button"
                    className="absolute top-2 right-4 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center"
                    onClick={() => setSheetSize(SheetSize.Small)}
                >
                    <IconCross className="w-3 h-3" aria-hidden="true" />
                </button>
            </div>
            <div>
                <table className="w-full overflow-hidden">
                    <thead>
                        <tr>{blockPartyIds.map((pid, colIndex) =>
                            <th key={pid} style={{ backgroundColor: partyColors[colIndex] }} className={`${isStickyNotSupported ? "" : "sticky top-12 z-10"} w-96 text-white p-2 border-b border-gray-200`}>{parties[pid as PartyKey].name_full}</th>
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
                                const candidate = candidates[element.cid as CandidateKey];
                                return <td key={colIndex} style={{ backgroundColor: partyPaleColors[colIndex] }} className="relative p-2 border-b border-gray-200">
                                    <CandidateCard candidate={candidate} />
                                    <span className="absolute top-2 right-2 text-xs text-gray-900">名簿順位 {element.order}</span>
                                    {
                                        (candidate.loss_rate > 0 && candidate.loss_rate != 1) &&
                                        <span className="absolute top-6 right-2 text-xs text-gray-900">惜敗率 {(candidate.loss_rate * 100).toFixed(1)}%</span>
                                    }

                                </td>;
                            })}
                            </tr>
                        )}
                        {kickbackDetails && kickbackDetails.map((kickback) => <tr key={kickback.id}>
                            {blockPartyIds.map((pid, colIndex) => (pid !== "1"
                                ? <td key={colIndex} className="p-2 border-b border-gray-200"></td>
                                : <td key={colIndex} style={{ backgroundColor: partyPaleColors[colIndex] }} className="relative p-2 border-b border-gray-200">
                                    {kickback.cid
                                        ? <CandidateCard candidate={candidates[kickback.cid as CandidateKey]} className="opacity-50" />
                                        : <KickbackCard kickback={kickback} />
                                    }
                                </td>
                            ))}
                        </tr>)}
                    </tbody>
                </table>
            </div>
        </SheetFull>
    );
}


export function CandidateSmall({ candidateId }: { candidateId: CandidateKey }) {
    const candidate = candidates[candidateId];
    return <div className="flex-none p-3 h-24 overflow-hidden">
        <div className="w-16 h-16 flex flex-col items-center justify-center overflow-visible">
            <CandidateFace candidate={candidate} size={16} showScandal={true} />
            <span className="text-slate-900 text-xs h-6 font-bold"><CandidateName name={candidate.name} kana={candidate.name_kana} /></span>
        </div>
    </div>
}

export function NotRunSmall({ kickbackId }: { kickbackId: KickbackDetailKey }) {
    const kickback = kickbacks.details[kickbackId];
    return <div className="flex-none p-3">
        <div className="w-16 h-16 flex flex-col items-center justify-center overflow-visible">
            <KickbackFace kickback={kickback} size={16} showScandal={true} />
            <span className="text-slate-900 text-xs h-6 font-bold"><CandidateName name={kickback.name} /></span>
        </div>
    </div>
}

export function SheetSmall({ setSheetSize, children }: { setSheetSize: (size: SheetSize) => void, children: React.ReactNode }) {
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

export function DistrictSmall({ districtId, setSheetSize }: { districtId: DistrictKey, setSheetSize: (size: SheetSize) => void }) {
    const district = districts[districtId];
    return <SheetSmall setSheetSize={setSheetSize}>
        <h5 className="text-2xl px-4 pt-4 font-bold tracking-tight text-gray-900">{district.name}<span className="text-sm ml-4">立候補者</span>{district.cids.length}<span className="text-sm">人</span></h5>
        <div className="overflow-x-scroll flex">
            {districts[districtId].cids.map((cid) => <CandidateSmall key={cid} candidateId={cid as CandidateKey} />)}
            {kickbacks.not_runs.districts[districtId as KickbackDistrictKey]?.map((kid) => <NotRunSmall key={kid} kickbackId={kid as KickbackDetailKey} />)}
        </div>
    </SheetSmall>
}


export function BlockSmall({ blockId, setSheetSize }: { blockId: BlockKey, setSheetSize: (size: SheetSize) => void }) {
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
