import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import type {
  GraphQLSchema,
  GraphQLNamedType,
  SelectionNode,
  GraphQLType,
  GraphQLEnumValue,
} from 'graphql';
import {
  buildSchema,
  GraphQLObjectType,
  GraphQLList,
  GraphQLEnumType,
  GraphQLNonNull,
  isNonNullType,
  GraphQLUnionType,
  Kind,
} from 'graphql';
import type { Faker } from '@faker-js/faker';
import { faker as defaultFaker } from '@faker-js/faker';

import { inlineAllFragments } from './inline-all-fragments.js';

type JSONPrimitive = string | number | boolean | null;
type JSONArray = JSONValue[];
type JSONObject = { [key in string]: JSONValue | undefined };
type JSONValue = JSONPrimitive | JSONArray | JSONObject;

const defaultTypeGenerators: TypeGenerators = {
  String(faker: Faker) {
    return faker.word.words();
  },
  Int(faker: Faker) {
    return faker.number.int();
  },
  Long(faker: Faker) {
    let _min = BigInt(0n);
    let _max = BigInt(9223372036854775807n);

    return (_min +
      BigInt(
        Math.floor(Math.random() * Number(_max - _min + 1n))
      )) as unknown as JSONValue;
  },
  Float(faker: Faker) {
    const randomNum = faker.datatype.number({
      min: 0,
      max: 92233720368547,
      precision: 0.01,
    });

    return parseFloat(randomNum.toFixed(2));
  },
};

type DeepPartial<T> = T extends any[]
  ? DeepPartialArray<T[number]>
  : T extends object
  ? DeepPartialObject<T>
  : T;

type DeepPartialArray<T> = Array<DeepPartial<T>>;

type DeepPartialObject<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

type FieldGenerators = {
  [className: string]: {
    [key: string]: () => JSONValue;
  };
};

type TypeGenerators = {
  [key: string]: (faker: Faker) => JSONValue;
};

interface MockerOptions {
  schema: string;
  faker?: Faker;
  typeGenerators?: TypeGenerators;
  fieldGenerators?: FieldGenerators;
}

type FieldWithSelectionSet = SelectionNode & {
  selectionSet: {
    selections: readonly SelectionNode[];
  };
};

function assertHasSelectionSet(
  field: SelectionNode | undefined
): asserts field is FieldWithSelectionSet {
  if (field && field.kind !== Kind.FRAGMENT_SPREAD && !field.selectionSet) {
    const fieldName =
      (field.kind === Kind.INLINE_FRAGMENT
        ? field?.typeCondition?.name.value
        : field.name.value) ?? '"Can not resolve the name"';
    throw new Error(`Field ${fieldName} does not have a selection set.`);
  }
}

type QueryOrMutationWrapped<T> = {
  __meta__: {
    $DEBUG: {
      ast: TypedDocumentNode<T>;
    };
  };
};

export class Mocker {
  private faker: Faker;
  private fieldGenerators: FieldGenerators;
  private typeGenerators: TypeGenerators;
  private schema: GraphQLSchema;

  constructor({
    schema,
    faker,
    typeGenerators,
    fieldGenerators,
  }: MockerOptions) {
    if (!schema) {
      throw new Error('Schema is required');
    }

    this.faker = faker ?? defaultFaker;
    this.fieldGenerators = fieldGenerators || {};
    this.typeGenerators = {
      ...defaultTypeGenerators,
      ...(typeGenerators || {}),
    };
    this.schema = buildSchema(schema);

    // we need to set the seed on the faker instance
    this.faker.seed(2345678);
  }

  mock<Document extends JSONObject = JSONObject>(
    documentNode:
      | TypedDocumentNode<Document>
      | QueryOrMutationWrapped<Document>,
    mockData: DeepPartial<Document>
  ): Document {
    const definitionNode =
      '__meta__' in documentNode
        ? documentNode.__meta__.$DEBUG.ast.definitions[0]
        : documentNode.definitions[0];

    const definition = inlineAllFragments(
      definitionNode,
      '__meta__' in documentNode
        ? documentNode.__meta__.$DEBUG.ast
        : documentNode
    );

    let typeName: string;
    let selections: readonly SelectionNode[];

    if (definition.kind === 'FragmentDefinition') {
      typeName = definition.typeCondition.name.value;
      selections = definition.selectionSet.selections;
    } else if (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'query'
    ) {
      typeName = 'Query';
      selections = definition.selectionSet.selections;
    } else if (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'mutation'
    ) {
      typeName = 'Mutation';
      selections = definition.selectionSet.selections;
    } else {
      throw new Error(`Unsupported definition kind "${definition.kind}"`);
    }

    const type = this.schema.getType(typeName) as GraphQLNamedType;

    if (!type) {
      throw new Error(`Type ${typeName} not found in the schema`);
    }

    if (type instanceof GraphQLUnionType) {
      return this.generateMockDataForUnionFields<Document>(
        definition as unknown as SelectionNode,
        type,
        mockData
      );
    }

    return this.generateMockDataForFields<Document>(selections, type, mockData);
  }

  private generateMockDataForUnionFields<
    Data extends JSONValue | undefined | null = JSONValue | undefined | null
  >(
    field: SelectionNode,
    fieldType: GraphQLUnionType,
    mockData: JSONObject | undefined | null
  ): Data {
    const possibleTypes = fieldType.getTypes();

    // Check if mockData is provided for the union field
    if (mockData) {
      const mockDataUnionType = mockData.__typename;
      const matchingType = possibleTypes.find(
        (type) => type.name === mockDataUnionType
      );
      if (matchingType) {
        assertHasSelectionSet(field);
        const selectionSetForType = field.selectionSet.selections.find(
          (selection) => {
            // we need to return the selection set that matches this type
            return (
              selection.kind === Kind.INLINE_FRAGMENT &&
              selection.typeCondition &&
              selection.typeCondition.name.value === matchingType.name
            );
          }
        );

        assertHasSelectionSet(selectionSetForType);

        return this.generateMockDataForFields(
          selectionSetForType.selectionSet.selections,
          matchingType,
          mockData
        );
      }
    }

    assertHasSelectionSet(field);
    const randomIndex = Math.floor(Math.random() * possibleTypes.length);
    const randomType = possibleTypes[randomIndex];
    const selectionSetForType = field.selectionSet.selections.find(
      (selection) => {
        // we need to return the selection set that matches this type
        return (
          selection.kind === Kind.INLINE_FRAGMENT &&
          selection.typeCondition &&
          selection.typeCondition.name.value === randomType.name
        );
      }
    );
    assertHasSelectionSet(selectionSetForType);
    return this.generateMockDataForFields(
      selectionSetForType.selectionSet.selections,
      randomType,
      mockData
    );
  }

  private generateMockDataForFields<
    Data extends JSONValue | undefined | null = JSONValue | undefined | null
  >(
    fields: readonly SelectionNode[],
    type: GraphQLNamedType,
    mockData: JSONObject | undefined | null
  ): Data {
    let result: JSONObject = {};

    fields.forEach((field) => {
      if (field.kind === 'InlineFragment') {
        // Handle inline fragments
        if (!field.typeCondition) {
          throw new Error(
            'Could not handle a case where inline fragment typeCondition was undefined'
          );
        }

        const fragmentType = field.typeCondition.name.value;
        result = {
          ...result,
          ...this.generateMockDataForFields(
            field.selectionSet.selections,
            this.schema.getType(fragmentType) as GraphQLNamedType,
            mockData
          ),
        };
      } else if (field.kind === 'FragmentSpread') {
        throw new Error(
          'Fragment spreads are not supported, please resolve all fragments spreads before trying to mock.'
        );
      } else {
        const fieldName = field.name.value;

        if (fieldName === '__typename') {
          result[fieldName] = type.name;
        } else {
          if (
            !type ||
            !('getFields' in type) ||
            !type.getFields ||
            !type.getFields()[fieldName]
          ) {
            throw new Error(
              `Field ${fieldName} does not exist in the schema for type ${type?.name}`
            );
          }

          let fieldType = type.getFields()[fieldName].type;

          // If it's a NonNull type, unwrap it
          if (fieldType instanceof GraphQLNonNull) {
            fieldType = fieldType.ofType;
          }

          // Handle list types (arrays)
          if (fieldType instanceof GraphQLList) {
            let elementType: GraphQLType = fieldType.ofType;

            // If it's a NonNull type, unwrap it again to get the actual element type
            if (elementType instanceof GraphQLNonNull) {
              elementType = elementType.ofType;
            }

            // If no mock data is provided for the list, create an empty array
            if (!mockData || !mockData[fieldName]) {
              result[fieldName] = [];
            } else {
              // Check if the element is an object type, and if so, recursively generate the mock data
              if (elementType instanceof GraphQLObjectType) {
                result[fieldName] = (mockData[fieldName] as JSONArray).map(
                  (item) => {
                    assertHasSelectionSet(field);

                    return this.generateMockDataForFields(
                      field.selectionSet.selections,
                      elementType as GraphQLObjectType,
                      item as JSONObject
                    );
                  }
                ) as JSONValue;
              } else {
                // Handle scalar type arrays (e.g., [Int], [String])
                result[fieldName] = (mockData[fieldName] as JSONArray).map(
                  (item) =>
                    this.generateMockDataForType(
                      type.name,
                      fieldName,
                      elementType,
                      item
                    )
                );
              }
            }
          } else if (fieldType instanceof GraphQLObjectType) {
            // Recursively handle object types
            assertHasSelectionSet(field);

            result[fieldName] = this.generateMockDataForFields(
              field.selectionSet.selections,
              fieldType,
              mockData && (mockData[fieldName] as JSONObject)
            );
          } else if (fieldType instanceof GraphQLEnumType) {
            // Handle enum types
            const enumValues = fieldType.getValues();
            result[fieldName] = this.generateMockDataForEnum(
              fieldType.name,
              enumValues,
              mockData && mockData[fieldName]
            );
          } else if (fieldType instanceof GraphQLUnionType) {
            // Handle union types;
            result[fieldName] = this.generateMockDataForUnionFields(
              field,
              fieldType,
              mockData && (mockData[fieldName] as JSONObject)
            );
          } else {
            // Generate mock data for scalar fields
            result[fieldName] = this.generateMockDataForType(
              type.name,
              fieldName,
              fieldType,
              mockData && (mockData[fieldName] as JSONObject)
            );
          }
        }
      }
    });

    return result as Data;
  }

  private generateMockDataForEnum(
    fieldName: string,
    enumValues: readonly GraphQLEnumValue[],
    providedValue: JSONValue | undefined
  ): string {
    const values = enumValues.map((enumValue) => enumValue.name);
    if (providedValue) {
      if (typeof providedValue !== 'string') {
        throw new Error(
          `${JSON.stringify(
            providedValue
          )} is not a valid ENUM value as it can only be a string`
        );
      }

      if (values.indexOf(providedValue) > -1) {
        return providedValue;
      } else {
        throw new Error(
          `Trying to mock ${fieldName} with enum value ${providedValue} does not match known enum values "[${values.join(
            ','
          )}]"`
        );
      }
    }
    const randomIndex = Math.floor(Math.random() * values.length);
    return values[randomIndex];
  }

  private generateMockDataForType(
    className: string,
    fieldName: string,
    type: GraphQLType | GraphQLNonNull<GraphQLType>,
    inputMockData: JSONValue | undefined
  ): JSONValue {
    // Check if this is a NonNull type
    if (isNonNullType(type) && type.ofType) {
      return this.generateMockDataForType(
        className,
        fieldName,
        type.ofType,
        inputMockData
      );
    }

    // Use input mock data if provided
    if (inputMockData !== undefined) {
      return inputMockData;
    }

    if (
      this.fieldGenerators[className] &&
      this.fieldGenerators[className][fieldName]
    ) {
      return this.fieldGenerators[className][fieldName]();
    }

    if (!isNonNullType(type) && this.typeGenerators[type.name]) {
      return this.typeGenerators[type.name](this.faker);
    } else {
      if (isNonNullType(type)) {
        throw new Error(
          `Value generation could not be done for type ${type.ofType.toString()}. Please provide an override to typeGenerators.`
        );
      } else {
        throw new Error(
          `Value generation could not be done for type ${type.name} in ${className}. Please provide an override to typeGenerators.`
        );
      }
    }
  }
}
