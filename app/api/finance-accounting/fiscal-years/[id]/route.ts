import { NextRequest, NextResponse } from "next/server";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
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

export async function GET(
    _req: NextRequest,
    { params }: { params: { id?: string } }
) {
    const fiscalYearId = params?.id;

    if (!fiscalYearId || typeof fiscalYearId !== "string") {
        return NextResponse.json({ error: "Invalid fiscal year id" }, { status: 400 });
    }

    try {
        const fiscalYear = await prisma.fiscal_year.findUnique({
            where: { id: fiscalYearId },
            include: {
                ledger: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
            },
        });

        if (!fiscalYear) {
            return NextResponse.json({ error: "Fiscal year not found" }, { status: 404 });
        }

        return NextResponse.json(fiscalYear);
    } catch (error) {
        console.error("Failed to fetch fiscal year", error);
        return NextResponse.json(
            { error: "Failed to fetch fiscal year" },
            { status: 500 }
        );
    }
}

export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id: fiscalYearId } = await context.params;

    if (!fiscalYearId || typeof fiscalYearId !== "string") {
        return NextResponse.json(
            { error: "Invalid fiscal year id" },
            { status: 400 }
        );
    }

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

        const updatedFiscalYear = await prisma.fiscal_year.update({
            where: { id: fiscalYearId },
            data: {
                ledger_id: ledger_id.trim(),
                year: parsedYear,
                start_date: parsedStartDate,
                end_date: parsedEndDate,
                status: normalizedStatus,
            },
        });

        return NextResponse.json(updatedFiscalYear);
    } catch (error) {
        if (error instanceof PrismaClientKnownRequestError && error.code === "P2025") {
            return NextResponse.json(
                { error: "Fiscal year not found" },
                { status: 404 }
            );
        }

        console.error("Failed to update fiscal year", error);
        return NextResponse.json(
            { error: "Failed to update fiscal year" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: { id?: string } }
) {
    const fiscalYearId = params?.id;

    if (!fiscalYearId || typeof fiscalYearId !== "string" || fiscalYearId.trim() === "") {
        return NextResponse.json(
            { message: "Invalid fiscal year id" },
            { status: 400 }
        );
    }

    try {
        await prisma.fiscal_year.delete({ where: { id: fiscalYearId } });

        return NextResponse.json(
            { message: "Fiscal year deleted successfully" },
            { status: 200 }
        );
    } catch (error) {
        if (error instanceof PrismaClientKnownRequestError && error.code === "P2025") {
            return NextResponse.json(
                { message: "Fiscal year not found" },
                { status: 404 }
            );
        }

        if (error instanceof PrismaClientKnownRequestError && error.code === "P2003") {
            return NextResponse.json(
                {
                    message:
                        "Fiscal year cannot be deleted because it is referenced by other records.",
                },
                { status: 409 }
            );
        }

        console.error("Failed to delete fiscal year", error);
        return NextResponse.json(
            { message: "Failed to delete fiscal year" },
            { status: 500 }
        );
    }
}
