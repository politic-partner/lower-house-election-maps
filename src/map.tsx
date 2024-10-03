import React, { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { MapView } from '@deck.gl/core';
import { TileLayer } from '@deck.gl/geo-layers';
import { BitmapLayer, PathLayer } from '@deck.gl/layers';
import DeckGL from '@deck.gl/react';

import type { MapViewState, Position } from '@deck.gl/core';
import type { TileLayerPickingInfo } from '@deck.gl/geo-layers';
import { Layer, Viewport } from 'deck.gl';

const INITIAL_VIEW_STATE: MapViewState = {
    latitude: 36.2048,
    longitude: 138.2529,
    zoom: 5,
    maxZoom: 16,
    minZoom: 5,
    maxPitch: 45,
    bearing: 0
};

const COPYRIGHT_LICENSE_STYLE: React.CSSProperties = {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: 'hsla(0,0%,100%,.5)',
    padding: '0 5px',
    font: '12px/20px Helvetica Neue,Arial,Helvetica,sans-serif'
};

const LINK_STYLE: React.CSSProperties = {
    textDecoration: 'none',
    color: 'rgba(0,0,0,.75)',
    cursor: 'grab'
};

/* global window */
const devicePixelRatio = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;

function getTooltip(info: TileLayerPickingInfo & { color: Uint8Array | null; layer: Layer<{}> | null; sourceLayer?: Layer<{}> | null; viewport?: Viewport; index: number; x: number; y: number; z: number; pixelRatio: number; sourceTile: any; sourceTileSubLayer: Layer<{}> }) {
    const { tile } = info;
    if (tile) {
        const { x, y, z } = tile.index;
        return `tile: x: ${x}, y: ${y}, z: ${z}`;
    }
    return null;
}

export default function App({
    showBorder = false,
    onTilesLoad
}: {
    showBorder?: boolean;
    onTilesLoad?: () => void;
}) {
    const tileLayer = new TileLayer<ImageBitmap>({
        // https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#Tile_servers
        // data: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        data: ['https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png'],
        // data: ['http://tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png'],

        // Since these OSM tiles support HTTP/2, we can make many concurrent requests
        // and we aren't limited by the browser to a certain number per domain.
        maxRequests: 20,

        pickable: true,
        onViewportLoad: onTilesLoad,
        autoHighlight: showBorder,
        highlightColor: [60, 60, 60, 40],
        // https://wiki.openstreetmap.org/wiki/Zoom_levels
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
                }),
                showBorder &&
                new PathLayer<Position[]>({
                    id: `${props.id}-border`,
                    data: [
                        [
                            [west, north],
                            [west, south],
                            [east, south],
                            [east, north],
                            [west, north]
                        ]
                    ],
                    getPath: d => d,
                    getColor: [255, 0, 0],
                    widthMinPixels: 4
                })
            ];
        }
    });

    return (
        <DeckGL
            layers={[tileLayer]}
            views={new MapView({ repeat: true })}
            initialViewState={INITIAL_VIEW_STATE}
            controller={true}
        // getTooltip={getTooltip}
        >
            <div style={COPYRIGHT_LICENSE_STYLE}>
                {'© '}
                <a style={LINK_STYLE} href="https://maps.gsi.go.jp/development/ichiran.html" target="blank">
                    国土地理院
                </a>
            </div>
        </DeckGL>
    );
}

function InfoPanel({ title, children, sourceLink }) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <PanelContainer>
            <PanelTitle onClick={() => setIsExpanded(!isExpanded)}>
                <div>{title}</div>
                <PanelExpander $expanded={isExpanded}>{isExpanded ? '✕' : 'i'}</PanelExpander>
            </PanelTitle>
            <PanelContent $expanded={isExpanded}>{children}</PanelContent>
            <SourceLink $expanded={isExpanded} href={sourceLink} target="_new">
                View Code ↗
            </SourceLink>
        </PanelContainer>
    );
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>,
)