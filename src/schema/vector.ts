/**
 * @file @/src/schema/vector.ts
 * Branded types for document identifiers and embedding vectors.
 */

import { Schema } from "effect"

/** A branded string type representing a unique document identifier. */
export const DocumentId = Schema.String.pipe(Schema.brand("DocumentId"))
export type DocumentId = Schema.Schema.Type<typeof DocumentId>

/** A branded array of numbers representing an embedding vector. */
export const Vector = Schema.Array(Schema.Number).pipe(Schema.brand("Vector"))
export type Vector = Schema.Schema.Type<typeof Vector>
