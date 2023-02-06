import { type Car } from './DisplayPerson';

export default function DisplayCar({ car }: { car: Car }) {
  return (
    <div className="border-2 rounded border-lime-700 border-solid my-2 mx-2">
      <p className="text-lg font-bold text-lime-700">Display Car Component</p>
      <p>
        Car: {car.make} {car.model}
      </p>
    </div>
  );
}
