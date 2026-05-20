import { Schema } from "effect"

export const DocumentId = Schema.String.pipe(Schema.brand("DocumentId"))
export type DocumentId = typeof DocumentId.Type

export const Vector = Schema.Array(Schema.Number).pipe(Schema.brand("Vector"))
export type Vector = typeof Vector.Type