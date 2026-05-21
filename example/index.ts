/**
 * @file
 * Example: bulk-upsert + search-quality evaluation against a biomedical claim dataset.
 * */
import { Console, Effect, FileSystem, Layer } from "effect"
import { BunRuntime, BunFileSystem, BunPath } from "@effect/platform-bun"

import { VectorDB, DocumentId, Vector } from "@thaletto/cortex"
import { DefaultVectorDBLive } from "@thaletto/zvec"

const in30Days = () => new Date(Date.now() + 30 * 864e5)

/** Deterministic char-code embedding. Projects text onto a unit vector of `dim` dimensions. */
function embed(text: string, dim = 384): Vector {
    const v = new Array<number>(dim).fill(0)
    for (let i = 0; i < text.length; i++) v[i % dim]! += text.charCodeAt(i)
    const mag = Math.sqrt(v.reduce((a, b) => a + b * b, 0))
    if (mag > 0) for (let i = 0; i < dim; i++) v[i]! /= mag
    return Vector.make(v)
}

/**
 * Loads biomedical claims from queries.jsonl, upserts them into the vector DB,
 * then evaluates search quality using shared PubMed IDs as the relevance signal.
 */
const program = Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const db = yield* VectorDB

    const raw = yield* fs.readFileString("./example/queries.jsonl")
    const entries: Array<{ _id: string; text: string; metadata: Record<string, unknown> }> = raw.trim().split("\n").map(l => JSON.parse(l))

    const pmidToDocs = new Map<string, Set<string>>()
    for (const e of entries) {
        for (const pmid of Object.keys(e.metadata)) {
            if (!pmidToDocs.has(pmid)) pmidToDocs.set(pmid, new Set())
            pmidToDocs.get(pmid)!.add(e._id)
        }
    }

    const docs = entries.map(e => ({
        id: DocumentId.make(e._id),
        content: e.text,
        category: Object.keys(e.metadata).length > 0 ? "annotated" : "plain",
        tags: JSON.stringify(Object.keys(e.metadata)),
        metadata_json: JSON.stringify(e.metadata),
        vector: embed(e.text),
        expires_at: in30Days(),
    }))

    for (let i = 0; i < docs.length; i += 500) {
        yield* db.upsertMany(docs.slice(i, i + 500))
    }

    let tp = 0, fp = 0, fn = 0, queries = 0
    for (const e of entries) {
        const pmids = Object.keys(e.metadata).filter(p => (pmidToDocs.get(p)?.size ?? 0) > 1)
        if (pmids.length === 0) continue

        const expected = new Set<string>()
        for (const pmid of pmids) {
            for (const id of pmidToDocs.get(pmid)!) {
                if (id !== e._id) expected.add(id)
            }
        }
        if (expected.size === 0) continue

        queries++
        const results = yield* db.search(embed(e.text), 10)
        const returned = new Set(results.map(r => r.document.id).filter(id => id !== e._id))

        tp += [...returned].filter(id => expected.has(id)).length
        fp += [...returned].filter(id => !expected.has(id)).length
        fn += [...expected].filter(id => !returned.has(DocumentId.make(id))).length
    }

    const precision = tp / (tp + fp) || 0
    const recall = tp / (tp + fn) || 0
    const f1 = 2 * precision * recall / (precision + recall) || 0

    yield* Console.log(`\nDimension: 384  Queries: ${queries}  Docs: ${entries.length}`)
    yield* Console.log(`TP: ${tp}  FP: ${fp}  FN: ${fn}`)
    yield* Console.log(`Precision@10: ${(precision * 100).toFixed(1)}%`)
    yield* Console.log(`Recall@10:    ${(recall * 100).toFixed(1)}%`)
    yield* Console.log(`F1@10:        ${(f1 * 100).toFixed(1)}%`)
})

BunRuntime.runMain(
    Effect.provide(program, DefaultVectorDBLive.pipe(
        Layer.provideMerge(Layer.merge(BunFileSystem.layer, BunPath.layer))
    ))
)
