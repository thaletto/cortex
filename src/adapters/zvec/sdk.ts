/**
 * @file @/src/adapters/zvec/sdk.ts
 * Open or create a zvec collection and expose it as an Effect service.
 */

import {
    ZVecCreateAndOpen,
    ZVecInitialize,
    ZVecLogLevel,
    ZVecLogType,
    ZVecOpen,
    type ZVecCollection as RawZVecCollection,
    type ZVecInitOptions,
} from "@zvec/zvec"
import { Context, Effect, FileSystem, Layer, Path } from "effect"
import { VectorDBError } from "../../schema/index.ts"
import { VECTOR_FIELD } from "./constants.ts"
import { ZvecSdkConfig } from "./config.ts"
import { makeCollectionSchema } from "./schema.ts"

let initialized = false

/** Holds an open zvec collection handle and its configured dimension. */
export class ZvecSdk extends Context.Service<ZvecSdk, {
    readonly collection: RawZVecCollection
    readonly dimension: number
}>()("@/adapters/zvec/ZvecSdk") { }

/** Ensure the zvec runtime is initialized (no-op after the first call). */
const ensureInitialized = Effect.fn("zvec.ensureInitialized")(function* (options: ZVecInitOptions | undefined) {
    yield* Effect.sync(function initializeZvec() {
        if (initialized) {
            return
        }

        ZVecInitialize(options ?? {
            logLevel: ZVecLogLevel.FATAL,
            logType: ZVecLogType.CONSOLE,
        })
        initialized = true
    })
})

/** Layer that opens or creates a zvec collection and exposes it as a `ZvecSdk` service. */
export const ZvecSdkLive = Layer.effect(
    ZvecSdk,
    Effect.gen(function* () {
        const config = yield* ZvecSdkConfig
        const fileSystem = yield* FileSystem.FileSystem
        const path = yield* Path.Path
        const dimension = config.dimension ?? 384
        const collectionName = config.collectionName ?? "cortex"
        const options = {
            readOnly: config.readOnly ?? false,
            enableMMAP: config.enableMMAP ?? true,
        }

        const collection = yield* Effect.acquireRelease(
            Effect.gen(function* () {
                yield* ensureInitialized(config.initialize as ZVecInitOptions | undefined)
                yield* fileSystem.makeDirectory(path.dirname(config.path), { recursive: true })
                const exists = yield* fileSystem.exists(config.path)

                if (exists) {
                    return yield* Effect.try({
                        try: () => ZVecOpen(config.path, options),
                        catch: (cause) =>
                            new VectorDBError({
                                message: `Failed to open zvec collection at ${config.path}`,
                                cause,
                            }),
                    })
                }

                const collectionSchema = yield* makeCollectionSchema(collectionName, dimension)

                return yield* Effect.try({
                    try: () =>
                        ZVecCreateAndOpen(
                            config.path,
                            collectionSchema,
                            options
                        ),
                    catch: (cause) =>
                        new VectorDBError({
                            message: `Failed to create zvec collection at ${config.path}`,
                            cause,
                        }),
                })
            }),
            function closeCollection(collection) {
                return Effect.try({
                    try: () => collection.closeSync(),
                    catch: (cause) =>
                        new VectorDBError({
                            message: `Failed to close zvec collection at ${config.path}`,
                            cause,
                        }),
                }).pipe(Effect.orDie)
            }
        )

        const actualDimension = collection.schema.vector(VECTOR_FIELD).dimension ?? dimension

        return { collection, dimension: actualDimension }
    })
)
