import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
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
}
