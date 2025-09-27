import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type FiscalYearStatus = "OPEN" | "CLOSED" | "LOCKED";

const FISCAL_YEAR_STATUSES: FiscalYearStatus[] = [
    "OPEN",
    "CLOSED",
    "LOCKED",
];

function isFiscalYearStatus(value: unknown): value is FiscalYearStatus {
    return (
        typeof value === "string" &&
        FISCAL_YEAR_STATUSES.includes(value.toUpperCase() as FiscalYearStatus)
    );
}

function parseYear(value: unknown) {
    if (typeof value !== "number") {
        return Number.parseInt(String(value ?? ""), 10);
    }

    return Math.trunc(value);
}

function parseDateOnly(value: unknown) {
    if (typeof value !== "string") {
        return null;
    }

    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }

    const normalized = trimmed.includes("T") ? trimmed : `${trimmed}T00:00:00.000Z`;
    const date = new Date(normalized);

    return Number.isNaN(date.getTime()) ? null : date;
}

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const includeLedgers = url.searchParams.get("includeLedgers") === "true";

        const fiscalYearsPromise = prisma.fiscal_year.findMany({
            include: {
                ledger: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
            },
            orderBy: [{ year: "desc" }],
        });

        if (!includeLedgers) {
            const fiscalYears = await fiscalYearsPromise;
            return NextResponse.json(fiscalYears);
        }

        const [fiscalYears, ledgers] = await Promise.all([
            fiscalYearsPromise,
            prisma.ledger.findMany({
                select: {
                    id: true,
                    name: true,
                    code: true,
                },
                orderBy: { name: "asc" },
            }),
        ]);

        return NextResponse.json({ fiscalYears, ledgers });
    } catch (error) {
        console.error("Failed to fetch fiscal years", error);
        return NextResponse.json(
            { error: "Failed to fetch fiscal years" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        if (!body || typeof body !== "object") {
            return NextResponse.json(
                { error: "Invalid request payload" },
                { status: 400 }
            );
        }

        const { ledger_id, year, start_date, end_date, status } =
            body as Record<string, unknown>;

        if (typeof ledger_id !== "string" || ledger_id.trim() === "") {
            return NextResponse.json(
                { error: "ledger_id is required." },
                { status: 400 }
            );
        }

        const parsedYear = parseYear(year);
        if (!Number.isInteger(parsedYear)) {
            return NextResponse.json(
                { error: "year must be a valid integer." },
                { status: 400 }
            );
        }

        const parsedStartDate = parseDateOnly(start_date);
        const parsedEndDate = parseDateOnly(end_date);

        if (!parsedStartDate || !parsedEndDate) {
            return NextResponse.json(
                { error: "start_date and end_date must be valid dates." },
                { status: 400 }
            );
        }

        if (parsedEndDate < parsedStartDate) {
            return NextResponse.json(
                { error: "end_date cannot be earlier than start_date." },
                { status: 400 }
            );
        }

        const normalizedStatus = isFiscalYearStatus(status)
            ? (status.toUpperCase() as FiscalYearStatus)
            : "OPEN";

        const createdFiscalYear = await prisma.fiscal_year.create({
            data: {
                ledger_id: ledger_id.trim(),
                year: parsedYear,
                start_date: parsedStartDate,
                end_date: parsedEndDate,
                status: normalizedStatus,
            },
        });

        return NextResponse.json(createdFiscalYear, { status: 201 });
    } catch (error) {
        console.error("Failed to create fiscal year", error);
        return NextResponse.json(
            { error: "Failed to create fiscal year" },
            { status: 500 }
        );
    }
}
