import { useState } from 'react';

import { AboutPanel } from './components/AboutPanel';
import { Map } from './components/Map';

function App() {
    const [showAboutPanel, setShowAboutPanel] = useState(false);

    return (
        <div id="app" className="overscroll-none w-svw h-svh flex">
            <main>
                <Map />
                <div
                    className="absolute top-0 right-0 p-4 opacity-50 cursor-pointer"
                    onClick={() => setShowAboutPanel(true)}
                >
                    <h2 className="text-md font-bold text-gray-900 tracking-tight">衆院選2024候補者マップ</h2>
                </div>
                <AboutPanel showAboutPanel={showAboutPanel} setShowAboutPanel={setShowAboutPanel} />
            </main>
        </div>
    );
}

export default App;