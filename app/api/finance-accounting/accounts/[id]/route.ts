import { NextRequest, NextResponse } from "next/server";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/prisma";

const ACCOUNT_TYPES = [
    "ASSET",
    "LIABILITY",
    "EQUITY",
    "REVENUE",
    "EXPENSE",
] as const;
type AccountType = (typeof ACCOUNT_TYPES)[number];

const NORMAL_BALANCES = ["DEBIT", "CREDIT"] as const;
type NormalBalance = (typeof NORMAL_BALANCES)[number];

export async function DELETE(
    _req: NextRequest,
    { params }: { params: { id?: string } }
) {
    const accountId = params?.id;

    if (!accountId || typeof accountId !== "string" || accountId.trim() === "") {
        return NextResponse.json(
            { message: "Invalid account id" },
            { status: 400 }
        );
    }

    try {
        await prisma.accounts.delete({ where: { id: accountId } });

        return NextResponse.json(
            { message: "Account deleted successfully" },
            { status: 200 }
        );
    } catch (error) {
        if (
            error instanceof PrismaClientKnownRequestError &&
            error.code === "P2025"
        ) {
            return NextResponse.json(
                { message: "Account not found" },
                { status: 404 }
            );
        }

        if (
            error instanceof PrismaClientKnownRequestError &&
            error.code === "P2003"
        ) {
            return NextResponse.json(
                {
                    message:
                        "Account cannot be deleted because it is referenced by other records.",
                },
                { status: 409 }
            );
        }

        console.error("Failed to delete account", error);
        return NextResponse.json(
            { message: "Failed to delete account" },
            { status: 500 }
        );
    }
}

export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id: accountId } = await context.params;

    if (!accountId || typeof accountId !== "string") {
        return NextResponse.json(
            { error: "Invalid account id" },
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

        const {
            code,
            name,
            description,
            level,
            parent_id,
            type,
            normal_balance,
            is_postable,
            status,
            ledger_id,
        } = body as Record<string, unknown>;

        if (
            typeof code !== "string" ||
            code.trim() === "" ||
            typeof name !== "string" ||
            name.trim() === "" ||
            typeof ledger_id !== "string" ||
            ledger_id.trim() === ""
        ) {
            return NextResponse.json(
                { error: "Code, name, and ledger_id are required fields." },
                { status: 400 }
            );
        }

        const accountType =
            typeof type === "string" &&
            ACCOUNT_TYPES.includes(type.toUpperCase() as AccountType)
                ? (type.toUpperCase() as AccountType)
                : "ASSET";

        const normalBalance =
            typeof normal_balance === "string" &&
            NORMAL_BALANCES.includes(
                normal_balance.toUpperCase() as NormalBalance
            )
                ? (normal_balance.toUpperCase() as NormalBalance)
                : "DEBIT";

        const parsedLevel =
            typeof level === "number" && Number.isFinite(level)
                ? Math.trunc(level)
                : 0;

        const parentId =
            typeof parent_id === "string" && parent_id.trim() !== ""
                ? parent_id
                : null;

        const sanitizedDescription =
            typeof description === "string" && description.trim() !== ""
                ? description.trim()
                : null;

        const updatedAccount = await prisma.accounts.update({
            where: { id: accountId },
            data: {
                ledger_id: ledger_id.trim(),
                code: code.trim(),
                name: name.trim(),
                description: sanitizedDescription,
                level: parsedLevel,
                parent_id: parentId,
                type: accountType,
                normal_balance: normalBalance,
                is_postable: Boolean(is_postable),
                status:
                    typeof status === "string" && status.trim() !== ""
                        ? status.trim()
                        : "ACTIVE",
            },
        });

        return NextResponse.json(updatedAccount);
    } catch (error) {
        if (
            error instanceof PrismaClientKnownRequestError &&
            error.code === "P2025"
        ) {
            return NextResponse.json(
                { error: "Account not found" },
                { status: 404 }
            );
        }

        console.error("Failed to update account", error);
        return NextResponse.json(
            { error: "Failed to update account" },
            { status: 500 }
        );
    }
}
