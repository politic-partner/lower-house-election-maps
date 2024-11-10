import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { AboutPanel } from './components/AboutPanel';
import { Map } from './components/Map';
import { SheetSize } from './components/Sheets';
import { BlockKey, DistrictKey } from './data';

function App() {
    const [showAboutPanel, setShowAboutPanel] = useState(false);
    const [searchParams] = useSearchParams();
    const districtId = searchParams.get('did') as DistrictKey | null;
    const blockId = searchParams.get('bid') as BlockKey | null;
    const pos = searchParams.get('pos');
    let latitude: number | null = null;
    let longitude: number | null = null;
    if (pos) {
        const [lat, lng] = pos.split(' ').map(Number);
        latitude = isNaN(lat) ? null : lat;
        longitude = isNaN(lng) ? null : lng;
    }
    const zoom = parseFloat(searchParams.get('zoom') || '') || null;
    const sheetSizeParam = searchParams.get('sheetSize');
    let sheetSize: SheetSize;
    switch (sheetSizeParam) {
        case 'Full':
            sheetSize = SheetSize.Full;
            break;
        case 'Small':
            sheetSize = SheetSize.Small;
            break;
        default:
            sheetSize = SheetSize.Hidden;
    }

    return (
        <div id="app" className="overscroll-none w-svw h-svh flex">
            <main>
                <Map districtId={districtId} blockId={blockId} latitude={latitude} longitude={longitude} zoom={zoom} sheetSize={sheetSize} />
                <button
                    className="absolute top-0 right-0 z-1 p-4 opacity-50"
                    onClick={() => setShowAboutPanel(true)}
                    type="button"
                >
                    <h2 className="text-md font-bold text-gray-900 tracking-tight">衆院選2024候補者マップ</h2>
                </button>
                <AboutPanel showAboutPanel={showAboutPanel} setShowAboutPanel={setShowAboutPanel} />
            </main>
        </div>
    );
}

export default App;