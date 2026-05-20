import { Layer } from "effect"
import { ZvecSdkConfigLive } from "./config.ts"
import { ZvecSdkLive } from "./sdk.ts"
import { ZvecVectorDBLive } from "./vector-db.ts"

const ZvecSdkLayer = ZvecSdkLive.pipe(Layer.provide(ZvecSdkConfigLive))

export const VectorDBLive = ZvecVectorDBLive.pipe(
    Layer.provide(
        ZvecSdkLayer
    )
)
