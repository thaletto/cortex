import { Schema } from "effect"
import { CollectionSchema } from "./collection.ts"
import { DocumentId, Vector } from "./vector.ts"

export const UpsertPayload = Schema.Struct({
    id: DocumentId,
    content: Schema.String,
    category: Schema.String,
    tags: Schema.String,
    metadata_json: Schema.String,
    vector: Vector,
    expires_at: Schema.DateFromString
})
export type UpsertPayload = typeof UpsertPayload.Type

export const SearchResult = Schema.Struct({
    document: CollectionSchema,
    score: Schema.Number,
})
export type SearchResult = typeof SearchResult.Type

export const QueryFilter = Schema.Struct({
    category: Schema.optional(Schema.String),
    tags: Schema.optional(Schema.Array(Schema.String)),
    activeAt: Schema.optional(Schema.DateFromString)
})
export type QueryFilter = typeof QueryFilter.Type

export const Pagination = Schema.Struct({
    limit: Schema.Number,
    offset: Schema.Number
})
export type Pagination = typeof Pagination.Type

export class VectorDBError extends Schema.TaggedErrorClass<VectorDBError>()("VectorDBError", {
    message: Schema.String,
    cause: Schema.optional(Schema.Unknown)
}){}

export class DocumentNotFound extends Schema.TaggedErrorClass<DocumentNotFound>()("DocumentNotFound", {
    id: DocumentId
}){}

export class DimensionMismatch extends Schema.TaggedErrorClass<DimensionMismatch>()("DimensionMismatch", {
    expected: Schema.Number,
    actual: Schema.Number
}){}