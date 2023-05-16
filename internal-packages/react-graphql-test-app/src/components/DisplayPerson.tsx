import { useQuery } from '@data-eden/react';
import { gql } from '@data-eden/codegen';
import {
  type PersonQuery,
  type PersonFieldsFragment,
  type PersonQueryVariables,
} from './__generated/DisplayPerson.graphql.js';
import DisplayCar from './DisplayCar';
import DisplayPet from './DisplayPet';

export interface Person {
  id: string;
  name: string;
  pets: Array<Pet>;
  car: Car;
}

export interface Pet {
  id: string;
  name: string;
}

export interface Car {
  id: string;
  make: string;
  model: string;
}

const PersonFieldsFragment = graphql<PersonFieldsFragment>`
  fragment PersonFields on Person {
    id
    __typename
    name
  }
`;

const PersonQuery = gql<PersonQuery, PersonQueryVariables>`
  query Person($id: ID!) {
    person(id: $id) {
      ${PersonFieldsFragment}
      car {
        id
        __typename
        make
        model
      }
      pets {
        id
        __typename
        name
        owner {
          ${PersonFieldsFragment}
        }
      }
    }
  }
`;

const DisplayPets = ({ pets }: { pets: Array<Pet> }) => {
  return (
    <div className="border-2 rounded border-green-500 border-solid my-2 mx-2">
      <p className="text-lg font-bold text-green-500">
        Display Pets List Component
      </p>
      <ul>
        {pets.map((pet, idx) => {
          if (idx === 0) {
            // @ts-ignore
            window.petId = pet.id;
          }
          return <DisplayPet key={pet.id} pet={pet} />;
        })}
      </ul>
    </div>
  );
};

export default function DisplayPerson() {
  const { loading, data } = useQuery(PersonQuery, {
    id: '1',
  });

  const person = data?.person;

  return (
    <div className="border-2 rounded border-blue-500 border-solid my-2 mx-2">
      <h1 className="text-lg font-bold text-blue-500">Display Person 1</h1>
      {loading && <span>Loading...</span>}
      {person && (
        <div>
          <div>Name: {person.name}</div>
          <DisplayCar car={person.car} />
          <br />
          <div>Pets:</div>
          <DisplayPets pets={person.pets} />
        </div>
      )}
    </div>
  );
}
