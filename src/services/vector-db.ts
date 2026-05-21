/**
 * @file @/src/services/vector-db.ts
 * Defines the `VectorDB` service interface for document and vector operations.
 */

import { Effect, Context, Option } from "effect";
import { CollectionSchema, DimensionMismatch, DocumentId, DocumentNotFound, Pagination, QueryFilter, SearchResult, UpsertPayload, Vector, VectorDBError } from "../schema/index.ts";

/** Service contract for a vector database. All methods return `Effect` values. */
export class VectorDB extends Context.Service<VectorDB, {
    /** Insert or replace a single document. Returns the stored document on success. */
    readonly upsert: (payload: UpsertPayload) =>
        Effect.Effect<
            CollectionSchema,
            VectorDBError | DimensionMismatch | DocumentNotFound
        >

    /** Insert or replace multiple documents in a single batch. */
    readonly upsertMany: (payloads: ReadonlyArray<UpsertPayload>) =>
        Effect.Effect<
            ReadonlyArray<CollectionSchema>,
            VectorDBError | DimensionMismatch | DocumentNotFound
        >

    /** Delete a document by its unique identifier. */
    readonly delete: (id: DocumentId) =>
        Effect.Effect<void, VectorDBError | DocumentNotFound>

    /** Delete all documents matching the given filter. Returns the number of deleted documents. */
    readonly deleteWhere: (filter: QueryFilter) =>
        Effect.Effect<number, VectorDBError>

    /** Look up a document by ID, returning `None` if it does not exist. */
    readonly findById: (id: DocumentId) =>
        Effect.Effect<Option.Option<CollectionSchema>, VectorDBError>

    /** Look up a document by ID, failing with `DocumentNotFound` if it does not exist. */
    readonly getById: (id: DocumentId) =>
        Effect.Effect<CollectionSchema, VectorDBError | DocumentNotFound>

    /** Perform a vector similarity search. Returns results with similarity scores. */
    readonly search: (queryVector: Vector, limit: number, filter?: QueryFilter) =>
        Effect.Effect<
            ReadonlyArray<SearchResult>,
            VectorDBError | DimensionMismatch
        >

    /** List documents, optionally filtered and paginated. */
    readonly list: (filter?: QueryFilter, pagination?: Pagination) =>
        Effect.Effect<
            ReadonlyArray<CollectionSchema>,
            VectorDBError
        >

    /** Remove documents whose `expires_at` is before the given date. Returns the count pruned. */
    readonly pruneExpired: (asOf: Date) =>
        Effect.Effect<number, VectorDBError>

    /** Count documents, optionally matching a filter. */
    readonly count: (filter?: QueryFilter) =>
        Effect.Effect<number, VectorDBError>
}>()("@/services/vector-db") { }
