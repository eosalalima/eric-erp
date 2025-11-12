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
        name: "Consolidation",
        href: "/modules/finance-accounting/general-ledger/consolidation",
    },
];

export default function ConsolidationPage() {
    return (
        <>
            <SignedIn>
                <div className="p-5">
                    <Breadcrumb items={items} />
                    <PageHeader title="Consolidation" />
                </div>
            </SignedIn>
            <SignedOut>
                <RedirectToSignIn redirectUrl="/signin" />
            </SignedOut>
        </>
    );
}
