import { CollisionFilterExtension, type CollisionFilterExtensionProps } from '@deck.gl/extensions';
import { BitmapLayer, IconLayer, TextLayer } from '@deck.gl/layers';
import { Color, DeckGL, GeoJsonLayer, Layer, MapView, MapViewState, TileLayer } from 'deck.gl';
import type { Feature, Geometry } from 'geojson';
import { useCallback, useEffect, useState } from 'react';
import { isTouchDevice, SCREEN_ORIENTATION_TYPE } from '.';
import { BlockKey, BlockName, BlockProperties, blocks, CandidateKey, candidates, DistrictKey, DistrictName, DistrictProperties, districts, geojsonBlocks, geojsonDistricts, iconBlockKickbacks, iconDistrictKickbacks, parties, PartyKey, ResultDistrictKey, results, survey, SurveyCandidateKey, SurveyQuestionKey, textBlockNames, textDistrictNames } from '../data';
import { BlockFull, BlockSmall, DistrictFull, DistrictSmall, Sheet, SheetSize } from './Sheets';

const createBlockColors = (colors: [string, number, number, number][]): Record<string, { fillColor: Color, borderColor: Color, backgroundColor: Color, fontColor: Color }> => colors.reduce((acc, [key, r, g, b]) => {
    acc[key] = {
        fillColor: [r, g, b, 0x1f],
        borderColor: [r, g, b, 0xff],
        backgroundColor: [Math.min(255, 128 + r), Math.min(255, 128 + g), Math.min(255, 128 + b), 0x7f],
        fontColor: [r / 1.7 | 0, g / 1.7 | 0, b / 1.7 | 0, 0xff]
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

const getFillColor = (f: Feature<Geometry, BlockProperties | DistrictProperties>) => BLOCK_COLORS[f.properties.bid].fillColor;
const getLineColor = (f: Feature<Geometry, BlockProperties | DistrictProperties>) => BLOCK_COLORS[f.properties.bid].borderColor;


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

const toColor = (c: number) => [(c >> 16) & 0xff, (c >> 8) & 0xff, c & 0xff, 128] as Color;

const palletChoice3 = [
    0x2563eb,
    0xdc2626,
    0xd1d5db,
].map(toColor);

const palletChoice4 = [
    0x2563eb,
    0xf9fafb,
    0xdc2626,
    0xd1d5db,
].map(toColor);

const palletChoice5 = [
    0x2563eb,
    0x93c5fd,
    0xfca5a5,
    0xdc2626,
    0xd1d5db,
].map(toColor);

const palletChoice6 = [
    0x6929c4,
    0x1192e8,
    0x005d5d,
    0x9f1853,
    0xfa4d56,
    0xd1d5db,
].map(toColor);

const colorPalette = [
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
            className={`fixed top-0 left-0 w-svw md:w-96 h-svh p-4 overflow-y-auto transition-transform bg-white border-r border-gray-200 rounded-lg ${openDrawer ? "transform-none" : "-translate-y-full"}`}
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

export function Map() {
    const fontSize = 32;

    const [viewState, setViewState] = useState<MapViewState>(INITIAL_VIEW_STATE);
    const [blockId, setBlockId] = useState<BlockKey | null>(null);
    const [blockSheetSize, setBlockSheetSize] = useState<SheetSize>(SheetSize.Hidden);
    const [districtId, setDistrictId] = useState<DistrictKey | null>(null);
    const [districtSheetSize, setDistrictSheetSize] = useState<SheetSize>(SheetSize.Hidden);
    const [viewData, setViewData] = useState<ViewData>(viewDatas["party"]);

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
            getFillColor: d=> [0, 0, 0, 0],
            getLineColor: getLineColor,
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
    </>;
}
