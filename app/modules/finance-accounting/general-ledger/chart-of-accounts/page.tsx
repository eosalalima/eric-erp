import Breadcrumb from "@/components/layout/Breadcrumb";
import PageHeader from "@/components/layout/PageHeader";
import ChartOfAccountsTable from "./ChartOfAccountsTable";
import { prisma } from "@/lib/prisma";
import { RedirectToSignIn, SignedIn, SignedOut } from "@clerk/nextjs";

const items = [
    { name: "Home", href: "/modules/finance-accounting" },
    {
        name: "General Ledger",
        href: "/modules/finance-accounting/general-ledger",
    },
    {
        name: "Chart of Accounts",
        href: "/modules/finance-accounting/general-ledger/chart-of-accounts",
    },
];

type Account = Awaited<ReturnType<typeof prisma.account.findMany>>[number];

export default async function ChartOfAccountsPage() {
    let accounts: Account[] = [];
    let error: string | null = null;

    try {
        accounts = await prisma.account.findMany();
    } catch (fetchError) {
        console.error(fetchError);
        error = "Unable to load accounts at this time. Please try again later.";
    }

    return (
        <>
            <SignedIn>
                <div className="flex min-h-screen flex-col p-5">
                    <Breadcrumb items={items} />
                    <PageHeader title="Chart of Accounts" />

                    <div className="mt-8 flex flex-1 min-h-0 flex-col">
                        <div className="-mx-4 -my-2 flex-1 min-h-0 overflow-x-auto sm:-mx-6 lg:-mx-8">
                            <div className="flex h-full min-w-full flex-col py-2 align-middle sm:px-6 lg:px-8">
                                <div className="flex flex-1 min-h-0 flex-col overflow-hidden shadow outline-1 outline-black/5 sm:rounded-lg">
                                    {error ? (
                                        <div className="bg-red-50 p-4">
                                            <p className="text-sm text-red-700">{error}</p>
                                        </div>
                                    ) : accounts.length === 0 ? (
                                        <div className="p-4 text-sm text-gray-500">
                                            No accounts found.
                                        </div>
                                    ) : (

                                        <ChartOfAccountsTable accounts={accounts} />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </SignedIn>
            <SignedOut>
                <RedirectToSignIn redirectUrl="/signin" />
            </SignedOut>
        </>
    );
}
