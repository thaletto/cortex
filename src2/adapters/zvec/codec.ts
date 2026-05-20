import type { ZVecDoc, ZVecDocInput } from "@zvec/zvec"
import {
    CollectionSchema,
    type DocumentId,
    type UpsertPayload,
} from "../../schema/index.ts"
import { VECTOR_FIELD } from "./constants.ts"

export function toZvecDoc(payload: UpsertPayload, createdAt: Date): ZVecDocInput {
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
    }
}

export function toCollectionSchema(doc: ZVecDoc): CollectionSchema {
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
}

export function payloadToCollectionSchema(payload: UpsertPayload, createdAt: Date): CollectionSchema {
    return new CollectionSchema({
        id: payload.id,
        content: payload.content,
        category: payload.category,
        tags: [payload.tags],
        metadata_json: payload.metadata_json,
        created_at: createdAt,
        expires_at: payload.expires_at,
    })
}
