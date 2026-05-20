import {
    ZVecCollectionSchema,
    ZVecDataType,
    ZVecIndexType,
    ZVecMetricType,
} from "@zvec/zvec"

import { Effect } from "effect"

import { VECTOR_FIELD } from "./constants.ts"

export const makeCollectionSchema = Effect.fn("zvec.makeCollectionSchema")(function* (
    name: string,
    dimension: number
) {
    return new ZVecCollectionSchema({
        name,
        fields: [
            {
                name: "content",
                dataType: ZVecDataType.STRING,
                indexParams: {
                    indexType: ZVecIndexType.INVERT,
                },
            },
            {
                name: "category",
                dataType: ZVecDataType.STRING,
                indexParams: {
                    indexType: ZVecIndexType.INVERT,
                },
            },
            {
                name: "tags",
                dataType: ZVecDataType.ARRAY_STRING,
                indexParams: {
                    indexType: ZVecIndexType.INVERT,
                },
            },
            {
                name: "metadata_json",
                dataType: ZVecDataType.STRING,
            },
            {
                name: "created_at",
                dataType: ZVecDataType.INT64,
                indexParams: {
                    indexType: ZVecIndexType.INVERT,
                    enableRangeOptimization: true,
                },
            },
            {
                name: "expires_at",
                dataType: ZVecDataType.INT64,
                indexParams: {
                    indexType: ZVecIndexType.INVERT,
                    enableRangeOptimization: true,
                },
            },
        ],
        vectors: [
            {
                name: VECTOR_FIELD,
                dataType: ZVecDataType.VECTOR_FP32,
                dimension,
                indexParams: {
                    indexType: ZVecIndexType.HNSW,
                    metricType: ZVecMetricType.COSINE,
                },
            },
        ],
    })
})