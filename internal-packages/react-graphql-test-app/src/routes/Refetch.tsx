import { useQuery } from '@data-eden/react';
import DisplayCar from '../components/DisplayCar';
import { carQuery } from './QueryEffect';
import { useState } from 'react';

export default function Refetch() {
  const { data, loading, refetch } = useQuery(carQuery, { id: '1' });

  const [shouldReload, setShouldReload] = useState(false);

  const handleReloadToggle = () => {
    setShouldReload(!shouldReload);
  };

  return (
    <>
      <div className="ml-2">
        <button
          type="button"
          className="px-2 py-1 font-semibold text-sm bg-slate-500 text-white rounded-md shadow-sm opacity-100"
          onClick={() => {
            refetch(
              { id: '1' },
              {
                reload: shouldReload,
              }
            );
          }}
        >
          Refetch
        </button>
        <label className="font-bold ml-2">
          <input
            type="checkbox"
            name="reload"
            id="reload"
            checked={shouldReload}
            onChange={handleReloadToggle}
          />

          <span className="ml-2 text-sm">
            Should reload? {shouldReload.toString()}
          </span>
        </label>
      </div>

      {loading && <div>Loading...</div>}

      {data && (
        <div>
          <DisplayCar car={data.car} />
        </div>
      )}
    </>
  );
}
