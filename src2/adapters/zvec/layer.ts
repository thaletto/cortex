import { Layer } from "effect"
import { ZvecSdkConfig, ZvecSdkConfigLive, type ZvecSdkConfigShape } from "./config.ts"
import { ZvecSdkLive } from "./sdk.ts"
import { ZvecVectorDBLive } from "./vector-db.ts"

export { VECTOR_FIELD } from "./constants.ts"
export { ZvecSdkConfig, ZvecSdkConfigLive, type ZvecSdkConfigShape } from "./config.ts"
export { ZvecSdk, ZvecSdkLive } from "./sdk.ts"
export { ZvecVectorDBLive } from "./vector-db.ts"

export function makeZvecLive(config: ZvecSdkConfigShape) {
    return ZvecVectorDBLive.pipe(
        Layer.provide(
            ZvecSdkLive.pipe(
                Layer.provide(Layer.succeed(ZvecSdkConfig)(config))
            )
        )
    )
}

export const ZvecLive = ZvecVectorDBLive.pipe(
    Layer.provide(
        ZvecSdkLive.pipe(
            Layer.provide(ZvecSdkConfigLive)
        )
    )
)
