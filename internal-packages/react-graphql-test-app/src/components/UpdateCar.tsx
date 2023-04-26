import { useMutation } from '@data-eden/react';
import { useState } from 'react';
import { UpdateCarDocument } from '../__generated__/graphql';

export default function UpdateCar() {
  const [makeValue, setMakeValue] = useState('');
  const [modelValue, setModelValue] = useState('');

  const { execute } = useMutation(UpdateCarDocument);

  function handleMakeChange(e: React.FormEvent<HTMLInputElement>) {
    setMakeValue(e.currentTarget.value);
  }

  function handleModelChange(e: React.FormEvent<HTMLInputElement>) {
    setModelValue(e.currentTarget.value);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const input: { make?: string; model?: string } = {};
    if (makeValue) {
      input.make = makeValue;
    }

    if (modelValue) {
      input.model = modelValue;
    }

    void execute({
      carId: '1',
      input,
    }).then(() => {
      setMakeValue('');
      setModelValue('');
    });
  }

  return (
    <div className="border-2 rounded border-fuchsia-600 border-solid my-2 mx-2">
      <h1 className="text-lg font-bold text-fuchsia-600">Update Car 1</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="make-input">Make</label>
        <input
          type="text"
          id="make-input"
          className="ml-1 border border-black rounded mr-1"
          value={makeValue}
          onChange={handleMakeChange}
        />
        <label htmlFor="model-input">Model</label>
        <input
          type="text"
          id="model-input"
          className="ml-1 border border-black rounded mr-1"
          value={modelValue}
          onChange={handleModelChange}
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
