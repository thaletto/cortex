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
import { VECTOR_FIELD } from "./constants.ts"
import { ZvecSdkConfig } from "./config.ts"
import { lift } from "./effects.ts"
import { makeCollectionSchema } from "./schema.ts"

let initialized = false

export class ZvecSdk extends Context.Service<ZvecSdk, {
    readonly collection: RawZVecCollection
    readonly dimension: number
}>()("@/adapters/zvec/ZvecSdk") { }

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
                    return yield* lift(
                        () => ZVecOpen(config.path, options),
                        `Failed to open zvec collection at ${config.path}`
                    )
                }

                return yield* lift(
                    () =>
                        ZVecCreateAndOpen(
                            config.path,
                            makeCollectionSchema(collectionName, dimension),
                            options
                        ),
                    `Failed to create zvec collection at ${config.path}`
                )
            }),
            function closeCollection(collection) {
                return lift(
                    () => collection.closeSync(),
                    `Failed to close zvec collection at ${config.path}`
                ).pipe(Effect.orDie)
            }
        )

        const actualDimension = collection.schema.vector(VECTOR_FIELD).dimension ?? dimension

        return { collection, dimension: actualDimension }
    })
)
