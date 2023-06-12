export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
};

export enum Breed {
  Shepard = 'SHEPARD',
  Bulldog = 'BULLDOG',
  Poodle = 'POODLE',
  GermanShepherd = 'GERMAN_SHEPHERD',
  LabradorRetriever = 'LABRADOR_RETRIEVER',
  GoldenRetriever = 'GOLDEN_RETRIEVER'
}

export type PersonInput = {
  name: Scalars['String'];
};

export type CarInput = {
  make?: InputMaybe<Scalars['String']>;
  model?: InputMaybe<Scalars['String']>;
};

export type UpdatePetInput = {
  name: Scalars['String'];
};

export type CreatePetInput = {
  name: Scalars['String'];
  personId: Scalars['ID'];
};

export type RemovePetInput = {
  id: Scalars['ID'];
  personId: Scalars['ID'];
};
