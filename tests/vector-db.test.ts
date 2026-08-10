import { expect, layer } from "@effect/vitest"
import { describe, beforeAll, afterAll } from "vitest"
import { Effect, Layer, FileSystem, Option } from "effect"
import { NodeFileSystem, NodePath } from "@effect/platform-node"
import { VectorDB, DocumentId, Vector, DocumentNotFound } from "@thaletto/cortex"
import { ZvecVectorDBLive, ZvecSdkLive, ZvecSdkConfig, decodeZvecSdkConfig } from "@thaletto/zvec"

const DIM = 128
const TEST_DIR = ".cortex"

const unit = (axis: number): Vector => {
  const v = new Array<number>(DIM).fill(0)
  v[axis] = 1
  return Vector.make(v)
}

const vx = unit(0)
const vy = unit(1)
const vz = unit(2)

const tomorrow = () => new Date(Date.now() + 86400000)
const yesterday = () => new Date(Date.now() - 86400000)

const upsertPayload = (id: string, vector: Vector, overrides?: Partial<{
  content: string
  category: string
  tags: string
  expires_at: Date
}>) => ({
  id: DocumentId.make(id),
  content: overrides?.content ?? "test content",
  category: overrides?.category ?? "test",
  tags: overrides?.tags ?? "tag1",
  metadata_json: "{}",
  vector,
  expires_at: overrides?.expires_at ?? tomorrow(),
})

const TestLayer = Layer.provideMerge(
  Layer.provide(ZvecVectorDBLive, Layer.provide(ZvecSdkLive,
    Layer.effect(ZvecSdkConfig, decodeZvecSdkConfig({ path: TEST_DIR, dimension: DIM }))
  )),
  Layer.merge(NodeFileSystem.layer, NodePath.layer)
)

const removeTestDir = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem
  yield* fs.remove(TEST_DIR, { recursive: true, force: true })
}).pipe(Effect.provide(NodeFileSystem.layer))

const cleanup: Array<string> = []

function track(id: string): DocumentId {
  cleanup.push(id)
  return DocumentId.make(id)
}

const sweep = Effect.gen(function* () {
  const db = yield* VectorDB
  yield* Effect.forEach(
    cleanup.splice(0),
    (id) => db.delete(DocumentId.make(id)).pipe(
      Effect.catchTag("DocumentNotFound", () => Effect.void)
    )
  )
})

describe("VectorDB (zvec)", () => {
  beforeAll(async () => {
    await Effect.runPromise(removeTestDir)
  })

  afterAll(async () => {
    await Effect.runPromise(removeTestDir)
  })

  layer(TestLayer)((it) => {
    it.effect("upserts and finds a document by id", () =>
      Effect.gen(function* () {
        const db = yield* VectorDB
        yield* db.upsert(upsertPayload(track("find-a"), vx))
        const found = yield* db.findById(DocumentId.make("find-a"))
        expect(Option.isSome(found)).toBe(true)
        expect(Option.getOrThrow(found).content).toBe("test content")
        yield* sweep
      })
    )

    it.effect("returns DocumentNotFound for missing getById", () =>
      Effect.gen(function* () {
        const db = yield* VectorDB
        const result = yield* db.getById(DocumentId.make("missing")).pipe(Effect.flip)
        expect(result).toBeInstanceOf(DocumentNotFound)
      })
    )

    it.effect("returns None for missing findById", () =>
      Effect.gen(function* () {
        const db = yield* VectorDB
        const result = yield* db.findById(DocumentId.make("nowhere"))
        expect(Option.isNone(result)).toBe(true)
      })
    )

    it.effect("delete removes a document", () =>
      Effect.gen(function* () {
        const db = yield* VectorDB
        yield* db.upsert(upsertPayload(track("del-me"), vx))
        yield* db.delete(DocumentId.make("del-me"))
        const found = yield* db.findById(DocumentId.make("del-me"))
        expect(Option.isNone(found)).toBe(true)
        yield* sweep
      })
    )

    it.effect("delete fails with DocumentNotFound for missing id", () =>
      Effect.gen(function* () {
        const db = yield* VectorDB
        const result = yield* db.delete(DocumentId.make("no-such")).pipe(Effect.flip)
        expect(result).toBeInstanceOf(DocumentNotFound)
      })
    )

    it.effect("upsertMany stores all documents", () =>
      Effect.gen(function* () {
        const db = yield* VectorDB
        const docs = yield* db.upsertMany([
          upsertPayload(track("batch-a"), vx, { content: "A" }),
          upsertPayload(track("batch-b"), vy, { content: "B" }),
        ])
        expect(docs).toHaveLength(2)
        expect(docs[0]!.content).toBe("A")
        expect(docs[1]!.content).toBe("B")
        yield* sweep
      })
    )

    it.effect("search returns nearest vectors first", () =>
      Effect.gen(function* () {
        const db = yield* VectorDB
        yield* db.upsert(upsertPayload(track("s-exact"), vx))
        yield* db.upsert(upsertPayload(track("s-close"), vy))
        yield* db.upsert(upsertPayload(track("s-far"), vz))

        const results = yield* db.search(vx, 10)
        expect(results).toHaveLength(3)
        expect(results[0]!.document.id).toBe(DocumentId.make("s-exact"))
        expect(results[0]!.score).toBeGreaterThan(0.9)
        yield* sweep
      })
    )

    it.effect("search respects limit", () =>
      Effect.gen(function* () {
        const db = yield* VectorDB
        yield* db.upsert(upsertPayload(track("lim-a"), vx))
        yield* db.upsert(upsertPayload(track("lim-b"), vy))

        const results = yield* db.search(vx, 1)
        expect(results).toHaveLength(1)
        yield* sweep
      })
    )

    it.effect("search filters by category", () =>
      Effect.gen(function* () {
        const db = yield* VectorDB
        yield* db.upsert(upsertPayload(track("cat-a"), vx, { category: "important" }))
        yield* db.upsert(upsertPayload(track("cat-b"), vx, { category: "other" }))

        const results = yield* db.search(vx, 10, { category: "important" })
        expect(results).toHaveLength(1)
        expect(results[0]!.document.id).toBe(DocumentId.make("cat-a"))
        yield* sweep
      })
    )

    it.effect("search excludes expired documents", () =>
      Effect.gen(function* () {
        const db = yield* VectorDB
        yield* db.upsert(upsertPayload(track("ttl-active"), vx, { expires_at: tomorrow() }))
        yield* db.upsert(upsertPayload(track("ttl-expired"), vx, { expires_at: yesterday() }))

        const results = yield* db.search(vx, 10, { activeAt: new Date() })
        expect(results).toHaveLength(1)
        expect(results[0]!.document.id).toBe(DocumentId.make("ttl-active"))
        yield* sweep
      })
    )

    it.effect("list returns all documents", () =>
      Effect.gen(function* () {
        const db = yield* VectorDB
        yield* db.upsert(upsertPayload(track("list-a"), vx))
        yield* db.upsert(upsertPayload(track("list-b"), vy))

        const docs = yield* db.list()
        expect(docs.length).toBeGreaterThanOrEqual(2)
        yield* sweep
      })
    )

    it.effect("list supports pagination", () =>
      Effect.gen(function* () {
        const db = yield* VectorDB
        for (let i = 0; i < 3; i++) {
          yield* db.upsert(upsertPayload(track(`pg-${i}`), vx))
        }

        const page = yield* db.list(undefined, { limit: 2, offset: 0 })
        expect(page).toHaveLength(2)
        yield* sweep
      })
    )

    it.effect("deleteWhere removes matching documents", () =>
      Effect.gen(function* () {
        const db = yield* VectorDB
        yield* db.upsert(upsertPayload(track("dwa"), vx, { category: "remove" }))
        yield* db.upsert(upsertPayload(track("dwb"), vx, { category: "keep" }))

        const deleted = yield* db.deleteWhere({ category: "remove" })
        expect(deleted).toBe(1)

        const found = yield* db.findById(DocumentId.make("dwa"))
        expect(Option.isNone(found)).toBe(true)
        yield* sweep
      })
    )

    it.effect("pruneExpired removes only expired documents", () =>
      Effect.gen(function* () {
        const db = yield* VectorDB
        yield* db.upsert(upsertPayload(track("prune-expired"), vx, { expires_at: yesterday() }))
        yield* db.upsert(upsertPayload(track("prune-active"), vy, { expires_at: tomorrow() }))

        const pruned = yield* db.pruneExpired(new Date())
        expect(pruned).toBe(1)

        const found = yield* db.findById(DocumentId.make("prune-expired"))
        expect(Option.isNone(found)).toBe(true)
        yield* sweep
      })
    )

    it.effect("count returns total documents", () =>
      Effect.gen(function* () {
        const db = yield* VectorDB
        yield* db.upsert(upsertPayload(track("cnt-a"), vx))
        yield* db.upsert(upsertPayload(track("cnt-b"), vy))

        const total = yield* db.count()
        expect(total).toBeGreaterThanOrEqual(2)
        yield* sweep
      })
    )

    it.effect("count supports filter", () =>
      Effect.gen(function* () {
        const db = yield* VectorDB
        yield* db.upsert(upsertPayload(track("cf-a"), vx, { category: "count-me" }))
        yield* db.upsert(upsertPayload(track("cf-b"), vy, { category: "other" }))

        const count = yield* db.count({ category: "count-me" })
        expect(count).toBe(1)
        yield* sweep
      })
    )
  })
})