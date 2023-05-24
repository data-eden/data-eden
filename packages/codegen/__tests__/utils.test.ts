import { describe, expect, test } from 'vitest';

import { addPrimaryKeyAliasToGraphqlAST } from '../src/utils';
import { parse, print } from 'graphql';

describe('utils', () => {
  describe('addPrimaryKeyAliasToGraphqlAST', () => {
    test('replace field value with primary key', async () => {
      expect(
        print(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call
          addPrimaryKeyAliasToGraphqlAST(
            parse(`
              fragment car on Car {
                  make
                  model
                  owner
              }
            `),
            {
              primaryKey: 'entityUrn',
              fields: {
                Car: 'id',
              },
            }
          )
        )
      ).toMatchInlineSnapshot(`
      "fragment car on Car {
        make
        model
        owner
        entityUrn: id
      }"
    `);
    });

    test('replace fields within fragment, inline fragment and query value with primary key', async () => {
      expect(
        print(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call
          addPrimaryKeyAliasToGraphqlAST(
            parse(`
              fragment car on Car {
                  make
                  model
                  owner
              }

              query {
                  carsForDays(id: 1234) {
                      ...car
                      ... on Car {
                          make
                      }
                  }
              }
          `),
            {
              primaryKey: 'entityUrn',
              fields: {
                Car: 'id',
              },
            }
          )
        )
      ).toMatchInlineSnapshot(`
        "fragment car on Car {
          make
          model
          owner
          entityUrn: id
        }

        {
          carsForDays(id: 1234) {
            ...car
            ... on Car {
              make
              entityUrn: id
            }
          }
        }"
      `);
    });
  });
});
