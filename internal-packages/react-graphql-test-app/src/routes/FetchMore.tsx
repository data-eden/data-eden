import { useState, useEffect } from 'react';
import { gql } from '@data-eden/codegen/gql';
import { useQuery } from '@data-eden/react';
import { PetsForAdoptionQuery } from './__generated/FetchMore.graphql';

const petsForAdoptionQuery = gql<PetsForAdoptionQuery>`
  query PetsForAdoption {
    petsForAdoption {
      __typename
      id
      pets {
        __typename
        id
        name
        owner {
          id
          name
        }
      }
    }
  }
`;

const BoxedItems = ({ items, rangesMap }: { items: any; rangesMap: any }) => {
  const sortedKeys = Object.keys(rangesMap).sort(
    (a, b) => parseInt(a, 10) - parseInt(b, 10)
  );

  const getRandomColor = () => {
    const hex = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += hex[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  const renderBox = (
    currentIndex: number,
    keyIndex: number,
    sortedKeys: Record<string, any>
  ) => {
    if (keyIndex >= sortedKeys.length) {
      return null;
    }

    const rangeEnd = parseInt(sortedKeys[keyIndex], 10);
    const requestNumber = rangesMap[sortedKeys[keyIndex]];

    // Select the items for this range
    const itemsInRange = items.slice(currentIndex, rangeEnd);

    // Generate a random color for the border
    const borderColor = getRandomColor();

    return (
      <div
        key={keyIndex}
        style={{
          border: `1px solid ${borderColor}`,
          marginBottom: '10px',
          padding: '10px',
        }}
      >
        <p>Request {requestNumber}</p>
        <ul>
          {itemsInRange.map((item: any) => (
            <li key={item.id}>
              {item.id} - {item.name}
            </li>
          ))}
        </ul>
        {renderBox(rangeEnd, keyIndex + 1, sortedKeys)}
      </div>
    );
  };

  return <div>{renderBox(0, 0, sortedKeys)}</div>;
};

export default function FetchMore() {
  const { data, loading, refetch, fetchMore } = useQuery(
    petsForAdoptionQuery,
    {},
    {
      lazy: true,
      initialData: {
        __typename: 'Query',
        petsForAdoption: {
          __typename: 'PetsForAdoption',
          id: '1234',
          pets: [
            {
              __typename: 'Pet',
              id: '1234567890',
              name: 'Doug',
              owner: {
                __typename: 'Person',
                id: '1',
                name: 'Chris',
              },
            },
          ],
        },
      },
    }
  );

  const [amountToRequest, setAmountToRequest] = useState<{
    [key: number]: number;
  }>({
    1: 1,
  });
  const [requestCount, setRequestCount] = useState(1);

  return (
    <>
      <div>
        <button
          type="button"
          className="px-2 py-1 font-semibold text-sm bg-slate-500 text-white rounded-md shadow-sm opacity-100"
          onClick={async () => {
            const currentRequest = requestCount + 1;
            setRequestCount(currentRequest);

            await fetchMore();

            if (
              data?.petsForAdoption?.pets &&
              data?.petsForAdoption?.pets?.length > 0
            ) {
              setAmountToRequest({
                ...amountToRequest,
                [data?.petsForAdoption?.pets.length]: currentRequest,
              });
            }
          }}
        >
          Fetch More
        </button>

        <button
          type="button"
          className="ml-2 px-2 py-1 font-semibold text-sm bg-slate-500 text-white rounded-md shadow-sm opacity-100"
          onClick={async () => {
            setRequestCount(0);

            await refetch(
              {},
              {
                reload: true,
              }
            );

            if (
              data?.petsForAdoption?.pets &&
              data?.petsForAdoption?.pets?.length > 0
            ) {
              setAmountToRequest({
                [data?.petsForAdoption?.pets.length]: 0,
              });
            }
          }}
        >
          Fresh Fetch
        </button>
      </div>

      {loading && <div>Loading...</div>}

      {data && data?.petsForAdoption?.pets?.length && (
        <>
          <div>{data?.petsForAdoption?.pets?.length}</div>
          <BoxedItems
            items={data?.petsForAdoption?.pets}
            rangesMap={amountToRequest}
          />
        </>
      )}
    </>
  );
}
