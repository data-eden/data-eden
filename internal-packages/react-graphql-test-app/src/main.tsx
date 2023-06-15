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
import QueryEffect from './routes/QueryEffect';
import MutationResult from './routes/MutationResult';
import Refetch from './routes/Refetch';
import FetchMore from './routes/FetchMore';

interface Entity {
  __typename: string;
  id: string;
}

export const client = createClient({
  url: 'http://localhost:4000/graphql',
  getCacheKey: (v: Entity) => `${v.__typename}:${v.id}`,
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
      {
        path: '/refetch',
        element: <Refetch />,
      },
      {
        path: '/fetchMore',
        element: <FetchMore />,
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
