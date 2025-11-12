import Breadcrumb from "@/components/layout/Breadcrumb";
import PageHeader from "@/components/layout/PageHeader";
import { RedirectToSignIn, SignedIn, SignedOut } from "@clerk/nextjs";

const items = [{ name: "Home", href: "/home" }];

export default function AgreementsPage() {
    return (
        <>
            <SignedIn>
                <div className="p-4">
                    <Breadcrumb items={items} />
                    <PageHeader title="Home" />
                </div>
            </SignedIn>
            <SignedOut>
                <RedirectToSignIn redirectUrl="/signin" />
            </SignedOut>
        </>
    );
}
