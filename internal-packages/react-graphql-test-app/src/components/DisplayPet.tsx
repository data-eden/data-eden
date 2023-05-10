import { useMutation } from '@data-eden/react';
import { Pet } from './DisplayPerson';
import { RemovePetDocument } from '../graphql/mutations/RemovePet.graphql.js';

export default function DisplayPet({ pet }: { pet: Pet }) {
  const { execute } = useMutation(RemovePetDocument);

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
