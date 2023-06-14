import { useQuery } from '@data-eden/react';
import { gql } from '@data-eden/codegen/gql';
import DisplayCar from '../components/DisplayCar';
import { useState } from 'react';
import type {
  CarQuery,
  CarQueryVariables,
} from './__generated/QueryEffect.graphql';

export const CarQuery = gql<CarQuery, CarQueryVariables>`
  query Car($id: ID!) {
    car(id: $id) {
      id
      __typename
      make
      model
      owner {
        ... on Person {
          id
          __typename
        }
      }
    }
  }
`;

function QueryCar({ carId }: { carId: string }) {
  console.log('carId', carId);
  const { data } = useQuery(CarQuery, { id: carId });

  if (data) {
    console.log('data', data);
    return <DisplayCar car={data.car} />;
  } else {
    return <div>Loading...</div>;
  }
}

export default function QueryEffect() {
  const [carId, setCarId] = useState('1');

  function toggleCarId() {
    if (carId === '1') {
      setCarId('2');
    } else {
      setCarId('1');
    }
  }

  return (
    <>
      <div className="ml-2">
        <button
          type="button"
          className="px-2 py-1 font-semibold text-sm bg-slate-500 text-white rounded-md shadow-sm opacity-100"
          onClick={toggleCarId}
        >
          Toggle CarId
        </button>
        <span className="pl-4">Car Id: {carId}</span>
      </div>
      <QueryCar carId={carId} />
    </>
  );
}
