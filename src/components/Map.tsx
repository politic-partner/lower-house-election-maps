import { CollisionFilterExtension, type CollisionFilterExtensionProps } from '@deck.gl/extensions';
import { BitmapLayer, IconLayer, TextLayer } from '@deck.gl/layers';
import { Color, DeckGL, GeoJsonLayer, Layer, MapView, MapViewState, TileLayer } from 'deck.gl';
import type { Feature, Geometry } from 'geojson';
import { useCallback, useState } from 'react';
import { isTouchDevice, SCREEN_ORIENTATION_TYPE } from '.';
import { BlockKey, BlockName, BlockProperties, blocks, DistrictKey, DistrictName, DistrictProperties, districts, geojsonBlocks, geojsonDistricts, iconBlockKickbacks, iconDistrictKickbacks, textBlockNames, textDistrictNames } from '../data';
import { BlockFull, BlockSmall, DistrictFull, DistrictSmall, Sheet, SheetSize } from './Sheets';

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


export function Map() {
    const fontSize = 32;

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
            getFillColor: getFillColor,
            getLineColor: getLineColor,
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
            getFillColor: getFillColor,
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

    return <>
        <DeckGL
            layers={layers}
            views={new MapView()}
            viewState={viewState}
            controller={{ doubleClickZoom: true }}
            onViewStateChange={onViewStateChange}
        />
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
