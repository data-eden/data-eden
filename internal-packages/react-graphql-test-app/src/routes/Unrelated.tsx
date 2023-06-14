import { useQuery } from '@data-eden/react';
import { gql } from '@data-eden/codegen/gql';
import DisplayCar from '../components/DisplayCar';
import DisplayPerson from '../components/DisplayPerson';
import UpdateCar from '../components/UpdateCar';
import type {
  CarQuery,
  CarQueryVariables,
} from './__generated/Unrelated.graphql';

const CarQuery = gql<CarQuery, CarQueryVariables>`
  query Car($id: ID!) {
    car(id: $id) {
      id
      __typename
      make
      model
      owner {
        ... on Person {
          id
        }
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
