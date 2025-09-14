import React, { ReactNode } from "react";

interface FinanceAccountingLayoutProps {
    children: ReactNode;
}

export default function FinanceAccountingLayout({
    children,
}: FinanceAccountingLayoutProps) {
    return (
        <div
            style={{
                padding: "2rem",
                background: "#f9f9f9",
                minHeight: "100vh",
            }}
        >
            <header style={{ marginBottom: "2rem" }}>
                <h1>Finance &amp; Accounting</h1>
            </header>
            <main>{children}</main>
        </div>
    );
}
