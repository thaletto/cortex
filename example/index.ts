/**
 * example/index.ts
 *
 * Run:
 * bun run example/index.ts
 */

import {
	Console,
	Effect,
	FileSystem,
	Layer,
} from "effect"

import { BunRuntime, BunFileSystem, BunPath } from "@effect/platform-bun"

import { VectorDB, DocumentId, Vector } from "@/index"
import { VectorDBLive } from "@/adapters/zvec/index"

function embed(
	text: string,
	dimension = 384
): Vector {
	const vector = new Array<number>(dimension).fill(0)

	for (let i = 0; i < text.length; i++) {
		vector[i % dimension]! += text.charCodeAt(i)
	}

	let magnitude = 0

	for (const value of vector) {
		magnitude += value * value
	}

	magnitude = Math.sqrt(magnitude)

	if (magnitude > 0) {
		for (let i = 0; i < dimension; i++) {
			vector[i]! /= magnitude
		}
	}

	return Vector.make(vector)
}

function chunkText(
	text: string,
	chunkSize = 300
): string[] {
	const cleaned = text
		.replace(/\s+/g, " ")
		.trim()

	const chunks: string[] = []

	for (
		let index = 0;
		index < cleaned.length;
		index += chunkSize
	) {
		chunks.push(
			cleaned.slice(
				index,
				index + chunkSize
			)
		)
	}

	return chunks
}

const readSampleFile = Effect.fn(
	"example.readSampleFile"
)(function* () {
	const fs = yield* FileSystem.FileSystem

	return yield* fs.readFileString(
		"./example/sample.txt"
	)
})

const insertChunks = Effect.fn(
	"example.insertChunks"
)(function* (
	chunks: ReadonlyArray<string>
) {
	const db = yield* VectorDB

	for (const [index, chunk] of chunks.entries()) {
		yield* db.upsert({
			id: DocumentId.make(`chunk-${index}`),
			content: chunk,
			category: "sample",
			tags: `["example", "text"]`,
			metadata_json: `{
				chunkIndex: index,
			}`,
			vector: embed(chunk),
			expires_at: new Date(Date.now() + 7 * 864e5),
		})
	}

	yield* Console.log(
		`Inserted ${chunks.length} chunks`
	)
})

const searchDocuments = Effect.fn(
	"example.searchDocuments"
)(function* (query: string) {
	const db = yield* VectorDB

	const results = yield* db.search(
		embed(query),
		3
	)

	yield* Console.log(
		`\nQuery: ${query}\n`
	)

	for (const result of results) {
		yield* Console.log(
			`Score: ${result.score.toFixed(4)}`
		)

		yield* Console.log(
			result.document.content
		)

		yield* Console.log(
			"\n-------------------\n"
		)
	}
})

const program = Effect.gen(function* () {
	yield* Console.log(
		"\nReading sample.txt...\n"
	)

	const content = yield* readSampleFile()

	const chunks = chunkText(content)

	yield* Console.log(
		`Created ${chunks.length} chunks\n`
	)

	yield* insertChunks(chunks)

	yield* searchDocuments(
		"What does the document talk about?"
	)

	const db = yield* VectorDB

	const total = yield* db.count()

	yield* Console.log(
		`\nTotal documents: ${total}\n`
	)
})

const PlatformLive = Layer.merge(
	BunFileSystem.layer,
	BunPath.layer
)

const MainLive = VectorDBLive.pipe(
	Layer.provideMerge(PlatformLive)
)

BunRuntime.runMain(
	program.pipe(
		Effect.provide(MainLive)
	)
)