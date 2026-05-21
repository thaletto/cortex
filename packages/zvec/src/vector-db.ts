import type { ZVecCollection as RawZVecCollection, ZVecStatus } from "@zvec/zvec"
import { Effect, Layer, Option } from "effect"

import { VectorDB } from "@thaletto/cortex"

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
} from "@thaletto/cortex"

import {
    payloadToCollectionSchema,
    toCollectionSchema,
    toZvecDoc,
} from "./codec.ts"

import { VECTOR_FIELD } from "./constants.ts"

import {
    buildExpiredFilter,
    buildFilter,
    withFilter,
} from "./filters.ts"

import { ZvecSdk } from "./sdk.ts"

const checkStatus = Effect.fn("zvec.checkStatus")(function* (
    status: ZVecStatus,
    message: string
) {
    if (!status.ok) {
        return yield* new VectorDBError({
            message: `${message}: ${status.code} ${status.message}`,
        })
    }
})

const checkStatuses = Effect.fn("zvec.checkStatuses")(function* (
    statuses: ReadonlyArray<ZVecStatus>,
    message: string
) {
    const failed = statuses.find((status) => !status.ok)

    if (failed !== undefined) {
        return yield* new VectorDBError({
            message: `${message}: ${failed.code} ${failed.message}`,
        })
    }
})

const ensureVectorDimension = Effect.fn("zvec.ensureVectorDimension")(function* (
    vector: Vector,
    dimension: number
) {
    if (vector.length !== dimension) {
        return yield* new DimensionMismatch({
            expected: dimension,
            actual: vector.length,
        })
    }
})

const ensurePayloadDimensions = Effect.fn("zvec.ensurePayloadDimensions")(function* (
    payloads: ReadonlyArray<UpsertPayload>,
    dimension: number
) {
    for (const payload of payloads) {
        yield* ensureVectorDimension(payload.vector, dimension)
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
                withFilter(
                    { topk },
                    buildFilter(filter)
                )
            ),
        catch: (cause) =>
            new VectorDBError({
                message: "Failed to query documents",
                cause,
            }),
    })

    return docs.slice(offset, offset + limit)
})

const makeFindById = (
    collection: RawZVecCollection
) =>
    Effect.fn("zvec.findById")(function* (id: DocumentId) {
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
            : Option.some(yield* toCollectionSchema(doc))
    })

const makeGetById = (
    findById: ReturnType<typeof makeFindById>
) =>
    Effect.fn("zvec.getById")(function* (id: DocumentId) {
        const maybeDocument = yield* findById(id)

        if (Option.isNone(maybeDocument)) {
            return yield* new DocumentNotFound({ id })
        }

        return maybeDocument.value
    })

const makeUpsert = (
    collection: RawZVecCollection,
    dimension: number
) =>
    Effect.fn("zvec.upsert")(function* (payload: UpsertPayload) {
        yield* ensureVectorDimension(payload.vector, dimension)

        const createdAt = new Date()

        const doc = yield* toZvecDoc(payload, createdAt)

        const status = yield* Effect.try({
            try: () => collection.upsertSync(doc),
            catch: (cause) =>
                new VectorDBError({
                    message: `Failed to upsert document ${payload.id}`,
                    cause,
                }),
        })

        yield* checkStatus(
            status,
            `Failed to upsert document ${payload.id}`
        )

        return yield* payloadToCollectionSchema(
            payload,
            createdAt
        )
    })

const makeUpsertMany = (
    collection: RawZVecCollection,
    dimension: number
) =>
    Effect.fn("zvec.upsertMany")(function* (
        payloads: ReadonlyArray<UpsertPayload>
    ) {
        yield* ensurePayloadDimensions(payloads, dimension)

        const createdAt = new Date()

        const docs = yield* Effect.forEach(
            payloads,
            (payload) => toZvecDoc(payload, createdAt)
        )

        const statuses = yield* Effect.try({
            try: () => collection.upsertSync(docs),
            catch: (cause) =>
                new VectorDBError({
                    message: "Failed to upsert documents",
                    cause,
                }),
        })

        yield* checkStatuses(
            statuses,
            "Failed to upsert documents"
        )

        return yield* Effect.forEach(
            payloads,
            (payload) =>
                payloadToCollectionSchema(
                    payload,
                    createdAt
                )
        )
    })

const makeDeleteById = (
    collection: RawZVecCollection,
    getById: ReturnType<typeof makeGetById>
) =>
    Effect.fn("zvec.delete")(function* (id: DocumentId) {
        yield* getById(id)

        const status = yield* Effect.try({
            try: () => collection.deleteSync(id),
            catch: (cause) =>
                new VectorDBError({
                    message: `Failed to delete document ${id}`,
                    cause,
                }),
        })

        yield* checkStatus(
            status,
            `Failed to delete document ${id}`
        )
    })

const makeDeleteWhere = (
    collection: RawZVecCollection
) =>
    Effect.fn("zvec.deleteWhere")(function* (
        filter: QueryFilter
    ) {
        const deleted = (
            yield* queryAll(collection, filter, undefined)
        ).length

        const status = yield* Effect.try({
            try: () =>
                collection.deleteByFilterSync(
                    buildFilter(filter) ?? ""
                ),
            catch: (cause) =>
                new VectorDBError({
                    message:
                        "Failed to delete documents by filter",
                    cause,
                }),
        })

        yield* checkStatus(
            status,
            "Failed to delete documents by filter"
        )

        return deleted
    })

const makeSearch = (
    collection: RawZVecCollection,
    dimension: number
) =>
    Effect.fn("zvec.search")(function* (
        queryVector: Vector,
        limit: number,
        filter?: QueryFilter
    ) {
        yield* ensureVectorDimension(
            queryVector,
            dimension
        )

        const docs = yield* Effect.try({
            try: () =>
                collection.querySync(
                    withFilter(
                        {
                            fieldName: VECTOR_FIELD,
                            vector: queryVector,
                            topk: limit,
                        },
                        buildFilter(filter)
                    )
                ),
            catch: (cause) =>
                new VectorDBError({
                    message: "Vector search failed",
                    cause,
                }),
        })

        return yield* Effect.forEach(docs, (doc) =>
            Effect.gen(function* () {
                return {
                    document: yield* toCollectionSchema(doc),
                    score: 1 - doc.score,
                } satisfies SearchResult
            })
        )
    })

const makeList = (
    collection: RawZVecCollection
) =>
    Effect.fn("zvec.list")(function* (
        filter?: QueryFilter,
        pagination?: Pagination
    ) {
        const docs = yield* queryAll(
            collection,
            filter,
            pagination
        )

        return yield* Effect.forEach(
            docs,
            toCollectionSchema
        )
    })

const makePruneExpired = (
    collection: RawZVecCollection
) =>
    Effect.fn("zvec.pruneExpired")(function* (
        asOf: Date
    ) {
        const expiredFilter = buildExpiredFilter(asOf)

        const deleted = yield* Effect.try({
            try: () =>
                collection.querySync({
                    topk: collection.stats.docCount,
                    filter: expiredFilter,
                }).length,
            catch: (cause) =>
                new VectorDBError({
                    message:
                        "Failed to count expired documents before pruning",
                    cause,
                }),
        })

        const status = yield* Effect.try({
            try: () =>
                collection.deleteByFilterSync(
                    expiredFilter
                ),
            catch: (cause) =>
                new VectorDBError({
                    message:
                        "Failed to prune expired documents",
                    cause,
                }),
        })

        yield* checkStatus(
            status,
            "Failed to prune expired documents"
        )

        return deleted
    })

const makeCount = (
    collection: RawZVecCollection
) =>
    Effect.fn("zvec.count")(function* (
        filter?: QueryFilter
    ) {
        if (filter === undefined) {
            return yield* Effect.try({
                try: () => collection.stats.docCount,
                catch: (cause) =>
                    new VectorDBError({
                        message:
                            "Failed to count documents",
                        cause,
                    }),
            })
        }

        return (
            yield* queryAll(
                collection,
                filter,
                undefined
            )
        ).length
    })

export const ZvecVectorDBLive = Layer.effect(
    VectorDB,
    Effect.gen(function* () {
        const {
            collection,
            dimension,
        } = yield* ZvecSdk

        const findById = makeFindById(collection)

        const getById = makeGetById(findById)

        return {
            upsert: makeUpsert(collection, dimension),
            upsertMany: makeUpsertMany(
                collection,
                dimension
            ),
            delete: makeDeleteById(
                collection,
                getById
            ),
            deleteWhere: makeDeleteWhere(collection),
            findById,
            getById,
            search: makeSearch(
                collection,
                dimension
            ),
            list: makeList(collection),
            pruneExpired: makePruneExpired(
                collection
            ),
            count: makeCount(collection),
        }
    })
)
