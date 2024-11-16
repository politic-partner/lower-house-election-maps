import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryParamProvider } from 'use-query-params';
import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6';

import App from './App';
import './index.css';


const container = document.getElementById('root');
const root = createRoot(container!);

root.render(
    <React.StrictMode>
        <BrowserRouter>
            <QueryParamProvider adapter={ReactRouter6Adapter}>
                <App />
            </QueryParamProvider>
        </BrowserRouter>
    </React.StrictMode>
);