# [Cortex](https://cortex-vector.vercel.app/)

The ORM for vector databases, built with [Effect](https://effect.website) and [ZVec](https://github.com/zvec/zvec). Type-safe, pluggable, and designed for explicit memory management.

## Install

```bash
bun add @cortex/cortex @cortex/zvec
```

## Quick Start

```typescript
import { Effect } from "effect";
import { VectorDB, DocumentId, Vector } from "@cortex/cortex";

const program = Effect.gen(function* () {
  const db = yield* VectorDB;

  const id = DocumentId.make("user-1-preference");
  
  yield* db.upsert({
    id,
    content: "User prefers TypeScript over JavaScript",
    category: "preferences",
    tags: "typescript",
    metadata_json: JSON.stringify({ source: "onboarding" }),
    vector: Vector.make(new Array(384).fill(0)),
    expires_at: new Date("2026-12-31"),
  });
});
```

## API

### VectorDB

| Method | Signature | Description |
|--------|-----------|-------------|
| `upsert` | `(payload) => Effect<CollectionSchema, VectorDBError>` | Upsert a vector + metadata |
| `search` | `(vector, limit, filter?) => Effect<SearchResult[], VectorDBError>` | Nearest-neighbour search |
| `findById` | `(id) => Effect<Option<CollectionSchema>, VectorDBError>` | Fetch by ID |
| `delete` | `(id) => Effect<void, VectorDBError>` | Remove entry |
| `count` | `(filter?) => Effect<number, VectorDBError>` | Count records |

## Adapters

### ZVec (default)

Persistent, in-process vector database with WAL persistence. Configured via `ZvecSdkConfig`:

```typescript
import { ZvecVectorDBLive, ZvecSdkLive, ZvecSdkConfig } from "@cortex/zvec";

const layer = Layer.provide(
  ZvecVectorDBLive,
  Layer.provide(ZvecSdkLive, Layer.succeed(ZvecSdkConfig, { path: ".cortex", dimension: 128 }))
);
```

Data is stored in `.cortex/`.

## Demo

```bash
bun run example
```

## Development

```bash
bun install
bun test
bun run example
```

## License

MIT
