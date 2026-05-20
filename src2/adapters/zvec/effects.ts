import type { ZVecStatus } from "@zvec/zvec"
import { Effect } from "effect"
import { DimensionMismatch, type Vector, VectorDBError } from "../../schema/index.ts"

export const lift = Effect.fn("zvec.lift")(function* <A>(evaluate: () => A, message: string) {
    return yield* Effect.try({
        try: evaluate,
        catch: function catchZvecError(cause) {
            return new VectorDBError({ message, cause })
        },
    })
})

export const statusToEffect = Effect.fn("zvec.statusToEffect")(function* (status: ZVecStatus, message: string) {
    if (status.ok) {
        return
    }

    return yield* new VectorDBError({
        message: `${message}: ${status.code} ${status.message}`,
    })
})

export const statusesToEffect = Effect.fn("zvec.statusesToEffect")(function* (statuses: ReadonlyArray<ZVecStatus>, message: string) {
    const failed = statuses.find((status) => !status.ok)
    if (failed === undefined) {
        return
    }

    return yield* new VectorDBError({
        message: `${message}: ${failed.code} ${failed.message}`,
    })
})

export const validateDimension = Effect.fn("zvec.validateDimension")(function* (vector: Vector, expected: number) {
    const actual = vector.length
    if (actual === expected) {
        return
    }

    return yield* new DimensionMismatch({ expected, actual })
})
