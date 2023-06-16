import { describe, test, expect } from 'vitest';
import { mergeDeep } from '../src/utils';

describe('utils', () => {
  describe('mergeDeep', () => {
    test('should be able to merge fields when original field is null', () => {
      expect(
        mergeDeep(
          {
            paginatedCommentsPage: undefined,
          },
          {
            paginatedCommentsPage: ['hello world!'],
          }
        )
      ).toMatchInlineSnapshot(`
        {
          "paginatedCommentsPage": [
            "hello world!",
          ],
        }
      `);
    });
  });
});
