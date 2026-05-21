import { Schema } from "effect";
import { DocumentId } from "./vector.ts";

export class CollectionSchema extends Schema.Class<CollectionSchema>("CollectionSchema")({
    id: DocumentId,
    content: Schema.String,
    category: Schema.String,
    tags: Schema.Array(Schema.String),
    metadata_json: Schema.String,
    created_at: Schema.DateFromString,
    expires_at: Schema.DateFromString
}){}
