// app/api/diag/route.ts
import { NextResponse } from 'next/server'
import dns from 'node:dns/promises'
import { PrismaClient } from '@prisma/client'

export const dynamic = 'force-dynamic' // disable caching

export async function GET() {
  const info: any = {}

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
  } catch (e: any) {
    info.prismaOk = false
    info.errorName = e?.name
    info.errorMessage = e?.message
    info.errorCode = e?.code
    info.errorMeta = e?.meta
    return NextResponse.json(info, { status: 500 })
  }
}
