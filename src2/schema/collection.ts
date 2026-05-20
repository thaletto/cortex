/**
 * @file `schema/collection.ts`
 * A collection is a named contain for documents - similar to table in a relational
 * database systems such as MySQL, where each document represents a row in a table.
 * A collection is where you store, organize, and query your data
 * 
 * Every collection is governed by a schema that defines the scalar fields and vectors it
 * contains, along with their types and indexing settings.
 */

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