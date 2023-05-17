import { useMutation } from '@data-eden/react';
import { gql } from '@data-eden/codegen/gql';
import { useState } from 'react';

import type {
  CreatePetMutation,
  CreatePetMutationVariables,
} from './__generated/AddPet.graphql';

const CreatePetMutation = gql<CreatePetMutation, CreatePetMutationVariables>`
  mutation CreatePet($input: CreatePetInput!) {
    createPet(input: $input) {
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
    }
  }
`;

export default function AddPet() {
  const [inputValue, setInputValue] = useState('');

  const { execute } = useMutation(CreatePetMutation);

  function handleInputChange(e: React.FormEvent<HTMLInputElement>) {
    setInputValue(e.currentTarget.value);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void execute({
      input: { name: inputValue, personId: '1' },
    }).then(() => {
      console.log('after mutation execution');
      setInputValue('');
    });
  }

  return (
    <div className="border-2 rounded border-amber-600 border-solid my-2 mx-2">
      <h1 className="text-lg font-bold text-amber-600">Create New Pet</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          className="border border-black rounded mr-1"
          value={inputValue}
          onChange={handleInputChange}
        />
        <button
          type="submit"
          className="px-2 py-1 font-semibold text-sm bg-slate-500 text-white rounded-md shadow-sm opacity-100"
        >
          Submit
        </button>
      </form>
    </div>
  );
}
