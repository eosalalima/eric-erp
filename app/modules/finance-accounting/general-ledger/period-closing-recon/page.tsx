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
        name: "Period Closing & Reconcillation",
        href: "/modules/finance-accounting/general-ledger/period-closing-recon",
    },
];

export default function PeriodClosingReconPage() {
    return (
        <>
            <SignedIn>
                <div className="p-5">
                    <Breadcrumb items={items} />
                    <PageHeader title="Period Closing & Reconciliation" />
                </div>
            </SignedIn>
            <SignedOut>
                <RedirectToSignIn redirectUrl="/signin" />
            </SignedOut>
        </>
    );
}
