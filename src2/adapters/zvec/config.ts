import { ZVecLogLevel, ZVecLogType } from "@zvec/zvec"
import { Context, Layer, Schema } from "effect"

export const ZvecInitOptions = Schema.Struct({
    logType: Schema.optional(Schema.Literals([ZVecLogType.CONSOLE, ZVecLogType.FILE])),
    logLevel: Schema.optional(Schema.Literals([
        ZVecLogLevel.DEBUG,
        ZVecLogLevel.INFO,
        ZVecLogLevel.WARN,
        ZVecLogLevel.ERROR,
        ZVecLogLevel.FATAL
    ])),
    logDir: Schema.optional(Schema.String),
    logBaseName: Schema.optional(Schema.String),
    logFileSize: Schema.optional(Schema.Number),
    logOverdueDays: Schema.optional(Schema.Number),
    queryThreads: Schema.optional(Schema.Number),
    optimizeThreads: Schema.optional(Schema.Number),
})
export type ZvecInitOptions = typeof ZvecInitOptions.Type

export const ZvecSdkConfigSchema = Schema.Struct({
    path: Schema.String,
    collectionName: Schema.optional(Schema.String),
    dimension: Schema.optional(
        Schema.Int.check(
            Schema.isBetween({
                minimum: 1,
                maximum: 65536,
            })
        )
    ),
    readOnly: Schema.optional(Schema.Boolean),
    enableMMAP: Schema.optional(Schema.Boolean),
    initialize: Schema.optional(ZvecInitOptions),
})
export type ZvecSdkConfigShape = typeof ZvecSdkConfigSchema.Type

export const decodeZvecSdkConfig = Schema.decodeUnknownEffect(ZvecSdkConfigSchema)

export class ZvecSdkConfig extends Context.Service<ZvecSdkConfig, ZvecSdkConfigShape>()("@/adapters/zvec/ZvecSdkConfig", {
    make: decodeZvecSdkConfig({
        path: ".cortex/zvec",
        collectionName: "cortex",
        dimension: 384,
        readOnly: false,
        enableMMAP: true,
    }),
}) { }

export const ZvecSdkConfigLive = Layer.effect(
    ZvecSdkConfig,
    ZvecSdkConfig.make
)
