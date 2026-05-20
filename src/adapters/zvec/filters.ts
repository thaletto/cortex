import type { QueryFilter } from "../../schema/index.ts"

function escapeFilterValue(value: string): string {
    return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'")
}

export function buildFilter(filter: QueryFilter | undefined): string | undefined {
    if (filter === undefined) {
        return undefined
    }

    const parts: Array<string> = []

    if (filter.category !== undefined) {
        parts.push(`category = '${escapeFilterValue(filter.category)}'`)
    }

    for (const tag of filter.tags ?? []) {
        parts.push(`'${escapeFilterValue(tag)}' IN tags`)
    }

    if (filter.activeAt !== undefined) {
        parts.push(`expires_at > ${filter.activeAt.getTime()}`)
    }

    return parts.length === 0 ? undefined : parts.join(" AND ")
}

export function buildExpiredFilter(asOf: Date): string {
    return `expires_at <= ${asOf.getTime()}`
}

export function withFilter<A extends object>(query: A, filter: string | undefined): A | A & { readonly filter: string } {
    return filter === undefined
        ? query
        : { ...query, filter }
}
