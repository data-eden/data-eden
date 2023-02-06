import { useQuery } from '@data-eden/react';
import DisplayCar from '../components/DisplayCar';
import DisplayPerson from '../components/DisplayPerson';
import UpdateCar from '../components/UpdateCar';
import { CarDocument } from '../__generated__/graphql';

function QueryCar() {
  const { data, loading } = useQuery(CarDocument, { id: '1' });

  return (
    <div>
      {loading && <div>Loading...</div>}
      {data && <DisplayCar car={data.car} />}
    </div>
  );
}

export default function Unrelated() {
  return (
    <div>
      <DisplayPerson />
      <QueryCar />
      <UpdateCar />
    </div>
  );
}
