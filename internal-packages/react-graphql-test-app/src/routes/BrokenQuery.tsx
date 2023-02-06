import { useQuery } from '@data-eden/react';
import BadQuery from '../graphql/queries/BadQuery.graphql';

export default function BrokenQuery() {
  const { error } = useQuery(BadQuery, { id: '1' });

  if (error) {
    return <div>{JSON.stringify(error)}</div>;
  }

  return <div>Bad Query</div>;
}
