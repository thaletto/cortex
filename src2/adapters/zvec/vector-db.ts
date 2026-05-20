import type { ZVecCollection as RawZVecCollection, ZVecStatus } from "@zvec/zvec"
import { Effect, Layer, Option } from "effect"
import { VectorDB } from "../../services/vector-db.ts"
import {
    DimensionMismatch,
    DocumentNotFound,
    type DocumentId,
    type Pagination,
    type QueryFilter,
    type SearchResult,
    type UpsertPayload,
    type Vector,
    VectorDBError,
} from "../../schema/index.ts"
import { payloadToCollectionSchema, toCollectionSchema, toZvecDoc } from "./codec.ts"
import { VECTOR_FIELD } from "./constants.ts"
import { buildExpiredFilter, buildFilter, withFilter } from "./filters.ts"
import { ZvecSdk } from "./sdk.ts"

const checkStatus = Effect.fn("zvec.checkStatus")(function* (status: ZVecStatus, message: string) {
    if (!status.ok) {
        return yield* new VectorDBError({
            message: `${message}: ${status.code} ${status.message}`,
        })
    }
})

const checkStatuses = Effect.fn("zvec.checkStatuses")(function* (statuses: ReadonlyArray<ZVecStatus>, message: string) {
    const failed = statuses.find((status) => !status.ok)
    if (failed !== undefined) {
        return yield* new VectorDBError({
            message: `${message}: ${failed.code} ${failed.message}`,
        })
    }
})

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

    const docs = yield* Effect.try({
        try: () =>
            collection.querySync(
                withFilter({ topk }, buildFilter(filter))
            ),
        catch: (cause) =>
            new VectorDBError({
                message: "Failed to query documents",
                cause,
            }),
    })

    return docs.slice(offset, offset + limit)
})

export const ZvecVectorDBLive = Layer.effect(
    VectorDB,
    Effect.gen(function* () {
        const { collection, dimension } = yield* ZvecSdk

        const findById = Effect.fn("zvec.findById")(function* (id: DocumentId) {
            const result = yield* Effect.try({
                try: () => collection.fetchSync(id),
                catch: (cause) =>
                    new VectorDBError({
                        message: `Failed to fetch document ${id}`,
                        cause,
                    }),
            })
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
            if (payload.vector.length !== dimension) {
                return yield* new DimensionMismatch({
                    expected: dimension,
                    actual: payload.vector.length,
                })
            }

            const createdAt = new Date()
            const status = yield* Effect.try({
                try: () => collection.upsertSync(toZvecDoc(payload, createdAt)),
                catch: (cause) =>
                    new VectorDBError({
                        message: `Failed to upsert document ${payload.id}`,
                        cause,
                    }),
            })
            yield* checkStatus(status, `Failed to upsert document ${payload.id}`)

            return payloadToCollectionSchema(payload, createdAt)
        })

        const upsertMany = Effect.fn("zvec.upsertMany")(function* (payloads: ReadonlyArray<UpsertPayload>) {
            for (const payload of payloads) {
                if (payload.vector.length !== dimension) {
                    return yield* new DimensionMismatch({
                        expected: dimension,
                        actual: payload.vector.length,
                    })
                }
            }

            const createdAt = new Date()
            const statuses = yield* Effect.try({
                try: () => collection.upsertSync(payloads.map((payload) => toZvecDoc(payload, createdAt))),
                catch: (cause) =>
                    new VectorDBError({
                        message: "Failed to upsert documents",
                        cause,
                    }),
            })
            yield* checkStatuses(statuses, "Failed to upsert documents")

            return payloads.map((payload) => payloadToCollectionSchema(payload, createdAt))
        })

        const deleteById = Effect.fn("zvec.delete")(function* (id: DocumentId) {
            yield* getById(id)
            const status = yield* Effect.try({
                try: () => collection.deleteSync(id),
                catch: (cause) =>
                    new VectorDBError({
                        message: `Failed to delete document ${id}`,
                        cause,
                    }),
            })
            yield* checkStatus(status, `Failed to delete document ${id}`)
        })

        const deleteWhere = Effect.fn("zvec.deleteWhere")(function* (filter: QueryFilter) {
            const deleted = (yield* queryAll(collection, filter, undefined)).length
            const status = yield* Effect.try({
                try: () => collection.deleteByFilterSync(buildFilter(filter) ?? ""),
                catch: (cause) =>
                    new VectorDBError({
                        message: "Failed to delete documents by filter",
                        cause,
                    }),
            })
            yield* checkStatus(status, "Failed to delete documents by filter")

            return deleted
        })

        const search = Effect.fn("zvec.search")(function* (
            queryVector: Vector,
            limit: number,
            filter?: QueryFilter
        ) {
            if (queryVector.length !== dimension) {
                return yield* new DimensionMismatch({
                    expected: dimension,
                    actual: queryVector.length,
                })
            }

            const docs = yield* Effect.try({
                try: () =>
                    collection.querySync(withFilter({
                        fieldName: VECTOR_FIELD,
                        vector: queryVector,
                        topk: limit,
                    }, buildFilter(filter))),
                catch: (cause) =>
                    new VectorDBError({
                        message: "Vector search failed",
                        cause,
                    }),
            })

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
            const deleted = yield* Effect.try({
                try: () => collection.querySync({ topk: collection.stats.docCount, filter: expiredFilter }).length,
                catch: (cause) =>
                    new VectorDBError({
                        message: "Failed to count expired documents before pruning",
                        cause,
                    }),
            })
            const status = yield* Effect.try({
                try: () => collection.deleteByFilterSync(expiredFilter),
                catch: (cause) =>
                    new VectorDBError({
                        message: "Failed to prune expired documents",
                        cause,
                    }),
            })
            yield* checkStatus(status, "Failed to prune expired documents")

            return deleted
        })

        const count = Effect.fn("zvec.count")(function* (filter?: QueryFilter) {
            if (filter === undefined) {
                return yield* Effect.try({
                    try: () => collection.stats.docCount,
                    catch: (cause) =>
                        new VectorDBError({
                            message: "Failed to count documents",
                            cause,
                        }),
                })
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
