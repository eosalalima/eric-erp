import { prisma } from "../../../lib/prisma";
import { auth } from "@clerk/nextjs/server";

import { createNavigationHandler, type NavigationHandlerDependencies } from "./navigation-handler";

export const GET = createNavigationHandler({
    prisma: prisma as unknown as NavigationHandlerDependencies["prisma"],
    auth: auth as NavigationHandlerDependencies["auth"],
});
