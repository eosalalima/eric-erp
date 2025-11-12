import Breadcrumb from "@/components/layout/Breadcrumb";
import PageHeader from "@/components/layout/PageHeader";
import { RedirectToSignIn, SignedIn, SignedOut } from "@clerk/nextjs";

const items = [
    { name: "Home", href: "/modules/finance-accounting" },
    {
        name: "General Ledger",
        href: "/modules/finance-accounting/general-ledger",
    },
    {
        name: "Allocations",
        href: "/modules/finance-accounting/general-ledger/allocations",
    },
];

export default function AllocationsPage() {
    return (
        <>
            <SignedIn>
                <div className="p-5">
                    <Breadcrumb items={items} />
                    <PageHeader title="Allocations" />
                </div>
            </SignedIn>
            <SignedOut>
                <RedirectToSignIn redirectUrl="/signin" />
            </SignedOut>
        </>
    );
}
