import { Effect, Console } from "effect"
import { VectorDB, DocumentId, Vector } from "@cortex/cortex"
import { DefaultVectorDBLive } from "@cortex/zvec"
import { NodeFileSystem, NodePath } from "@effect/platform-node"

/**
 * A simple "AI Memory" example.
 * We teach Cortex a few things about a user and then retrieve them Semantically.
 */

// Simple deterministic embedding mock for demonstration
const embed = (text: string) => {
    const v = new Array<number>(384).fill(0)
    for (let i = 0; i < text.length; i++) {
        v[i % 384] += text.charCodeAt(i)
    }
    const mag = Math.sqrt(v.reduce((a, b) => a + b * b, 0))
    return Vector.make(v.map(x => x / (mag || 1)))
}

const program = Effect.gen(function* () {
    const db = yield* VectorDB

    yield* Console.log("🧠 Cortex: Teaching the database some facts...")

    const facts = [
        { id: "fact-1", text: "The user prefers dark mode in all applications.", cat: "ui" },
        { id: "fact-2", text: "The user is a senior engineer who loves Effect and TypeScript.", cat: "bio" },
        { id: "fact-3", text: "The user is allergic to peanuts.", cat: "health" }
    ]

    yield* db.upsertMany(facts.map(f => ({
        id: DocumentId.make(f.id),
        content: f.text,
        category: f.cat,
        tags: f.cat,
        metadata_json: "{}",
        vector: embed(f.text),
        expires_at: new Date("2030-01-01")
    })))

    yield* Console.log("🔍 Cortex: Searching for 'coding preferences'...")

    const results = yield* db.search(embed("What does the user like to code with?"), 2)

    for (const { document, score } of results) {
        yield* Console.log(`\n[Score: ${score.toFixed(4)}]`)
        yield* Console.log(`> ${document.content}`)
    }
})

// Provide requirements: VectorDB (ZVec) + FileSystem (Node)
const MainLayer = DefaultVectorDBLive.pipe(
    Effect.provide(NodeFileSystem.layer),
    Effect.provide(NodePath.layer)
)

Effect.runPromise(program.pipe(Effect.provide(MainLayer)))
