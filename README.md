## Refresh on mongodb, mongoose, type-graphql and @typegoose/typegoose

Starting from a single pair of Typescript entity and resolver classes automatically generate both the corresponding Mongoose and GraphQL schemas.

The GraphQL queries and mutations are implemented at each resolver level.

Queries make use of mongodb indexes defined via annotations resolving external referenced entities either via $lookup or FieldResolver.

Some basic jest unit tests are also present.
