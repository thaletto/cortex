/**
 * @file `services/vector-db.ts
 */

import { Effect, Context, Option } from "effect";
import { CollectionSchema, DimensionMismatch, DocumentId, DocumentNotFound, Pagination, QueryFilter, SearchResult, UpsertPayload, Vector, VectorDBError } from "../schema/index.ts";

export class VectorDB extends Context.Service<VectorDB, {
    readonly upsert: (payload: UpsertPayload) =>
        Effect.Effect<
            CollectionSchema,
            VectorDBError | DimensionMismatch | DocumentNotFound
        >

    readonly upsertMany: (payloads: ReadonlyArray<UpsertPayload>) =>
        Effect.Effect<
            ReadonlyArray<CollectionSchema>,
            VectorDBError | DimensionMismatch | DocumentNotFound
        >

    readonly delete: (id: DocumentId) =>
        Effect.Effect<void, VectorDBError | DocumentNotFound>

    readonly deleteWhere: (filter: QueryFilter) =>
        Effect.Effect<number, VectorDBError>

    readonly findById: (id: DocumentId) =>
        Effect.Effect<Option.Option<CollectionSchema>, VectorDBError>

    readonly getById: (id: DocumentId) =>
        Effect.Effect<CollectionSchema, VectorDBError | DocumentNotFound>

    readonly search: (queryVector: Vector, limit: number, filter?: QueryFilter) =>
        Effect.Effect<
            ReadonlyArray<SearchResult>,
            VectorDBError | DimensionMismatch
        >

    readonly list: (filter?: QueryFilter, pagination?: Pagination) =>
        Effect.Effect<
            ReadonlyArray<CollectionSchema>,
            VectorDBError
        >

    readonly pruneExpired: (asOf: Date) =>
        Effect.Effect<number, VectorDBError>

    readonly count: (filter?: QueryFilter) =>
        Effect.Effect<number, VectorDBError>
}>()("@/services/vector-db") { }