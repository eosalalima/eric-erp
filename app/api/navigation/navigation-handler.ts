import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export type NavigationHandlerDependencies = {
    prisma: {
        navigation: {
            findMany: (...args: unknown[]) => Promise<unknown>;
        };
        user: {
            findFirst: (...args: unknown[]) => Promise<{ applicationId: number } | null>;
        };
    };
    auth: () => Promise<{ userId: string | null } | null>;
};

const navigationSelect = {
    navigationName: true,
    href: true,
    icon: true,
    current: true,
    sortOrder: true,
} as const;

function parseApplicationIdFromRequest(request: Request | NextRequest) {
    const applicationIdParam = new URL(request.url).searchParams.get("applicationId");
    if (applicationIdParam === null) {
        return { parsedApplicationId: undefined } as const;
    }

    const trimmed = applicationIdParam.trim();
    const parsedApplicationId = Number.parseInt(trimmed, 10);

    if (!Number.isInteger(parsedApplicationId) || parsedApplicationId <= 0) {
        return {
            error: "applicationId must be a positive integer",
        } as const;
    }

    return { parsedApplicationId } as const;
}

export function createNavigationHandler({ prisma: prismaClient, auth: authFn }: NavigationHandlerDependencies) {
    return async function GET(request: Request | NextRequest) {
        try {
            if (!process.env.DATABASE_URL) {
                throw new Error("Missing environment variables: DATABASE_URL");
            }

            const { parsedApplicationId, error } = parseApplicationIdFromRequest(request);
            if (error) {
                return NextResponse.json({ error }, { status: 400 });
            }

            if (typeof parsedApplicationId === "number") {
                const navigation = await prismaClient.navigation.findMany({
                    where: { applicationId: parsedApplicationId },
                    orderBy: { sortOrder: "asc" },
                    select: navigationSelect,
                });

                return NextResponse.json(navigation);
            }

            if (!process.env.CLERK_SECRET_KEY) {
                throw new Error("Missing environment variables: CLERK_SECRET_KEY");
            }

            const authResult = await authFn();
            const userId = authResult?.userId ?? null;
            if (!userId) {
                return NextResponse.json([]);
            }

            const user = await prismaClient.user.findFirst({ where: { clerkId: userId } });
            if (!user) {
                return NextResponse.json([]);
            }

            const navigation = await prismaClient.navigation.findMany({
                where: { applicationId: user.applicationId },
                orderBy: { sortOrder: "asc" },
                select: navigationSelect,
            });

            return NextResponse.json(navigation);
        } catch (error) {
            console.error("Navigation API error:", error);
            const message = error instanceof Error ? error.message : "Failed to fetch navigation";
            return NextResponse.json({ error: message }, { status: 500 });
        }
    };
}
