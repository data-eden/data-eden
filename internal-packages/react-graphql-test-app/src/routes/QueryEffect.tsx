import { useQuery } from '@data-eden/react';
import DisplayCar from '../components/DisplayCar';
import { Car } from '../components/DisplayPerson';
import { CarDocument } from '../graphql/queries/Car.graphql.js';
import { useState } from 'react';

function QueryCar({ carId }: { carId: string }) {
  console.log('carId', carId);
  const { data } = useQuery<{ car: Car }>(CarDocument, { id: carId });

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
