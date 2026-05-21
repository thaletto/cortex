/**
 * @file @/src/schema/vector-db.ts
 * Request/response schemas and error types for vector database operations.
 */

import { Schema } from "effect"
import { CollectionSchema } from "./collection.ts"
import { DocumentId, Vector } from "./vector.ts"

/** Payload required to insert or update a document in the vector database. */
export const UpsertPayload = Schema.Struct({
    id: DocumentId,
    content: Schema.String,
    category: Schema.String,
    tags: Schema.String,
    metadata_json: Schema.String,
    vector: Vector,
    expires_at: Schema.DateFromString
})
export type UpsertPayload = Schema.Schema.Type<typeof UpsertPayload>

/** A single result returned from a vector similarity search. */
export const SearchResult = Schema.Struct({
    document: CollectionSchema,
    score: Schema.Number,
})
export type SearchResult = Schema.Schema.Type<typeof SearchResult>

/** Optional filters that can narrow queries and listing operations. */
export const QueryFilter = Schema.Struct({
    category: Schema.optional(Schema.String),
    tags: Schema.optional(Schema.Array(Schema.String)),
    activeAt: Schema.optional(Schema.DateFromString)
})
export type QueryFilter = Schema.Schema.Type<typeof QueryFilter>

/** Limit/offset pagination parameters. */
export const Pagination = Schema.Struct({
    limit: Schema.Number,
    offset: Schema.Number
})
export type Pagination = Schema.Schema.Type<typeof Pagination>

/** Generic vector database error with a message and optional cause. */
export class VectorDBError extends Schema.TaggedErrorClass<VectorDBError>()("VectorDBError", {
    message: Schema.String,
    cause: Schema.optional(Schema.Unknown)
}){}

/** Error raised when a requested document ID does not exist. */
export class DocumentNotFound extends Schema.TaggedErrorClass<DocumentNotFound>()("DocumentNotFound", {
    id: DocumentId
}){}

/** Error raised when a vector dimension does not match the collection schema. */
export class DimensionMismatch extends Schema.TaggedErrorClass<DimensionMismatch>()("DimensionMismatch", {
    expected: Schema.Number,
    actual: Schema.Number
}){}
