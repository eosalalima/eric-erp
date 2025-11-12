// app/api/diag/route.ts
import { NextResponse } from 'next/server'
import dns from 'node:dns/promises'
import { PrismaClient } from '@prisma/client'

type DiagnosticInfo = {
  nodeVersion?: string
  runtime?: string
  hasDatabaseUrl?: boolean
  hasDirectUrl?: boolean
  dbHost?: string
  dnsLookup?: Awaited<ReturnType<typeof dns.lookup>>
  prismaOk?: boolean
  dbNow?: unknown
  errorName?: string
  errorMessage?: string
  errorCode?: unknown
  errorMeta?: unknown
}

export const dynamic = 'force-dynamic' // disable caching

export async function GET() {
  const info: DiagnosticInfo = {}

  try {
    info.nodeVersion = process.version
    info.runtime = 'node'
    info.hasDatabaseUrl = Boolean(process.env.DATABASE_URL)
    info.hasDirectUrl = Boolean(process.env.DIRECT_URL)

    // Extract host without port
    const rawHost = (process.env.DIRECT_URL || '')
      .split('@')
      .pop()
      ?.split('/')[0]
      ?.split('?')[0]

    const host = rawHost?.split(':')[0] // strip port if present

    if (host) {
      info.dbHost = host
      info.dnsLookup = await dns.lookup(host)
    }

    // Try a simple Prisma query
    const prisma = new PrismaClient()
    const now = await prisma.$queryRaw`SELECT NOW()`
    info.prismaOk = true
    info.dbNow = now
    await prisma.$disconnect()

    return NextResponse.json(info, { status: 200 })
  } catch (error: unknown) {
    info.prismaOk = false

    if (typeof error === 'object' && error !== null) {
      const { name, message } = error as { name?: string; message?: string }
      info.errorName = name
      info.errorMessage = message

      if ('code' in error) {
        info.errorCode = (error as { code?: unknown }).code
      }

      if ('meta' in error) {
        info.errorMeta = (error as { meta?: unknown }).meta
      }
    }

    return NextResponse.json(info, { status: 500 })
  }
}
