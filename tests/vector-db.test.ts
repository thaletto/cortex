import { describe, it, expect, beforeAll, afterAll, afterEach } from "@effect/vitest"
import { Effect, Layer, FileSystem, Option } from "effect"
import { NodeFileSystem, NodePath } from "@effect/platform-node"
import { CollectionSchema, type SearchResult, VectorDB, DocumentId, Vector, DocumentNotFound } from "@cortex/cortex"
import { ZvecVectorDBLive, ZvecSdkLive, ZvecSdkConfig, decodeZvecSdkConfig } from "@cortex/zvec"

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

const run = <A>(effect: any): Promise<A> =>
  Effect.runPromise(effect)

let db: any

const cleanup: Array<string> = []

function track(id: string): DocumentId {
  cleanup.push(id)
  return DocumentId.make(id)
}

describe("VectorDB (zvec)", () => {
  beforeAll(async () => {
    await Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem
      yield* fs.remove(TEST_DIR, { recursive: true, force: true })
    }).pipe(Effect.provide(NodeFileSystem.layer), Effect.runPromise)

    db = await Effect.runPromise((VectorDB as any).pipe(Effect.provide(TestLayer)))
  })

  afterEach(async () => {
    const ids = cleanup.splice(0)
    for (const id of ids) {
      await run(db.delete(DocumentId.make(id)))
    }
  })

  afterAll(async () => {
    await Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem
      yield* fs.remove(TEST_DIR, { recursive: true, force: true })
    }).pipe(Effect.provide(NodeFileSystem.layer), Effect.runPromise)
  })

  it("upserts and finds a document by id", async () => {
    await run(db.upsert(upsertPayload(track("find-a"), vx)))
    const found = await run<Option.Option<CollectionSchema>>(db.findById(DocumentId.make("find-a")))
    expect(Option.isSome(found)).toBe(true)
    expect(Option.getOrThrow(found).content).toBe("test content")
  })

  it("returns DocumentNotFound for missing getById", async () => {
    const result = await run(db.getById(DocumentId.make("missing")).pipe(Effect.flip))
    expect(result).toBeInstanceOf(DocumentNotFound)
  })

  it("returns None for missing findById", async () => {
    const result = await run<Option.Option<CollectionSchema>>(db.findById(DocumentId.make("nowhere")))
    expect(Option.isNone(result)).toBe(true)
  })

  it("delete removes a document", async () => {
    await run(db.upsert(upsertPayload(track("del-me"), vx)))
    await run(db.delete(DocumentId.make("del-me")))
    cleanup.pop()
    const found = await run<Option.Option<CollectionSchema>>(db.findById(DocumentId.make("del-me")))
    expect(Option.isNone(found)).toBe(true)
  })

  it("delete fails with DocumentNotFound for missing id", async () => {
    const result = await run(db.delete(DocumentId.make("no-such")).pipe(Effect.flip))
    expect(result).toBeInstanceOf(DocumentNotFound)
  })

  it("upsertMany stores all documents", async () => {
    const docs = await run<ReadonlyArray<CollectionSchema>>(db.upsertMany([
      upsertPayload(track("batch-a"), vx, { content: "A" }),
      upsertPayload(track("batch-b"), vy, { content: "B" }),
    ]))
    expect(docs).toHaveLength(2)
    expect(docs[0]!.content).toBe("A")
    expect(docs[1]!.content).toBe("B")
  })

  it("search returns nearest vectors first", async () => {
    await run(db.upsert(upsertPayload(track("s-exact"), vx)))
    await run(db.upsert(upsertPayload(track("s-close"), vy)))
    await run(db.upsert(upsertPayload(track("s-far"), vz)))

    const results = await run<ReadonlyArray<SearchResult>>(db.search(vx, 10))
    expect(results).toHaveLength(3)
    expect(results[0]!.document.id).toBe(DocumentId.make("s-exact"))
    expect(results[0]!.score).toBeGreaterThan(0.9)
  })

  it("search respects limit", async () => {
    await run(db.upsert(upsertPayload(track("lim-a"), vx)))
    await run(db.upsert(upsertPayload(track("lim-b"), vy)))

    const results = await run<ReadonlyArray<SearchResult>>(db.search(vx, 1))
    expect(results).toHaveLength(1)
  })

  it("search filters by category", async () => {
    await run(db.upsert(upsertPayload(track("cat-a"), vx, { category: "important" })))
    await run(db.upsert(upsertPayload(track("cat-b"), vx, { category: "other" })))

    const results = await run<ReadonlyArray<SearchResult>>(db.search(vx, 10, { category: "important" }))
    expect(results).toHaveLength(1)
    expect(results[0]!.document.id).toBe(DocumentId.make("cat-a"))
  })

  it("search excludes expired documents", async () => {
    await run(db.upsert(upsertPayload(track("ttl-active"), vx, { expires_at: tomorrow() })))
    await run(db.upsert(upsertPayload(track("ttl-expired"), vx, { expires_at: yesterday() })))

    const results = await run<ReadonlyArray<SearchResult>>(db.search(vx, 10, { activeAt: new Date() }))
    expect(results).toHaveLength(1)
    expect(results[0]!.document.id).toBe(DocumentId.make("ttl-active"))
  })

  it("list returns all documents", async () => {
    await run(db.upsert(upsertPayload(track("list-a"), vx)))
    await run(db.upsert(upsertPayload(track("list-b"), vy)))

    const docs = await run<ReadonlyArray<CollectionSchema>>(db.list())
    expect(docs.length).toBeGreaterThanOrEqual(2)
  })

  it("list supports pagination", async () => {
    for (let i = 0; i < 3; i++) {
      await run(db.upsert(upsertPayload(track(`pg-${i}`), vx)))
    }

    const page = await run<ReadonlyArray<CollectionSchema>>(db.list(undefined, { limit: 2, offset: 0 }))
    expect(page).toHaveLength(2)
  })

  it("deleteWhere removes matching documents", async () => {
    await run(db.upsert(upsertPayload(track("dwa"), vx, { category: "remove" })))
    await run(db.upsert(upsertPayload(track("dwb"), vx, { category: "keep" })))

    const deleted = await run<number>(db.deleteWhere({ category: "remove" }))
    expect(deleted).toBe(1)
    cleanup.pop()

    const found = await run<Option.Option<CollectionSchema>>(db.findById(DocumentId.make("dwa")))
    expect(Option.isNone(found)).toBe(true)
  })

  it("pruneExpired removes only expired documents", async () => {
    await run(db.upsert(upsertPayload(track("prune-expired"), vx, { expires_at: yesterday() })))
    await run(db.upsert(upsertPayload(track("prune-active"), vy, { expires_at: tomorrow() })))

    const pruned = await run<number>(db.pruneExpired(new Date()))
    expect(pruned).toBe(1)
    cleanup.pop()

    const found = await run<Option.Option<CollectionSchema>>(db.findById(DocumentId.make("prune-expired")))
    expect(Option.isNone(found)).toBe(true)
  })

  it("count returns total documents", async () => {
    await run(db.upsert(upsertPayload(track("cnt-a"), vx)))
    await run(db.upsert(upsertPayload(track("cnt-b"), vy)))

    const total = await run<number>(db.count())
    expect(total).toBeGreaterThanOrEqual(2)
  })

  it("count supports filter", async () => {
    await run(db.upsert(upsertPayload(track("cf-a"), vx, { category: "count-me" })))
    await run(db.upsert(upsertPayload(track("cf-b"), vy, { category: "other" })))

    const count = await run<number>(db.count({ category: "count-me" }))
    expect(count).toBe(1)
  })
})
