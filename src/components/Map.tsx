import { CollisionFilterExtension, type CollisionFilterExtensionProps } from '@deck.gl/extensions';
import { BitmapLayer, IconLayer, TextLayer } from '@deck.gl/layers';
import { Color, DeckGL, GeoJsonLayer, Layer, MapView, MapViewState, TileLayer } from 'deck.gl';
import type { Feature, Geometry } from 'geojson';
import { useCallback, useEffect, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { encodeString, QueryParamConfig, useQueryParam } from 'use-query-params';
import { isTouchDevice, SCREEN_ORIENTATION_TYPE } from '.';
import { blockColors, colorPalette, palletChoice3, palletChoice4, palletChoice5, palletChoice6 } from '../colors';
import { BlockKey, BlockName, BlockProperties, blocks, CandidateKey, candidates, DistrictKey, DistrictName, DistrictProperties, districts, geojsonBlocks, geojsonDistricts, iconBlockKickbacks, iconDistrictKickbacks, parties, PartyKey, ResultDistrictKey, results, survey, SurveyCandidateKey, SurveyQuestionKey, textBlockNames, textDistrictNames } from '../data';
import { BlockFull, BlockSmall, DistrictFull, DistrictSmall, Sheet, SheetSize } from './Sheets';

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

// const getFillColor = (f: Feature<Geometry, BlockProperties | DistrictProperties>) => blockColors[f.properties.bid].fillColor;
const getLineColor = (f: Feature<Geometry, BlockProperties | DistrictProperties>) => blockColors[f.properties.bid].borderColor;


type DistrictToColor = (districtId: DistrictKey) => Color;
type ViewData = {
    id: string;
    districtToColor: DistrictToColor;
    palette?: Color[];
}

const getAnswer = (districtId: string, questionId: string) => {
    const districtResult = results.districts[districtId as ResultDistrictKey];
    const wonCandidateId = districtResult.won_cid as SurveyCandidateKey;
    return survey.candidates[wonCandidateId].a[questionId as SurveyQuestionKey];
}

const toViewData = (id: string, palette: Color[]) => [id, {
    id: id,
    districtToColor: (districtId: DistrictKey) => palette[getAnswer(districtId, id)],
    palette: palette,
}];

const viewDatas: { [key: string]: ViewData } = Object.fromEntries([
    ["party", {
        id: "party",
        districtToColor: (districtId: string) => {
            const districtResult = results.districts[districtId as ResultDistrictKey];
            return [...parties[candidates[districtResult.won_cid as CandidateKey].pid as PartyKey].rgb, (districtResult.won_rate * 255) | 0] as Color
        },
        palette: null,
    }],
    toViewData("0", colorPalette),
    toViewData("1", palletChoice5),
    toViewData("2", palletChoice3),
    toViewData("3", palletChoice3),
    toViewData("4", colorPalette),
    toViewData("5", palletChoice3),
    toViewData("6", palletChoice3),
    toViewData("7", palletChoice6),
    toViewData("8", palletChoice4),
    toViewData("9", palletChoice6),
    toViewData("10", palletChoice6),
    toViewData("11", palletChoice3),
    toViewData("12", palletChoice5),
    toViewData("13", palletChoice3),
    toViewData("14", palletChoice3),
    toViewData("15", palletChoice3),
    toViewData("16", palletChoice3),
    toViewData("17", palletChoice3),
    toViewData("18", palletChoice3),
    toViewData("19", palletChoice3),
    toViewData("20", palletChoice5),
    toViewData("21", palletChoice5),
    toViewData("22", palletChoice3),
    toViewData("23", palletChoice3),
    toViewData("24", palletChoice3),
]);

function FocusPanel({ viewData, setViewData }: { viewData: ViewData, setViewData: (viewData: ViewData) => void }) {
    const [openDrawer, setOpenDrawer] = useState(false);
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setViewData(viewDatas[event.target.id]);
    };
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setOpenDrawer(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const question = survey.questions[viewData.id as SurveyQuestionKey]
    const title = question?.title || "政党";

    return <>
        <div className="absolute top-0 left-0 w-svw md:w-96 p-4 ">
            <button
                className="w-full text-gray-600 bg-white bg-opacity-80 hover:bg-gray-200 border border-grey-200 whitespace-nowrap focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mb-2 focus:outline-none"
                onClick={() => setOpenDrawer(!openDrawer)}
                type="button"
            >
                <h5 className="text-xl font-bold tracking-tight text-gray-900">{title}</h5>
                {question && <div className="flex flex-wrap gap-1">
                    {question.selects.map((select, index) => {
                        const palette = viewData.palette![index];
                        return <span key={index} className="text-xs text-gray-500 mr-1">
                            <span style={{ backgroundColor: `rgb(${palette[0]},${palette[1]},${palette[2]})` }} className="inline-block h-2 w-2 mr-0.5" />
                            {select}
                        </span>;
                    })}
                </div>}
            </button>
        </div>
        <div
            className={`z-20 fixed top-0 left-0 w-svw md:w-96 h-svh p-4 overflow-y-auto transition-transform bg-white border-r border-gray-200 rounded-lg ${openDrawer ? "transform-none" : "-translate-y-full"}`}
            tabIndex={-1}
        >
            <button
                className="w-full text-gray-600 bg-white bg-opacity-80 border border-grey-200 whitespace-nowrap font-medium rounded-lg text-sm px-5 py-2.5 mb-2"
                onClick={() => setOpenDrawer(!openDrawer)}
                type="button"
            >
                <h5 className="text-xl font-bold tracking-tight text-gray-900">{title}</h5>
            </button>
            <div className="flex flex-wrap gap-1">
                <label>
                    <input type="radio" id={"party"} name="view-data" className="hidden peer" checked={viewData.id === "party"} onChange={handleChange} />
                    <span className="text-xs font-medium px-2.5 py-0.5 text-gray-500 bg-white border border-gray-200 rounded-lg cursor-pointer peer-checked:border-blue-600 peer-checked:text-blue-600 hover:text-gray-600 hover:bg-gray-100">政党</span>
                </label>
                {Object.values(survey.questions).map((question, index) => <label key={index}>
                    <input type="radio" id={question.id} name="view-data" className="hidden peer" checked={viewData.id === question.id} onChange={handleChange} />
                    <span className="text-xs font-medium px-2.5 py-0.5 text-gray-500 bg-white border border-gray-200 rounded-lg cursor-pointer peer-checked:border-blue-600 peer-checked:text-blue-600 hover:text-gray-600 hover:bg-gray-100">{question.title}</span>
                </label>)}
            </div>
        </div>
    </>;
}

const DistrictParam: QueryParamConfig<DistrictKey | null, DistrictKey | null> = {
    encode: encodeString,
    decode: (v) => v === null ? null : v as DistrictKey,
};
const BlockParam: QueryParamConfig<BlockKey | null, BlockKey | null> = {
    encode: encodeString,
    decode: (v) => v === null ? null : v as BlockKey,
};
const SheetSizeParam: QueryParamConfig<SheetSize, SheetSize> = {
    encode: (v) => SheetSize[v],
    decode: (v) => v ? SheetSize[v as keyof typeof SheetSize] : SheetSize.Hidden,
};
const PosPraram: QueryParamConfig<number[], number[]> = {
    encode: (v) => v.map(d => d.toFixed(3)).join(' '),
    decode: (v) => typeof v === 'string' ? v.split(' ').map(Number) : [INITIAL_VIEW_STATE.latitude, INITIAL_VIEW_STATE.longitude, INITIAL_VIEW_STATE.zoom],
};
const ViewDataParam: QueryParamConfig<ViewData, ViewData> = {
    encode: (v) => v.id,
    decode: (v) => typeof v === 'string' ? viewDatas[v] : viewDatas["party"],
};

export function Map() {
    const fontSize = 32;

    const [districtId, setDistrictId] = useQueryParam('did', DistrictParam);
    const [blockId, setBlockId] = useQueryParam('bid', BlockParam);
    const [pos, setPos] = useQueryParam('pos', PosPraram);
    const [sheetSize, setSheetSize] = useQueryParam('sheetSize', SheetSizeParam);

    const [viewState, setViewState] = useState<MapViewState>({
        latitude: pos[0] || INITIAL_VIEW_STATE.latitude,
        longitude: pos[1] || INITIAL_VIEW_STATE.longitude,
        zoom: pos[2] || INITIAL_VIEW_STATE.zoom,
        maxZoom: INITIAL_VIEW_STATE.maxZoom,
        minZoom: INITIAL_VIEW_STATE.minZoom,
        maxPitch: INITIAL_VIEW_STATE.maxPitch,
        pitch: INITIAL_VIEW_STATE.pitch,
        bearing: INITIAL_VIEW_STATE.bearing,
        transitionDuration: INITIAL_VIEW_STATE.transitionDuration,
    });

    const [viewData, setViewData] = useQueryParam('viewData', ViewDataParam);
    const debouncedSetPos = useDebouncedCallback(setPos, 500);

    const onViewStateChange = useCallback(({ viewState }: { viewState: MapViewState }) => {
        setViewState(viewState);
        debouncedSetPos([viewState.latitude, viewState.longitude, viewState.zoom]);
    }, []);

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
            visible: true,
            stroked: true,
            filled: true,
            pickable: zoom >= 6,
            getFillColor: d => viewData.districtToColor(d.properties.did as DistrictKey),
            getLineColor: d => viewDatas["party"].districtToColor(d.properties.did as DistrictKey),
            getLineWidth: (f: Feature<Geometry, DistrictProperties>) => (districtId === f.properties.did) ? districtLineWidth * 2 : districtLineWidth,
            lineWidthUnits: 'pixels',
            onHover: ({ object }) => {
                if (object) {
                    setDistrictId(object.properties.did as DistrictKey);
                    setBlockId(object.properties.bid as BlockKey);
                    setSheetSize(SheetSize.Small);
                } else {
                    setSheetSize(SheetSize.Hidden);
                }
            },
            onClick: ({ object }) => {
                if (isTouchDevice) return;
                setDistrictId(object?.properties.did as DistrictKey);
                setBlockId(object?.properties.bid as BlockKey);
                setSheetSize(SheetSize.Full);
            },
            onTouchStart: ({ object }: { object: Feature<Geometry, DistrictProperties> | null }) => {
                setDistrictId(object?.properties.did as DistrictKey);
                setBlockId(object?.properties.bid as BlockKey);
                setSheetSize(SheetSize.Full);
            },
            updateTriggers: {
                getLineWidth: [districtId, districtLineWidth],
                getFillColor: [viewData.id],
                pickable: [zoom],
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
            getFillColor: [0, 0, 0, 0],
            getLineColor: getLineColor,
            getLineWidth: (f: Feature<Geometry, BlockProperties>) => (blockId === f.properties.bid) ? districtLineWidth * 2 : districtLineWidth,
            lineWidthUnits: 'pixels',
            onHover: ({ object }) => {
                if (object) {
                    setBlockId(object.properties.bid as BlockKey);
                    setSheetSize(SheetSize.Small);
                } else {
                    setSheetSize(SheetSize.Hidden);
                }
            },
            onClick: ({ object }) => {
                if (isTouchDevice) return;
                setDistrictId(object?.properties.did as DistrictKey);
                setBlockId(object?.properties.bid as BlockKey);
                setSheetSize(SheetSize.Full);
            },
            onTouchStart: ({ object }: { object: Feature<Geometry, DistrictProperties> | null }) => {
                setDistrictId(object?.properties.did as DistrictKey);
                setBlockId(object?.properties.bid as BlockKey);
                setSheetSize(SheetSize.Full);
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
            getColor: d => blockColors[d.b].fontColor,
            getSize: d => Math.pow(d.a, 0.25),
            sizeScale: fontSize,
            sizeMaxPixels,
            sizeMinPixels,
            background: true,
            getBackgroundColor: d => blockColors[d.b].backgroundColor,
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
            visible: zoom >= 7,
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
            visible: false,
            characterSet: 'auto',
            fontSettings: {
                buffer: 8
            },

            // TextLayer options
            getText: d => blocks[d.b as keyof typeof blocks].name,
            getPosition: d => [d.p[0], d.p[1], d.a * 2000],
            getColor: d => blockColors[d.b].fontColor,
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
            visible: false,
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

    return <>
        <DeckGL
            layers={layers}
            views={new MapView()}
            viewState={viewState}
            controller={{ doubleClickZoom: true }}
            onViewStateChange={onViewStateChange}
        />
        <FocusPanel viewData={viewData} setViewData={setViewData} />
        {viewState.zoom >= 6 ? (
            <Sheet size={sheetSize} smallHeight="h-36" isBlockScale={!isBlockScale}>
                {districtId && (sheetSize === SheetSize.Full
                    ? <DistrictFull districtId={districtId} setSheetSize={setSheetSize} />
                    : <DistrictSmall districtId={districtId} setSheetSize={setSheetSize} />
                )}
            </Sheet>
        ) : (
            <Sheet size={sheetSize} smallHeight="h-20" isBlockScale={isBlockScale}>
                {blockId && (sheetSize === SheetSize.Full
                    ? <BlockFull blockId={blockId} setSheetSize={setSheetSize} />
                    : <BlockSmall blockId={blockId} setSheetSize={setSheetSize} />
                )}
            </Sheet>
        )}
    </>;
}
