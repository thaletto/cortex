import { Schema } from "effect"

export const DocumentId = Schema.String.pipe(Schema.brand("DocumentId"))
export type DocumentId = Schema.Schema.Type<typeof DocumentId>

export const Vector = Schema.Array(Schema.Number).pipe(Schema.brand("Vector"))
export type Vector = Schema.Schema.Type<typeof Vector>
