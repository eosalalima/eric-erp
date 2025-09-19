import assert from "node:assert/strict";
import { mock, test } from "node:test";

import { createNavigationHandler } from "../../app/api/navigation/navigation-handler";

test("returns 400 when roleId query parameter is invalid", async () => {
    process.env.DATABASE_URL = "postgres://test";

    const navigationFindMany = mock.fn(async () => []);
    const prisma = {
        navigation: { findMany: navigationFindMany },
        user: { findFirst: mock.fn(async () => null) },
    } as unknown as Parameters<typeof createNavigationHandler>[0]["prisma"];

    const handler = createNavigationHandler({
        prisma,
        auth: async () => ({ userId: "user_123" }),
    });

    const response = await handler(new Request("https://example.com/api/navigation?roleId=abc"));
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "roleId must be a positive integer" });
    assert.equal(navigationFindMany.mock.callCount(), 0);
});

test("filters navigation by provided roleId", async () => {
    process.env.DATABASE_URL = "postgres://test";

    const expectedNavigation = [
        {
            navigationName: "Dashboard",
            href: "/dashboard",
            icon: "home",
            current: false,
            sortOrder: 1,
        },
    ];

    const navigationFindMany = mock.fn(async () => expectedNavigation);
    const prisma = {
        navigation: { findMany: navigationFindMany },
        user: {
            findFirst: mock.fn(async () => {
                throw new Error("user lookup should not run when roleId is provided");
            }),
        },
    } as unknown as Parameters<typeof createNavigationHandler>[0]["prisma"];

    const handler = createNavigationHandler({
        prisma,
        auth: mock.fn(async () => {
            throw new Error("auth should not run when roleId is provided");
        }),
    });

    const response = await handler(new Request("https://example.com/api/navigation?roleId=2"));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), expectedNavigation);

    assert.equal(navigationFindMany.mock.callCount(), 1);
    const call = navigationFindMany.mock.calls[0];
    assert.ok(call);
    const [rawQuery] = call.arguments as unknown as [unknown];
    assert.ok(rawQuery && typeof rawQuery === "object");
    const query = rawQuery as { where: { roleId: number } };
    assert.equal(query.where.roleId, 2);
});

test("falls back to the authenticated user's role when roleId is omitted", async () => {
    process.env.DATABASE_URL = "postgres://test";
    process.env.CLERK_SECRET_KEY = "sk_test";

    const authMock = mock.fn(async () => ({ userId: "user_abc" }));
    const findFirstMock = mock.fn(async () => ({ roleId: 5 }));
    const navigationResult = [
        {
            navigationName: "Settings",
            href: "/settings",
            icon: "cog",
            current: true,
            sortOrder: 2,
        },
    ];
    const navigationFindMany = mock.fn(async () => navigationResult);

    const prisma = {
        navigation: { findMany: navigationFindMany },
        user: { findFirst: findFirstMock },
    } as unknown as Parameters<typeof createNavigationHandler>[0]["prisma"];

    const handler = createNavigationHandler({ prisma, auth: authMock });

    const response = await handler(new Request("https://example.com/api/navigation"));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), navigationResult);

    assert.equal(authMock.mock.callCount(), 1);
    assert.equal(findFirstMock.mock.callCount(), 1);
    const call = navigationFindMany.mock.calls[0];
    assert.ok(call);
    const [rawQuery] = call.arguments as unknown as [unknown];
    assert.ok(rawQuery && typeof rawQuery === "object");
    const query = rawQuery as { where: { roleId: number } };
    assert.equal(query.where.roleId, 5);
});
