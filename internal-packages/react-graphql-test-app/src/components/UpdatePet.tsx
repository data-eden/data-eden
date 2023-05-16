import { useMutation } from '@data-eden/react';
import { gql } from '@data-eden/codegen';
import { useState } from 'react';
import type {
  UpdatePetMutation,
  UpdatePetMutationVariables,
} from './__generated/UpdatePet.graphql.js';

const UpdatePetMutation = gql<UpdatePetMutation, UpdatePetMutationVariables>`
  mutation UpdatePet($petId: ID!, $input: UpdatePetInput!) {
    updatePet(petId: $petId, input: $input) {
      id
      __typename
      name
    }
  }
`;

export default function UpdatePet() {
  const [inputValue, setInputValue] = useState('');

  const { execute } = useMutation(UpdatePetMutation);

  function handleInputChange(e: React.FormEvent<HTMLInputElement>) {
    setInputValue(e.currentTarget.value);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void execute({
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      petId: window.petId as string,
      input: { name: inputValue },
    }).then(() => {
      setInputValue('');
    });
  }

  return (
    <div className="border-2 rounded border-amber-600 border-solid my-2 mx-2">
      <h1 className="text-lg font-bold text-amber-600">Update Pet 1</h1>
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
