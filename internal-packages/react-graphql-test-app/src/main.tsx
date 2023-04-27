/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { AthenaProvider, createClient } from '@data-eden/react';
import { buildFetch } from '@data-eden/network';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Nested from './routes/Nested';
import Unrelated from './routes/Unrelated';
import BrokenQuery from './routes/BrokenQuery';
import QueryEffect from './routes/QueryEffect';
import MutationResult from './routes/MutationResult';

interface Entity {
  __typename: string;
  id: string;
}

export const client = createClient({
  url: 'http://localhost:4000/graphql',
  id: (v: Entity) => `${v.__typename}:${v.id}`,
  fetch: buildFetch([]),
});

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '/nested',
        element: <Nested />,
      },
      {
        path: '/broken-query',
        element: <BrokenQuery />,
      },
      {
        path: '/unrelated-queries',
        element: <Unrelated />,
      },
      {
        path: '/query-effect',
        element: <QueryEffect />,
      },
      {
        path: '/mutation-result',
        element: <MutationResult />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AthenaProvider value={client}>
      <RouterProvider router={router} />
    </AthenaProvider>
  </React.StrictMode>
);
