import { graphql, useQuery } from '@data-eden/react';
import DisplayCar from '../components/DisplayCar';
import DisplayPerson from '../components/DisplayPerson';
import UpdateCar from '../components/UpdateCar';
import type {
  CarQuery,
  CarQueryVariables,
} from './__generated/Unrelated.graphql';

const CarQuery = graphql<CarQuery, CarQueryVariables>`
  query Car($id: ID!) {
    car(id: $id) {
      id
      __typename
      make
      model
      owner {
        id
      }
    }
  }
`;

function QueryCar() {
  const { data, loading } = useQuery(CarQuery, { id: '1' });

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
