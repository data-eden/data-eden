import { NavLink, Outlet } from 'react-router-dom';

export default function App() {
  return (
    <div className="flex">
      <div className="w-1/6 flex flex-col items-center">
        <ul className="mt-10">
          <li className="pb-4">
            <NavLink to={'/nested'}>Nested</NavLink>
          </li>
          <li className="pb-4">
            <NavLink to={'/unrelated-queries'}>Unrelated Queries</NavLink>
          </li>
          <li className="pb-4">
            <NavLink to={'/query-effect'}>Query Effect</NavLink>
          </li>
          <li className="pb-4">
            <NavLink to={'/mutation-result'}>Mutation Result</NavLink>
          </li>
          <li className="pb-4">
            <NavLink to={'/refetch'}>Refetch</NavLink>
          </li>
        </ul>
      </div>
      <div className="flex-1 mt-10">
        <Outlet />
      </div>
    </div>
  );
}
