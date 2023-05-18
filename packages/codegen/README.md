# @data-eden/codegen

## Usage

When writing imports it is important to follow a pattern for queries, mutations and fragments.

As we want to avoid too much work in the babel side we assume convention to offset actual work to the codegen process.

### Convention

This showcases the convention for Fragments, but the same applies to oeprations such as Queries and Mutations.

> GOOD

```js
const userFieldsFragment = gql`
  fragment UserFields on User {
    id
    username
    role
  }
`;
```

> BAD

```js
const UserFieldsFragment = gql`
  fragment UserFields on User {
    id
    username
    role
  }
`;
```

```js
const userFields = gql`
  fragment UserFields on User {
    id
    username
    role
  }
`;
```
