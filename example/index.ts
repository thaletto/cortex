import { embed } from 'ai';
import { VectorDB, DocumentId, Vector } from '@thaletto/cortex'
import { Effect, FileSystem, Console, Layer } from 'effect';
import { BunRuntime, BunFileSystem, BunPath } from "@effect/platform-bun"
import { DefaultVectorDBLive } from "@thaletto/zvec"

const VectorString = Effect.fn("VectorString")(function* (value: string) {
    const { embedding } = yield* Effect.promise(() =>
        embed({
            model: 'google/text-embedding-005',
            value
        })
    )

    return Vector.make(embedding)
})

interface BaseEntry {
    _id: string
    text: string
    metadata: Record<string, unknown>
}

const FileToDocs = <T extends BaseEntry>() => Effect.fn("FileToDocs")(function* (path: string) {
    const fs = yield* FileSystem.FileSystem

    const rawText = yield* fs.readFileString(path)
    const entries = rawText.trim().split("\n").map(l => JSON.parse(l)) as Array<T>

    const docEffects = entries.map(e =>
        Effect.gen(function* () {
            const vector = yield* VectorString(e.text)

            return {
                id: DocumentId.make(e._id),
                content: e.text,
                metadata_json: JSON.stringify(Object.keys(e.metadata)),
                category: Object.keys(e.metadata).length > 0 ? "annotated" : "plain",
                tags: JSON.stringify(Object.keys(e.metadata)),
                vector: vector,
                expires_at: new Date(Date.now() + 30 * 864e5),
            } as const
        })
    )

    const docs = yield* Effect.all(docEffects)
    return docs
})


const program = Effect.gen(function* () {
    const memory = yield* VectorDB

    const fileToDocsEffect = FileToDocs<BaseEntry>()
    const docs = yield* fileToDocsEffect("./queries.jsonl")

    for (let i = 0; i < docs.length; i += 500) {
        yield* memory.upsertMany(docs.slice(i, i + 500))
    }

    const searchQueries: string[] = []

    for (const query of searchQueries) {
        const vector = yield* VectorString(query)
        const results = yield* memory.search(vector, 3)
        
        yield* Console.log(`Search results for "${query}":`)
        for (const result of results) {
            yield* Console.log(`- ${result.document.content}\nID: ${result.document.id}\nConfidence: ${result.score}`)
        }
    }

})

const BunLayer = Layer.merge(BunFileSystem.layer, BunPath.layer)

const programLive = program.pipe(
    Effect.provide(DefaultVectorDBLive.pipe(
        Layer.provideMerge(Layer.merge(BunFileSystem.layer, BunPath.layer))
    ))
)

BunRuntime.runMain(programLive)