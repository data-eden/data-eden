# @data-eden/mocker

## Installation

```sh
yarn add @data-eden/codegen @data-eden/mocker
```

## Usage

> Utilizing the `gql` preprocesing from `@data-eden/codegen` passing that object to the mocker will be all you need along with the schema to start to generate mocks. By default the mocker mocks out required fields only, passing in the fields will override the default mocking strategy as well as mock out optionals if present in the data passed in.

```js
import { gql } from '@data-eden/codegen/gql';

const carTwoFragment = gql`
  fragment carTwo on Car {
    id
    make
  }
`;

const mocker = new Mocker({
  schema,
});

const result = mocker.mock(carTwoFragment, { id: 1234 });
/**
{
  "id": 1234,
  "make": "whose nor",
}
*/
```
