import { useMutation } from '@data-eden/react';
import { gql } from '@data-eden/codegen';
import { useState } from 'react';

import type {
  UpdatePersonMutation,
  UpdatePersonMutationVariables,
} from './__generated/UpdatePerson.graphql';

const UpdatePersonMutation = gql<
  UpdatePersonMutation,
  UpdatePersonMutationVariables
>`
  mutation UpdatePerson($personId: ID!, $input: PersonInput!) {
    updatePerson(personId: $personId, input: $input) {
      id
      name
    }
  }
`;

export default function UpdatePerson() {
  const [inputValue, setInputValue] = useState('');

  const { execute } = useMutation(UpdatePersonMutation);

  function handleInputChange(e: React.FormEvent<HTMLInputElement>) {
    setInputValue(e.currentTarget.value);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    execute({
      personId: '1',
      input: { name: inputValue },
    }).then(() => {
      setInputValue('');
    });
  }

  return (
    <div className="border-2 rounded border-violet-500 border-solid my-2 mx-2">
      <h1 className="text-lg font-bold text-violet-800">Update Person 1</h1>
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
