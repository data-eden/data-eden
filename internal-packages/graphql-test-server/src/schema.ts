import { faker } from '@faker-js/faker';
import { createSchema } from 'graphql-yoga';
import { v4 } from 'uuid';

const cars = [
  {
    id: '1',
    make: 'Ford',
    model: 'Mustang',
    personId: '1',
  },
  {
    id: '2',
    make: 'Audi',
    model: 'Q5',
    personId: '1',
  },
];

const pets = [
  {
    id: v4(),
    name: 'Hitch',
    personId: '1',
  },
  {
    id: v4(),
    name: 'Dre',
    personId: '1',
  },
];

const people = [
  {
    id: '1',
    name: 'Chris',
  },
];

const gqlSchema = `
  type Person {
    id: ID!
    name: String!
    car: Car!
    pets: [Pet!]!
  }

  input PersonInput {
    name: String!
  }

  type Car {
    id: ID!
    make: String!
    model: String!
    owner: Person!
  }

  input CarInput {
    make: String
    model: String
  }

  type Pet {
    id: ID!
    name: String!
    owner: Person!
  }

  input UpdatePetInput {
    name: String!
  }

  input CreatePetInput {
    name: String!
    personId: ID!
  }

  input RemovePetInput {
    id: ID!
    personId: ID!
  }

  type Query {
    person(id: ID!): Person!
    car(id: ID!): Car!
    people: [Person!]!
    petsForAdoption: [Pet!]!
  }

  type Mutation {
    updatePerson(personId: ID!, input: PersonInput!): Person!
    updateCar(carId: ID!, input: CarInput!): Car!
    updatePet(petId: ID!, input: UpdatePetInput!): Pet!
    createPet(input: CreatePetInput!): Pet!
    removePet(id: ID!): [Pet!]!
  }
`;

function generatePet() {
  return {
    id: `${faker.number.int()}`,
    name: faker.word.noun(),
    personId: '1',
  };
}

export const schema = createSchema({
  typeDefs: gqlSchema,

  resolvers: {
    Query: {
      person: (_, { id }) =>
        people.find((v) => {
          return v.id === id;
        }),
      people: () => people,
      car: (_, { id }) => {
        return cars.find((car) => car.id === id);
      },
      petsForAdoption: () => {
        return Array.from({ length: Math.floor(Math.random() * 15) + 1 }).map(
          () => {
            return generatePet();
          }
        );
      },
    },

    Mutation: {
      updatePerson(_, { personId, input }) {
        const person = people.find((person) => person.id === personId);
        Object.assign(person, input);
        console.log(person);

        return person;
      },

      updateCar(_, { carId, input }) {
        const car = cars.find((car) => car.id === carId);
        Object.assign(car, input);

        return car;
      },

      updatePet(_, { petId, input }) {
        const pet = pets.find((pet) => pet.id === petId);
        Object.assign(pet, input);

        return pet;
      },

      createPet(_, { input }: { input: { name: string; personId: string } }) {
        const newPet = {
          id: v4(),
          name: input.name,
          personId: input.personId,
        };

        pets.push(newPet);

        return newPet;
      },

      removePet(_, { id }) {
        const idx = pets.findIndex((pet) => pet.id === id);
        if (idx !== -1) {
          pets.splice(idx, 1);
        }
        return pets;
      },
    },

    Car: {
      owner: (car: { personId: string }) => {
        return people.find((p) => car.personId === p.id);
      },
    },

    Person: {
      car: (person: { id: string }) =>
        cars.find((car) => {
          return car.personId === person.id;
        }),
      pets: (person: { id: string }) =>
        pets.filter((pet) => {
          return pet.personId === person.id;
        }),
    },

    Pet: {
      owner: (pet: { personId: string }) => {
        console.log('resolving owner');
        const result = people.find((p) => pet.personId === p.id);
        return result;
      },
    },
  },
});
