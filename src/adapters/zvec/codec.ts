/**
 * @file @/src/adapters/zvec/codec.ts
 * Conversions between cortex domain types and zvec wire format.
 */

import type { ZVecDoc, ZVecDocInput } from "@zvec/zvec"
import {
    CollectionSchema,
    type DocumentId,
    type UpsertPayload,
} from "../../schema/index.ts"
import { VECTOR_FIELD } from "./constants.ts"
import { Effect } from "effect"

/** Convert an `UpsertPayload` into the wire format expected by the zvec SDK. */
export const toZvecDoc = Effect.fn("toZvecDoc")(function* (payload: UpsertPayload, createdAt: Date) {
    return {
        id: payload.id,
        vectors: {
            [VECTOR_FIELD]: payload.vector,
        },
        fields: {
            content: payload.content,
            category: payload.category,
            tags: [payload.tags],
            metadata_json: payload.metadata_json,
            created_at: createdAt.getTime(),
            expires_at: payload.expires_at.getTime(),
        },
    } as ZVecDocInput
})

/** Convert a raw zvec document into a `CollectionSchema`. */
export const toCollectionSchema = Effect.fn("toCollectionSchema")(function* (doc: ZVecDoc) {
    return new CollectionSchema({
        id: doc.id as DocumentId,
        content: String(doc.fields["content"]),
        category: String(doc.fields["category"]),
        tags: Array.isArray(doc.fields["tags"])
            ? doc.fields["tags"].map(String)
            : [String(doc.fields["tags"])],
        metadata_json: String(doc.fields["metadata_json"]),
        created_at: new Date(Number(doc.fields["created_at"])),
        expires_at: new Date(Number(doc.fields["expires_at"])),
    })
})

/** Build a `CollectionSchema` directly from an `UpsertPayload`, without going through zvec storage. */
export const payloadToCollectionSchema = Effect.fn("payloadToCollectionSchema")(function* (payload: UpsertPayload, createdAt: Date) {
    return new CollectionSchema({
        id: payload.id,
        content: payload.content,
        category: payload.category,
        tags: [payload.tags],
        metadata_json: payload.metadata_json,
        created_at: createdAt,
        expires_at: payload.expires_at,
    })
})
