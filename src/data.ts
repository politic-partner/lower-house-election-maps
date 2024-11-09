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
import results from './assets/nhk_results.json';
import parties from './assets/parties.json';
import survey from './assets/nhk_survey.json';

export {
    blocks,
    candidates,
    cults,
    districts, geojsonBlocks,
    geojsonDistricts,
    iconBlockKickbacks,
    iconDistrictKickbacks, kickbacks, parties, results, textBlockNames,
    textDistrictNames,
    survey,
};

export type ResultDistrictKey = keyof typeof results.districts;
export type SurveyCandidateKey = keyof typeof survey.candidates;
export type SurveyCandidate = typeof survey.candidates[SurveyCandidateKey];
export type SurveyCandedateAnswerKey = keyof SurveyCandidate["a"];
export type SurveyQuestionKey = keyof typeof survey.questions;
export type SurveyQuestion = typeof survey.questions[SurveyQuestionKey];

export type PartyKey = keyof typeof parties;
export type Party = typeof parties[PartyKey];
export type CandidateKey = keyof typeof candidates;
export type Candidate = typeof candidates[CandidateKey];
export type CultBlockKey = keyof typeof cults.blocks;
export type CultBlock = typeof cults.blocks[CultBlockKey];
export type CultBlockPartyKey = keyof CultBlock;
export type BlockKey = keyof typeof blocks;
export type Block = typeof blocks[BlockKey];
export type BlockPartiesKey = keyof Block['parties'];
export type DistrictKey = keyof typeof districts;
export type KickbackDetailKey = keyof typeof kickbacks.details;
export type KickbackDetail = typeof kickbacks.details[KickbackDetailKey];
export type KickbackDistrictKey = keyof typeof kickbacks.not_runs.districts;
export type KickbackBlockKey = keyof typeof kickbacks.not_runs.blocks;
export type KickbackCandidateKey = keyof typeof kickbacks.candidates;
export type DistrictName = typeof textDistrictNames[number];
export type DistrictFeature = typeof geojsonDistricts.features[number];
export type DistrictProperties = DistrictFeature['properties'];
export type BlockName = typeof textBlockNames[number];
export type BlockFeature = typeof geojsonBlocks.features[number];
export type BlockProperties = BlockFeature['properties'];

export const PARTY_IDS = Object.keys(parties).filter((p) => parties[p as PartyKey].block_candidate_count > 0).sort((a, b) => parties[b as PartyKey].block_candidate_count - parties[a as PartyKey].block_candidate_count);
