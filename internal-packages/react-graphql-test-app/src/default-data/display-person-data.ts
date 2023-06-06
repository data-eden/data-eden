export default {
  data: {
    person: {
      __typename: 'Person',
      car: {
        __typename: 'Car',
        id: '1',
        make: 'Ford',
        model: 'Mustang',
      },
      pets: [
        {
          __typename: 'Pet',
          id: '660d1bf5-f600-42d8-8c2a-c44210e7589b',
          name: 'Hitch',
          owner: {
            __typename: 'Person',
            id: '1',
            name: 'Chris',
          },
        },
        {
          __typename: 'Pet',
          id: 'db391623-3748-435c-bebe-7c193e42390e',
          name: 'Dre',
          owner: {
            __typename: 'Person',
            id: '1',
            name: 'Chris',
          },
        },
      ],
      id: '1',
      name: 'Chris',
    },
  },
};
