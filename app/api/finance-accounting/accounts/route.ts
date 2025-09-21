import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const allowedAccountTypes = new Set([
    "ASSET",
    "LIABILITY",
    "EQUITY",
    "REVENUE",
    "EXPENSE",
    "OFF_BALANCE",
]);

const allowedNormalBalances = new Set(["DEBIT", "CREDIT"]);

export async function GET() {
    try {
        const accounts = await prisma.account.findMany();
        return NextResponse.json(accounts);
    } catch (error) {
        console.error("Failed to fetch accounts", error);
        return NextResponse.json(
            { error: "Failed to fetch accounts" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    let payload: unknown;

    try {
        payload = await req.json();
    } catch {
        return NextResponse.json(
            { error: "Invalid JSON payload." },
            { status: 400 }
        );
    }

    if (typeof payload !== "object" || payload === null) {
        return NextResponse.json(
            { error: "Invalid request body." },
            { status: 400 }
        );
    }

    const body = payload as Record<string, unknown>;

    const code = typeof body.code === "string" ? body.code.trim() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const description =
        typeof body.description === "string"
            ? body.description.trim()
            : undefined;

    const rawLevel = body.level;
    let level: number | null = null;

    if (typeof rawLevel === "number") {
        level = rawLevel;
    } else if (typeof rawLevel === "string" && rawLevel.trim() !== "") {
        const parsedLevel = Number.parseInt(rawLevel, 10);
        level = Number.isFinite(parsedLevel) ? parsedLevel : null;
    }

    const rawParentId =
        body.parentId ?? body.parent_id ?? body.parent ?? body.parentAccount;
    const parentId =
        typeof rawParentId === "string" && rawParentId.trim() !== ""
            ? rawParentId
            : null;

    const rawType = body.type ?? body.accountType;
    const normalizedType =
        typeof rawType === "string" ? rawType.trim().toUpperCase() : "";

    const rawNormalBalance = body.normalBalance ?? body.normal_balance;
    const normalizedNormalBalance =
        typeof rawNormalBalance === "string"
            ? rawNormalBalance.trim().toUpperCase()
            : "";

    const isPostable =
        typeof body.isPostable === "boolean" ? body.isPostable : true;
    const isActive =
        typeof body.isActive === "boolean" ? body.isActive : true;

    const errors: Record<string, string> = {};

    if (!code) {
        errors.code = "Code is required.";
    }

    if (!name) {
        errors.name = "Account name is required.";
    }

    if (level === null || Number.isNaN(level)) {
        errors.level = "Level must be a valid number.";
    } else if (level < 0) {
        errors.level = "Level must be zero or greater.";
    }

    if (!allowedAccountTypes.has(normalizedType)) {
        errors.type = "Select a valid account type.";
    }

    if (!allowedNormalBalances.has(normalizedNormalBalance)) {
        errors.normalBalance = "Select a valid normal balance.";
    }

    if (Object.keys(errors).length > 0) {
        return NextResponse.json({ errors }, { status: 400 });
    }

    const safeLevel = level as number;

    try {
        let ledgerId: string;

        if (parentId) {
            const parentAccount = await prisma.account.findUnique({
                where: { id: parentId },
                select: { ledger_id: true },
            });

            if (!parentAccount) {
                return NextResponse.json(
                    { error: "Parent account not found." },
                    { status: 400 }
                );
            }

            ledgerId = parentAccount.ledger_id;
        } else {
            const defaultLedger = await prisma.ledger.findFirst({
                where: { is_default: true },
                select: { id: true },
            });

            if (!defaultLedger) {
                return NextResponse.json(
                    { error: "Default ledger is not configured." },
                    { status: 500 }
                );
            }

            ledgerId = defaultLedger.id;
        }

        const createdAccount = await prisma.account.create({
            data: {
                ledger_id: ledgerId,
                code,
                name,
                description: description && description.length > 0 ? description : null,
                level: safeLevel,
                parent_id: parentId,
                type: normalizedType as Prisma.$Enums.account_type,
                normal_balance:
                    normalizedNormalBalance as Prisma.$Enums.normal_balance,
                is_postable: isPostable,
                status: isActive ? "ACTIVE" : "INACTIVE",
            },
        });

        return NextResponse.json(createdAccount, { status: 201 });
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
        ) {
            return NextResponse.json(
                { error: "An account with this code already exists." },
                { status: 409 }
            );
        }

        console.error("Failed to create account", error);
        return NextResponse.json(
            { error: "Failed to create account." },
            { status: 500 }
        );
    }
}