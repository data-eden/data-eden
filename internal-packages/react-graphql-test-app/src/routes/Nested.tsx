/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import DisplayPerson from '../components/DisplayPerson';
import UpdatePerson from '../components/UpdatePerson';
import AddPet from '../components/AddPet';
import UpdateCar from '../components/UpdateCar';
import UpdatePet from '../components/UpdatePet';
function App() {
  return (
    <div className="mx-6">
      <DisplayPerson />
      <UpdatePerson />
      <UpdatePet />
      <UpdateCar />
      <AddPet />
    </div>
  );
}

export default App;
