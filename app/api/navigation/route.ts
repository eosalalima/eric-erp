import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
    try {
        const requiredEnvVars = {
            CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
            DATABASE_URL: process.env.DATABASE_URL,
        };

        const missingEnvVars = Object.entries(requiredEnvVars)
            .filter(([, value]) => !value)
            .map(([key]) => key);

        if (missingEnvVars.length > 0) {
            throw new Error(`Missing environment variables: ${missingEnvVars.join(", ")}`);
        }

        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json([]);
        }

        const user = await prisma.user.findFirst({ where: { clerkId: userId } });
        if (!user) {
            return NextResponse.json([]);
        }

        const navigation = await prisma.navigation.findMany({
            where: { roleId: user.roleId },
            orderBy: { sortOrder: "asc" },
            select: {
                navigationName: true,
                href: true,
                icon: true,
                current: true,
                sortOrder: true,
            },
        });

        return NextResponse.json(navigation);
    } catch (error) {
        console.error("Navigation API error:", error);
        const message = error instanceof Error ? error.message : "Failed to fetch navigation";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
