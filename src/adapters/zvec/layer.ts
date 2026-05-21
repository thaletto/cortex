/**
 * @file @/src/adapters/zvec/layer.ts
 * Composed Effect layer that wires zvec config, SDK, and VectorDB together.
 */

import { Layer } from "effect"
import { ZvecSdkConfigLive } from "./config.ts"
import { ZvecSdkLive } from "./sdk.ts"
import { ZvecVectorDBLive } from "./vector-db.ts"

const ZvecSdkLayer = ZvecSdkLive.pipe(Layer.provide(ZvecSdkConfigLive))

/** Composed layer that provides a fully-configured `VectorDB` service backed by zvec. */
export const VectorDBLive = ZvecVectorDBLive.pipe(
    Layer.provide(
        ZvecSdkLayer
    )
)
