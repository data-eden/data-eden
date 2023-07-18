import { describe, test, expect } from 'vitest';

import { print } from 'graphql';

import { gql } from '@data-eden/codegen/gql';

import { inlineAllFragments } from '../src/inline-all-fragments';
import { OwnerOneFragment } from './__generated/inline-all-fragments.test.graphql';

describe('inline-all-fragments', () => {
  test('should resolve all nested fragments', async () => {
    const personNestedFragment = gql`
      fragment personNested on Person {
        __typename
        id
        name
        car {
          __typename
          id
          make
        }
      }
    `;
    const companyNestedFragment = gql`
      fragment companyNested on Company {
        __typename
        id
        name
      }
    `;
    const ownerOneFragment = gql<OwnerOneFragment>`
        fragment ownerOne on Owner {
          ${personNestedFragment}
          ${companyNestedFragment}
        }
      `;

    expect(
      print(
        inlineAllFragments(ownerOneFragment.definitions[0], ownerOneFragment)
      )
    ).toMatchInlineSnapshot(`
      "fragment ownerOne on Owner {
        ... on Person {
          __typename
          id
          name
          car {
            __typename
            id
            make
          }
        }
        ... on Company {
          __typename
          id
          name
        }
      }"
    `);
  });
});
