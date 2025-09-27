import { RedirectToSignIn, SignedIn, SignedOut } from "@clerk/nextjs";
import Breadcrumb from "@/components/layout/Breadcrumb";
import PageHeader from "@/components/layout/PageHeader";
import JournalEntriesForm from "../JournalEntriesForm";

const items = [
    { name: "Home", href: "/modules/finance-accounting" },
    {
        name: "General Ledger",
        href: "/modules/finance-accounting/general-ledger",
    },
    {
        name: "Journal Entries",
        href: "/modules/finance-accounting/general-ledger/journal-entries",
    },
    {
        name: "Form",
        href: "/modules/finance-accounting/general-ledger/journal-entries/form",
    },
];

export default function JournalEntriesFormPage() {
    return (
        <>
            <SignedIn>
                <div className="flex min-h-screen flex-col p-5">
                    <Breadcrumb items={items} />
                    <PageHeader title="Journal Entry Form" />

                    <JournalEntriesForm />
                </div>
            </SignedIn>
            <SignedOut>
                <RedirectToSignIn redirectUrl="/signin" />
            </SignedOut>
        </>
    );
}
