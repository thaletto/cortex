import type { ZVecCollection as RawZVecCollection } from "@zvec/zvec"
import { Effect, Layer, Option } from "effect"
import { VectorDB } from "../../services/vector-db.ts"
import {
    DocumentNotFound,
    type DocumentId,
    type Pagination,
    type QueryFilter,
    type SearchResult,
    type UpsertPayload,
    type Vector,
} from "../../schema/index.ts"
import { payloadToCollectionSchema, toCollectionSchema, toZvecDoc } from "./codec.ts"
import { VECTOR_FIELD } from "./constants.ts"
import { lift, statusesToEffect, statusToEffect, validateDimension } from "./effects.ts"
import { buildExpiredFilter, buildFilter, withFilter } from "./filters.ts"
import { ZvecSdk } from "./sdk.ts"

const queryAll = Effect.fn("zvec.queryAll")(function* (
    collection: RawZVecCollection,
    filter: QueryFilter | undefined,
    pagination: Pagination | undefined
) {
    const offset = pagination?.offset ?? 0
    const limit = pagination?.limit ?? collection.stats.docCount
    const topk = Math.max(offset + limit, 0)

    if (topk === 0) {
        return []
    }

    const docs = yield* lift(
        () =>
            collection.querySync(
                withFilter({ topk }, buildFilter(filter))
            ),
        "Failed to query documents"
    )

    return docs.slice(offset, offset + limit)
})

export const ZvecVectorDBLive = Layer.effect(
    VectorDB,
    Effect.gen(function* () {
        const { collection, dimension } = yield* ZvecSdk

        const findById = Effect.fn("zvec.findById")(function* (id: DocumentId) {
            const result = yield* lift(
                () => collection.fetchSync(id),
                `Failed to fetch document ${id}`
            )
            const doc = result[id]

            return doc === undefined
                ? Option.none()
                : Option.some(toCollectionSchema(doc))
        })

        const getById = Effect.fn("zvec.getById")(function* (id: DocumentId) {
            const maybeDocument = yield* findById(id)
            if (Option.isNone(maybeDocument)) {
                return yield* new DocumentNotFound({ id })
            }

            return maybeDocument.value
        })

        const upsert = Effect.fn("zvec.upsert")(function* (payload: UpsertPayload) {
            yield* validateDimension(payload.vector, dimension)
            const createdAt = new Date()
            const status = yield* lift(
                () => collection.upsertSync(toZvecDoc(payload, createdAt)),
                `Failed to upsert document ${payload.id}`
            )
            yield* statusToEffect(status, `Failed to upsert document ${payload.id}`)

            return payloadToCollectionSchema(payload, createdAt)
        })

        const upsertMany = Effect.fn("zvec.upsertMany")(function* (payloads: ReadonlyArray<UpsertPayload>) {
            for (const payload of payloads) {
                yield* validateDimension(payload.vector, dimension)
            }

            const createdAt = new Date()
            const statuses = yield* lift(
                () => collection.upsertSync(payloads.map((payload) => toZvecDoc(payload, createdAt))),
                "Failed to upsert documents"
            )
            yield* statusesToEffect(statuses, "Failed to upsert documents")

            return payloads.map((payload) => payloadToCollectionSchema(payload, createdAt))
        })

        const deleteById = Effect.fn("zvec.delete")(function* (id: DocumentId) {
            yield* getById(id)
            const status = yield* lift(
                () => collection.deleteSync(id),
                `Failed to delete document ${id}`
            )
            yield* statusToEffect(status, `Failed to delete document ${id}`)
        })

        const deleteWhere = Effect.fn("zvec.deleteWhere")(function* (filter: QueryFilter) {
            const deleted = (yield* queryAll(collection, filter, undefined)).length
            const status = yield* lift(
                () => collection.deleteByFilterSync(buildFilter(filter) ?? ""),
                "Failed to delete documents by filter"
            )
            yield* statusToEffect(status, "Failed to delete documents by filter")

            return deleted
        })

        const search = Effect.fn("zvec.search")(function* (
            queryVector: Vector,
            limit: number,
            filter?: QueryFilter
        ) {
            yield* validateDimension(queryVector, dimension)
            const docs = yield* lift(
                () =>
                    collection.querySync(withFilter({
                        fieldName: VECTOR_FIELD,
                        vector: queryVector,
                        topk: limit,
                    }, buildFilter(filter))),
                "Vector search failed"
            )

            return docs.map((doc): SearchResult => ({
                document: toCollectionSchema(doc),
                score: 1 - doc.score,
            }))
        })

        const list = Effect.fn("zvec.list")(function* (filter?: QueryFilter, pagination?: Pagination) {
            return (yield* queryAll(collection, filter, pagination)).map(toCollectionSchema)
        })

        const pruneExpired = Effect.fn("zvec.pruneExpired")(function* (asOf: Date) {
            const expiredFilter = buildExpiredFilter(asOf)
            const deleted = yield* lift(
                () => collection.querySync({ topk: collection.stats.docCount, filter: expiredFilter }).length,
                "Failed to count expired documents before pruning"
            )
            const status = yield* lift(
                () => collection.deleteByFilterSync(expiredFilter),
                "Failed to prune expired documents"
            )
            yield* statusToEffect(status, "Failed to prune expired documents")

            return deleted
        })

        const count = Effect.fn("zvec.count")(function* (filter?: QueryFilter) {
            if (filter === undefined) {
                return yield* lift(() => collection.stats.docCount, "Failed to count documents")
            }

            return (yield* queryAll(collection, filter, undefined)).length
        })

        return {
            upsert,
            upsertMany,
            delete: deleteById,
            deleteWhere,
            findById,
            getById,
            search,
            list,
            pruneExpired,
            count,
        }
    })
)
