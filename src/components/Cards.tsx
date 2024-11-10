import { CandidateFace, CandidateName, KickbackFace, NewsLink } from '.';
import { Candidate, cults, KickbackCandidateKey, KickbackDetail, KickbackDetailKey, kickbacks, parties, PartyKey } from '../data';

export function KickbackCard({ kickback, className }: { kickback: KickbackDetail, className?: string }) {
    const party = parties["1"];
    const name_joined = kickback.name.replace(" ", "");
    return <div className={`align-top flex opacity-50 ${className || ''}`}>
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

export function CandidateCard({ candidate, className }: { candidate: Candidate, className?: string }) {
    const party = parties[candidate.pid as PartyKey];
    const kickbackId = kickbacks.candidates[candidate.id as KickbackCandidateKey];
    const kickback = kickbackId ? kickbacks.details[kickbackId as KickbackDetailKey] : null;
    const cult = cults.candidates[candidate.id as keyof typeof cults.candidates];
    const name_joined = candidate.name.replace(" ", "");

    return <div className={`align-top flex ${className || ''}`}>
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
