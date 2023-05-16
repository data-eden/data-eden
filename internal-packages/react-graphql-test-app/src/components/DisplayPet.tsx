import { useMutation } from '@data-eden/react';
import { Pet } from './DisplayPerson';
import { gql } from '@data-eden/codegen';
import type {
  RemovePetMutation,
  RemovePetMutationVariables,
} from './__generated/DisplayPet.graphql';

const RemovePetMutation = gql<RemovePetMutation, RemovePetMutationVariables>`
  mutation RemovePet($id: ID!) {
    removePet(id: $id) {
      id
      __typename
      name
      owner {
        id
        __typename
        pets {
          id
          __typename
          name
          owner {
            id
            __typename
            name
            pets {
              id
              __typename
              name
              owner {
                id
                __typename
                name
              }
            }
          }
        }
      }
    }
  }
`;

export default function DisplayPet({ pet }: { pet: Pet }) {
  const { execute } = useMutation(RemovePetMutation);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    void execute({
      id: pet.id,
    });
  };

  return (
    <li className="border-2 rounded border-red-500 border-solid my-2 mx-2">
      <p className="text-lg font-bold text-red-500">Display Pet Component</p>
      <span>{pet.name}</span>
      <span> </span>

      <button type="button" onClick={handleClick}>
        DELETE
      </button>
    </li>
  );
}
