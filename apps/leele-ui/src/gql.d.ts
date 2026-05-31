/* eslint-disable */
/* prettier-ignore */

export type introspection_types = {
  Boolean: unknown
  ID: unknown
  Mutation: {
    kind: 'OBJECT'
    name: 'Mutation'
    fields: {
      createNote: {
        name: 'createNote'
        type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'OBJECT'; name: 'Note'; ofType: null } }
      }
    }
  }
  Note: {
    kind: 'OBJECT'
    name: 'Note'
    fields: {
      id: { name: 'id'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'ID'; ofType: null } } }
      message: {
        name: 'message'
        type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'String'; ofType: null } }
      }
    }
  }
  Query: {
    kind: 'OBJECT'
    name: 'Query'
    fields: {
      note: { name: 'note'; type: { kind: 'OBJECT'; name: 'Note'; ofType: null } }
      notes: {
        name: 'notes'
        type: {
          kind: 'NON_NULL'
          name: never
          ofType: {
            kind: 'LIST'
            name: never
            ofType: { kind: 'NON_NULL'; name: never; ofType: { kind: 'OBJECT'; name: 'Note'; ofType: null } }
          }
        }
      }
    }
  }
  String: unknown
  Subscription: {
    kind: 'OBJECT'
    name: 'Subscription'
    fields: {
      noteCreated: {
        name: 'noteCreated'
        type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'OBJECT'; name: 'Note'; ofType: null } }
      }
    }
  }
}

/** An IntrospectionQuery representation of your schema.
 *
 * @remarks
 * This is an introspection of your schema saved as a file by GraphQLSP.
 * It will automatically be used by `gql.tada` to infer the types of your GraphQL documents.
 * If you need to reuse this data or update your `scalars`, update `tadaOutputLocation` to
 * instead save to a .ts instead of a .d.ts file.
 */
export type introspection = {
  name: never
  query: 'Query'
  mutation: 'Mutation'
  subscription: 'Subscription'
  types: introspection_types
}

import * as gqlTada from 'gql.tada'

declare module 'gql.tada' {
  interface setupSchema {
    introspection: introspection
  }
}
