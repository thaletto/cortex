import { Layer } from "effect"
import { ZvecSdkConfigLive } from "./config.ts"
import { ZvecSdkLive } from "./sdk.ts"
import { ZvecVectorDBLive } from "./vector-db.ts"

/**
 * A Layer that provides the VectorDB service using the ZVec adapter.
 * 
 * It requires ZvecSdkConfig to be provided in the environment.
 * 
 * @example
 * import { VectorDBLive, ZvecSdkConfig } from "@cortex/zvec"
 * import { Layer } from "effect"
 * 
 * const layer = VectorDBLive.pipe(
 *   Layer.provide(Layer.succeed(ZvecSdkConfig, { path: "./db", dimension: 128 }))
 * )
 */
export const VectorDBLive = ZvecVectorDBLive.pipe(
    Layer.provide(ZvecSdkLive)
)

/**
 * A Layer that provides the VectorDB service with default configuration:
 * - path: ".cortex/zvec"
 * - dimension: 384
 * - collectionName: "cortex"
 */
export const DefaultVectorDBLive = VectorDBLive.pipe(
    Layer.provide(ZvecSdkConfigLive)
)
