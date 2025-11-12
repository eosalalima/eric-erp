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

function normalizeStatus(value: unknown): FiscalYearStatus {
    return isFiscalYearStatus(value)
        ? (value.toUpperCase() as FiscalYearStatus)
        : "OPEN";
}

type PeriodPayload = {
    period_no: number;
    start_date: Date;
    end_date: Date;
    status: FiscalYearStatus;
};

function parsePeriodsInput(
    value: unknown
): { periods: PeriodPayload[] | undefined; error?: string } {
    if (typeof value === "undefined") {
        return { periods: undefined };
    }

    if (!Array.isArray(value)) {
        return { periods: undefined, error: "periods must be an array." };
    }

    const parsed: PeriodPayload[] = [];
    const seen = new Set<number>();

    for (let index = 0; index < value.length; index += 1) {
        const item = value[index];

        if (!item || typeof item !== "object") {
            return {
                periods: undefined,
                error: `periods[${index}] must be an object with period_no, start_date, end_date, and status.`,
            };
        }

        const { period_no, start_date, end_date, status } =
            item as Record<string, unknown>;

        const parsedPeriodNo = parseYear(period_no);

        if (!Number.isInteger(parsedPeriodNo) || parsedPeriodNo <= 0) {
            return {
                periods: undefined,
                error: `periods[${index}].period_no must be a positive integer.`,
            };
        }

        if (seen.has(parsedPeriodNo)) {
            return {
                periods: undefined,
                error: `Duplicate period number ${parsedPeriodNo} found in periods array.`,
            };
        }

        const parsedStartDate = parseDateOnly(start_date);
        const parsedEndDate = parseDateOnly(end_date);

        if (!parsedStartDate || !parsedEndDate) {
            return {
                periods: undefined,
                error: `periods[${index}] must include valid start_date and end_date values.`,
            };
        }

        if (parsedEndDate < parsedStartDate) {
            return {
                periods: undefined,
                error: `periods[${index}].end_date cannot be earlier than start_date.`,
            };
        }

        const normalizedStatus = normalizeStatus(status);

        parsed.push({
            period_no: parsedPeriodNo,
            start_date: parsedStartDate,
            end_date: parsedEndDate,
            status: normalizedStatus,
        });
        seen.add(parsedPeriodNo);
    }

    parsed.sort((a, b) => a.period_no - b.period_no);

    return { periods: parsed };
}

export async function GET(
    req: NextRequest,
    { params }: { params: { id?: string } }
) {
    const fiscalYearId = params?.id;

    if (!fiscalYearId || typeof fiscalYearId !== "string") {
        return NextResponse.json({ error: "Invalid fiscal year id" }, { status: 400 });
    }

    try {
        const url = new URL(req.url);
        const includePeriods = url.searchParams.get("includePeriods") === "true";

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
                ...(includePeriods
                    ? {
                          period: {
                              orderBy: { period_no: "asc" },
                          },
                      }
                    : {}),
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

        const { ledger_id, year, start_date, end_date, status, periods } =
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

        const periodsResult = parsePeriodsInput(periods);

        if (periodsResult.error) {
            return NextResponse.json(
                { error: periodsResult.error },
                { status: 400 }
            );
        }

        const url = new URL(req.url);
        const includePeriods = url.searchParams.get("includePeriods") === "true";

        const updatedFiscalYear = await prisma.$transaction(async (tx) => {
            await tx.fiscal_year.update({
                where: { id: fiscalYearId },
                data: {
                    ledger_id: ledger_id.trim(),
                    year: parsedYear,
                    start_date: parsedStartDate,
                    end_date: parsedEndDate,
                    status: normalizeStatus(status),
                },
            });

            if (periodsResult.periods) {
                await tx.period.deleteMany({ where: { fiscal_year_id: fiscalYearId } });

                if (periodsResult.periods.length > 0) {
                    await tx.period.createMany({
                        data: periodsResult.periods.map((period) => ({
                            fiscal_year_id: fiscalYearId,
                            period_no: period.period_no,
                            start_date: period.start_date,
                            end_date: period.end_date,
                            status: period.status,
                        })),
                    });
                }
            }

            return tx.fiscal_year.findUnique({
                where: { id: fiscalYearId },
                include: {
                    ledger: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                        },
                    },
                    ...(includePeriods
                        ? {
                              period: {
                                  orderBy: { period_no: "asc" },
                              },
                          }
                        : {}),
                },
            });
        });

        if (!updatedFiscalYear) {
            return NextResponse.json(
                { error: "Fiscal year not found" },
                { status: 404 }
            );
        }

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
