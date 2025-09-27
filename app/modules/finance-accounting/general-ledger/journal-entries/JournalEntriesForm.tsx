"use client";
import React, { use, useEffect, useMemo, useRef, useState } from "react";

// ---------------------------------------------
// Journal Entry Module (Editor + List preview)
// - Pure React + TailwindCSS (no external UI libs)
// - Keyboard friendly grid
// - Live totals & validations
// - Mock account picker with typeahead
// - Post enabled only when balanced & valid
// ---------------------------------------------

// ---- Types
type JournalLine = {
    id: string;
    journal_entry_id: string;
    line_no: number;
    account_id: string;
    account_name: string;
    debit: string; // keep as string for easier input handling
    credit: string; // keep as string for easier input handling
    amount_dc: number;
    currency_code: string;
    fx_rate: string;
    amount_txn: number;
    cost_center_id: string;
    department_id: string;
    project_id: string;
    partner_id: string;
    tax_code_id: string;
    memo: string;
};

type JournalEntry = {
    id: string;
    ledger_id: string;
    period_id: string;
    je_no: string;
    doc_date: string;
    post_date: string;
    currency_code: string;
    fx_rate: string;
    source: string;
    status: "Draft" | "Submitted" | "Approved" | "Posted" | "Voided";
    reference: string;
    memo: string;
    reversal_enabled: boolean;
    reversal_date: string;
};

// ---- Mock account catalog
const MOCK_ACCOUNTS: {
    code: string;
    name: string;
    type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
}[] = [
    { code: "1000", name: "Cash on Hand", type: "ASSET" },
    { code: "1010", name: "Cash in Bank - BDO", type: "ASSET" },
    { code: "1100", name: "Accounts Receivable", type: "ASSET" },
    { code: "1200", name: "Office Supplies", type: "ASSET" },
    { code: "1500", name: "Computer Equipment", type: "ASSET" },
    { code: "2000", name: "Accounts Payable", type: "LIABILITY" },
    { code: "2105", name: "Accrued Expenses", type: "LIABILITY" },
    { code: "3000", name: "Owner's Capital", type: "EQUITY" },
    { code: "4000", name: "Service Revenue", type: "REVENUE" },
    { code: "4100", name: "Sales Revenue", type: "REVENUE" },
    { code: "6100", name: "Rent Expense", type: "EXPENSE" },
    { code: "6200", name: "Utilities Expense", type: "EXPENSE" },
    { code: "6300", name: "Salaries Expense", type: "EXPENSE" },
];

// Utility helpers
const currency = (v: number) =>
    new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(v || 0);

const num = (s: string) => {
    const n = parseFloat(s.replace(/,/g, ""));
    return isNaN(n) ? 0 : n;
};

const uid = () => Math.random().toString(36).slice(2, 9);

// ---- Account picker component (inline dropdown)
function AccountPicker({
    value,
    onSelect,
    placeholder,
}: {
    value: { code: string; name: string } | null;
    onSelect: (acc: { code: string; name: string } | null) => void;
    placeholder?: string;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState(
        value ? `${value.code} - ${value.name}` : ""
    );
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (!containerRef.current) return;
            if (!containerRef.current.contains(e.target as Node))
                setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const results = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return MOCK_ACCOUNTS.slice(0, 6);
        return MOCK_ACCOUNTS.filter((a) =>
            `${a.code} ${a.name}`.toLowerCase().includes(q)
        ).slice(0, 10);
    }, [query]);

    return (
        <div className="relative" ref={containerRef}>
            <input
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder={placeholder || "Search account code or name"}
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    setOpen(true);
                }}
                onFocus={() => setOpen(true)}
            />
            {open && (
                <div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                    {results.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500">
                            No results
                        </div>
                    ) : (
                        results.map((acc) => (
                            <button
                                key={acc.code}
                                type="button"
                                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-indigo-50"
                                onClick={() => {
                                    onSelect({
                                        code: acc.code,
                                        name: acc.name,
                                    });
                                    setQuery(`${acc.code} - ${acc.name}`);
                                    setOpen(false);
                                }}
                            >
                                <span>
                                    {acc.code} — {acc.name}
                                </span>
                                <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">
                                    {acc.type}
                                </span>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

// ---- Main component
export default function JournalEntriesForm() {
    const [header, setHeader] = useState<JournalEntry>(() => ({
        id: uid(),
        ledger_id: "",
        period_id: "",
        je_no: "AUTO",
        doc_date: new Date().toISOString().slice(0, 10),
        post_date: new Date().toISOString().slice(0, 10),
        currency_code: "PHP",
        fx_rate: "1",
        source: "",
        status: "Draft",
        reference: "",
        memo: "",
        reversal_enabled: false,
        reversal_date: new Date(Date.now() + 86400000 * 7)
            .toISOString()
            .slice(0, 10),
    }));

    const [lines, setLines] = useState<JournalLine[]>(() => [
        {
            id: uid(),
            journal_entry_id: header.id,
            line_no: 1,
            account_id: "6100",
            account_name: "Rent Expense",
            debit: "10000.00",
            credit: "",
            amount_dc: 10000,
            currency_code: "PHP",
            fx_rate: "1",
            amount_txn: 10000,
            cost_center_id: "OPS",
            department_id: "",
            project_id: "",
            partner_id: "",
            tax_code_id: "",
            memo: "September rent",
        },
        {
            id: uid(),
            journal_entry_id: header.id,
            line_no: 2,
            account_id: "2105",
            account_name: "Accrued Expenses",
            debit: "",
            credit: "10000.00",
            amount_dc: -10000,
            currency_code: "PHP",
            fx_rate: "1",
            amount_txn: 10000,
            cost_center_id: "OPS",
            department_id: "",
            project_id: "",
            partner_id: "",
            tax_code_id: "",
            memo: "Rent accrual",
        },
    ]);

    const totals = useMemo(() => {
        const debit = lines.reduce((s, l) => s + num(l.debit), 0);
        const credit = lines.reduce((s, l) => s + num(l.credit), 0);
        const diff = +(debit - credit).toFixed(2);
        return { debit, credit, diff };
    }, [lines]);

    const errors = useMemo(() => {
        const errs: Record<string, string[]> = {};
        lines.forEach((l) => {
            const e: string[] = [];
            if (!l.account_id) e.push("Account is required");
            const d = num(l.debit),
                c = num(l.credit);
            if (d > 0 && c > 0)
                e.push("Enter amount in either Debit or Credit, not both");
            if (d === 0 && c === 0) e.push("Debit or Credit is required");
            if (d < 0 || c < 0) e.push("Amounts cannot be negative");
            if (e.length) errs[l.id] = e;
        });
        // header checks
        const headerErrs: string[] = [];
        if (!header.doc_date) headerErrs.push("Date is required");
        if (!header.period_id) headerErrs.push("Period is required");
        if (!header.currency_code) headerErrs.push("Currency is required");
        if (header.reversal_enabled && !header.reversal_date)
            headerErrs.push("Reversal date required");
        if (headerErrs.length) errs["__header"] = headerErrs;
        return errs;
    }, [lines, header]);

    const isBalanced =
        totals.diff === 0 && totals.debit > 0 && totals.credit > 0;
    const hasErrors = Object.keys(errors).length > 0;

    const addLine = (idx?: number) => {
        const newline: JournalLine = {
            id: uid(),
            journal_entry_id: header.id,
            line_no: lines.length + 1,
            account_id: "",
            account_name: "",
            debit: "",
            credit: "",
            amount_dc: 0,
            currency_code: header.currency_code || "PHP",
            fx_rate: header.fx_rate || "1",
            amount_txn: 0,
            cost_center_id: "",
            department_id: "",
            project_id: "",
            partner_id: "",
            tax_code_id: "",
            memo: "",
        };
        if (idx === undefined) setLines((prev) => [...prev, newline]);
        else
            setLines((prev) => [
                ...prev.slice(0, idx + 1),
                newline,
                ...prev.slice(idx + 1),
            ]);
    };

    const deleteLine = (id: string) =>
        setLines((prev) => prev.filter((l) => l.id !== id));
    const duplicateLine = (id: string) =>
        setLines((prev) => {
            const i = prev.findIndex((l) => l.id === id);
            if (i === -1) return prev;
            const src = prev[i];
            const copy: JournalLine = { ...src, id: uid() };
            const arr = [...prev];
            arr.splice(i + 1, 0, copy);
            return arr;
        });

    const postable = isBalanced && !hasErrors && header.status === "Draft";

    const post = () => {
        if (!postable) return;
        setHeader((h) => ({ ...h, status: "Posted" }));
    };

    const submit = () => setHeader((h) => ({ ...h, status: "Submitted" }));
    const approve = () => setHeader((h) => ({ ...h, status: "Approved" }));
    const revertToDraft = () => setHeader((h) => ({ ...h, status: "Draft" }));

    // Keyboard shortcut: Cmd/Ctrl+S to save (noop here but we show toast)
    const [toast, setToast] = useState<string | null>(null);
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
                e.preventDefault();
                setToast("Saved draft (local state)");
                setTimeout(() => setToast(null), 1500);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    // Render
    return (
        <div className="min-h-screen w-full bg-slate-50 p-6">
            <div className="mx-auto max-w-7xl">
                {/* Header Bar */}
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500">
                            JE No:{" "}
                            <span className="font-mono">{header.je_no}</span>
                        </span>
                        <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                                header.status === "Posted"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : header.status === "Approved"
                                    ? "bg-blue-100 text-blue-700"
                                    : header.status === "Submitted"
                                    ? "bg-amber-100 text-amber-800"
                                    : header.status === "Voided"
                                    ? "bg-rose-100 text-rose-700"
                                    : "bg-gray-100 text-gray-700"
                            }`}
                        >
                            {header.status}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {header.status !== "Draft" && (
                            <button
                                className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50"
                                onClick={revertToDraft}
                            >
                                Revert to Draft
                            </button>
                        )}
                        {header.status === "Draft" && (
                            <button
                                className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50"
                                onClick={submit}
                            >
                                Submit
                            </button>
                        )}
                        {header.status === "Submitted" && (
                            <button
                                className="rounded-xl border border-blue-200 bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
                                onClick={approve}
                            >
                                Approve
                            </button>
                        )}
                        <button
                            className={`rounded-xl px-4 py-2 text-sm font-medium text-white shadow ${
                                postable
                                    ? "bg-emerald-600 hover:bg-emerald-700"
                                    : "bg-emerald-300"
                            }`}
                            disabled={!postable}
                            onClick={post}
                            title={
                                postable
                                    ? "Post Entry"
                                    : "Entry must be balanced and valid to post"
                            }
                        >
                            Post
                        </button>
                    </div>
                </div>

                {/* Meta + Context */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {/* Meta form */}
                    <div className="col-span-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">
                                    Date
                                </label>
                                <input
                                    type="date"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                                    value={header.doc_date}
                                    onChange={(e) =>
                                        setHeader((h) => ({
                                            ...h,
                                            date: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">
                                    Period
                                </label>
                                <input
                                    type="month"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                                    value={header.period_id}
                                    onChange={(e) =>
                                        setHeader((h) => ({
                                            ...h,
                                            period: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">
                                    Currency
                                </label>
                                <input
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                                    value={header.currency_code}
                                    onChange={(e) =>
                                        setHeader((h) => ({
                                            ...h,
                                            currency: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">
                                    Exchange Rate
                                </label>
                                <input
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                                    value={header.fx_rate}
                                    onChange={(e) =>
                                        setHeader((h) => ({
                                            ...h,
                                            fx_rate: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div className="col-span-2 md:col-span-3">
                                <label className="mb-1 block text-xs font-medium text-gray-600">
                                    Reference No.
                                </label>
                                <input
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                                    value={header.reference}
                                    onChange={(e) =>
                                        setHeader((h) => ({
                                            ...h,
                                            reference: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div className="col-span-2 md:col-span-3">
                                <label className="mb-1 block text-xs font-medium text-gray-600">
                                    Memo / Description
                                </label>
                                <input
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                                    value={header.memo}
                                    onChange={(e) =>
                                        setHeader((h) => ({
                                            ...h,
                                            memo: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div className="flex items-center gap-3 md:col-span-3">
                                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4"
                                        checked={header.reversal_enabled}
                                        onChange={(e) =>
                                            setHeader((h) => ({
                                                ...h,
                                                reversal_enabled:
                                                    e.target.checked,
                                            }))
                                        }
                                    />
                                    Auto Reverse
                                </label>
                                {header.reversal_enabled && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-600">
                                            on
                                        </span>
                                        <input
                                            type="date"
                                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                                            value={header.reversal_date}
                                            onChange={(e) =>
                                                setHeader((h) => ({
                                                    ...h,
                                                    reversal_date:
                                                        e.target.value,
                                                }))
                                            }
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Context / Preview */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <h3 className="mb-3 text-sm font-semibold text-slate-700">
                            Posting Preview
                        </h3>
                        <div className="space-y-2 text-sm">
                            {lines.map((l) => (
                                <div
                                    key={l.id}
                                    className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-1.5"
                                >
                                    <div className="truncate">
                                        <span className="font-mono text-slate-700">
                                            {l.account_id || "—"}
                                        </span>{" "}
                                        <span className="text-slate-500">
                                            {l.account_name}
                                        </span>
                                    </div>
                                    <div className="font-mono text-slate-700">
                                        {num(l.debit) > 0
                                            ? `Dr ${currency(num(l.debit))}`
                                            : num(l.credit) > 0
                                            ? `Cr ${currency(num(l.credit))}`
                                            : ""}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 rounded-xl bg-slate-50 p-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-600">Totals</span>
                                <div className="font-mono text-slate-800">
                                    Dr {currency(totals.debit)} · Cr{" "}
                                    {currency(totals.credit)}
                                </div>
                            </div>
                            <div className="mt-2">
                                {isBalanced ? (
                                    <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                                        Balanced
                                    </span>
                                ) : (
                                    <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                                        Diff: {currency(Math.abs(totals.diff))}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Simple policy notes */}
                        <div className="mt-4 text-xs text-slate-500">
                            <p>Policies:</p>
                            <ul className="list-disc pl-5">
                                <li>Debit must equal Credit before posting.</li>
                                <li>
                                    Enter amounts in either Debit or Credit (not
                                    both).
                                </li>
                                <li>
                                    Provide required segments for sensitive
                                    accounts.
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Lines Grid */}
                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-700">
                            Lines
                        </h3>
                        <div className="flex items-center gap-2">
                            <button
                                className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50"
                                onClick={() => addLine()}
                            >
                                + Add Line
                            </button>
                            <button
                                className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50"
                                onClick={() =>
                                    navigator.clipboard
                                        .readText()
                                        .then((text) => {
                                            // simple paste: rows separated by newlines, columns by tabs
                                            const rows = text
                                                .split(/\r?\n/)
                                                .map((r) => r.split("\t"));
                                            const mapped: JournalLine[] = rows
                                                .filter((r) =>
                                                    r.some(
                                                        (c) => c.trim() !== ""
                                                    )
                                                )
                                                .map((r, i) => ({
                                                    id: uid(),
                                                    journal_entry_id: header.id,
                                                    line_no:
                                                        lines.length + i + 1,
                                                    account_id:
                                                        r[0]?.trim() || "",
                                                    account_name:
                                                        r[1]?.trim() || "",
                                                    debit: r[3]?.trim() || "",
                                                    credit: r[4]?.trim() || "",
                                                    amount_dc:
                                                        r[3]?.trim() &&
                                                        !isNaN(
                                                            Number(
                                                                r[3].replace(
                                                                    /,/g,
                                                                    ""
                                                                )
                                                            )
                                                        )
                                                            ? Number(
                                                                  r[3].replace(
                                                                      /,/g,
                                                                      ""
                                                                  )
                                                              )
                                                            : r[4]?.trim() &&
                                                              !isNaN(
                                                                  Number(
                                                                      r[4].replace(
                                                                          /,/g,
                                                                          ""
                                                                      )
                                                                  )
                                                              )
                                                            ? -Number(
                                                                  r[4].replace(
                                                                      /,/g,
                                                                      ""
                                                                  )
                                                              )
                                                            : 0,
                                                    currency_code:
                                                        header.currency_code ||
                                                        "PHP",
                                                    fx_rate:
                                                        header.fx_rate || "1",
                                                    amount_txn:
                                                        r[3]?.trim() &&
                                                        !isNaN(
                                                            Number(
                                                                r[3].replace(
                                                                    /,/g,
                                                                    ""
                                                                )
                                                            )
                                                        )
                                                            ? Number(
                                                                  r[3].replace(
                                                                      /,/g,
                                                                      ""
                                                                  )
                                                              )
                                                            : r[4]?.trim() &&
                                                              !isNaN(
                                                                  Number(
                                                                      r[4].replace(
                                                                          /,/g,
                                                                          ""
                                                                      )
                                                                  )
                                                              )
                                                            ? Number(
                                                                  r[4].replace(
                                                                      /,/g,
                                                                      ""
                                                                  )
                                                              )
                                                            : 0,
                                                    cost_center_id:
                                                        r[5]?.trim() || "",
                                                    department_id: "",
                                                    project_id:
                                                        r[6]?.trim() || "",
                                                    partner_id: "",
                                                    tax_code_id: "",
                                                    memo: r[2]?.trim() || "",
                                                }));
                                            if (mapped.length)
                                                setLines((prev) => [
                                                    ...prev,
                                                    ...mapped,
                                                ]);
                                        })
                                }
                                title="Paste tabular data from Excel (code, name, desc, debit, credit, costCenter, project)"
                            >
                                Paste from Excel
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] table-fixed border-separate border-spacing-0">
                            <thead>
                                <tr className="text-left text-xs text-slate-600">
                                    <th className="sticky left-0 z-10 w-10 border-b border-slate-200 bg-white px-3 py-2">
                                        #
                                    </th>
                                    <th className="w-48 border-b border-slate-200 px-3 py-2">
                                        Account
                                    </th>
                                    <th className="w-64 border-b border-slate-200 px-3 py-2">
                                        Description
                                    </th>
                                    <th className="w-36 border-b border-slate-200 px-3 py-2 text-right">
                                        Debit
                                    </th>
                                    <th className="w-36 border-b border-slate-200 px-3 py-2 text-right">
                                        Credit
                                    </th>
                                    <th className="w-36 border-b border-slate-200 px-3 py-2">
                                        Cost Center
                                    </th>
                                    <th className="w-36 border-b border-slate-200 px-3 py-2">
                                        Project
                                    </th>
                                    <th className="w-24 border-b border-slate-200 px-3 py-2">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {lines.map((l, idx) => {
                                    const rowErrs = errors[l.id] || [];
                                    return (
                                        <tr
                                            key={l.id}
                                            className="align-top text-sm"
                                        >
                                            <td className="sticky left-0 z-10 bg-white px-3 py-2 font-mono text-slate-600">
                                                {idx + 1}
                                            </td>
                                            <td className="px-3 py-2">
                                                <AccountPicker
                                                    value={
                                                        l.account_id
                                                            ? {
                                                                  code: l.account_id,
                                                                  name: l.account_name,
                                                              }
                                                            : null
                                                    }
                                                    onSelect={(acc) =>
                                                        setLines((prev) =>
                                                            prev.map((pl) =>
                                                                pl.id === l.id
                                                                    ? {
                                                                          ...pl,
                                                                          accountCode:
                                                                              acc?.code ||
                                                                              "",
                                                                          accountName:
                                                                              acc?.name ||
                                                                              "",
                                                                      }
                                                                    : pl
                                                            )
                                                        )
                                                    }
                                                    placeholder="Code or name"
                                                />
                                                {rowErrs.includes(
                                                    "Account is required"
                                                ) && (
                                                    <p className="mt-1 text-xs text-rose-600">
                                                        Account is required
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-3 py-2">
                                                <input
                                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                                                    value={l.memo}
                                                    onChange={(e) =>
                                                        setLines((prev) =>
                                                            prev.map((pl) =>
                                                                pl.id === l.id
                                                                    ? {
                                                                          ...pl,
                                                                          description:
                                                                              e
                                                                                  .target
                                                                                  .value,
                                                                      }
                                                                    : pl
                                                            )
                                                        )
                                                    }
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <input
                                                    inputMode="decimal"
                                                    className={`w-full rounded-lg border px-3 py-2 text-right font-mono focus:ring-2 focus:ring-indigo-500 ${
                                                        rowErrs.some((e) =>
                                                            e.includes(
                                                                "either Debit"
                                                            )
                                                        )
                                                            ? "border-rose-300"
                                                            : "border-gray-300"
                                                    }`}
                                                    value={l.debit}
                                                    onChange={(e) =>
                                                        setLines((prev) =>
                                                            prev.map((pl) =>
                                                                pl.id === l.id
                                                                    ? {
                                                                          ...pl,
                                                                          debit: e
                                                                              .target
                                                                              .value,
                                                                          credit:
                                                                              e
                                                                                  .target
                                                                                  .value &&
                                                                              e
                                                                                  .target
                                                                                  .value !==
                                                                                  "0"
                                                                                  ? ""
                                                                                  : pl.credit,
                                                                      }
                                                                    : pl
                                                            )
                                                        )
                                                    }
                                                />
                                                {rowErrs.some((e) =>
                                                    e.includes("either Debit")
                                                ) && (
                                                    <p className="mt-1 text-xs text-rose-600">
                                                        Enter either Debit or
                                                        Credit
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-3 py-2">
                                                <input
                                                    inputMode="decimal"
                                                    className={`w-full rounded-lg border px-3 py-2 text-right font-mono focus:ring-2 focus:ring-indigo-500 ${
                                                        rowErrs.some((e) =>
                                                            e.includes(
                                                                "either Debit"
                                                            )
                                                        )
                                                            ? "border-rose-300"
                                                            : "border-gray-300"
                                                    }`}
                                                    value={l.credit}
                                                    onChange={(e) =>
                                                        setLines((prev) =>
                                                            prev.map((pl) =>
                                                                pl.id === l.id
                                                                    ? {
                                                                          ...pl,
                                                                          credit: e
                                                                              .target
                                                                              .value,
                                                                          debit:
                                                                              e
                                                                                  .target
                                                                                  .value &&
                                                                              e
                                                                                  .target
                                                                                  .value !==
                                                                                  "0"
                                                                                  ? ""
                                                                                  : pl.debit,
                                                                      }
                                                                    : pl
                                                            )
                                                        )
                                                    }
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <input
                                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                                                    value={
                                                        l.cost_center_id || ""
                                                    }
                                                    onChange={(e) =>
                                                        setLines((prev) =>
                                                            prev.map((pl) =>
                                                                pl.id === l.id
                                                                    ? {
                                                                          ...pl,
                                                                          cost_center_id:
                                                                              e
                                                                                  .target
                                                                                  .value,
                                                                      }
                                                                    : pl
                                                            )
                                                        )
                                                    }
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <input
                                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                                                    value={l.project_id || ""}
                                                    onChange={(e) =>
                                                        setLines((prev) =>
                                                            prev.map((pl) =>
                                                                pl.id === l.id
                                                                    ? {
                                                                          ...pl,
                                                                          project:
                                                                              e
                                                                                  .target
                                                                                  .value,
                                                                      }
                                                                    : pl
                                                            )
                                                        )
                                                    }
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        className="rounded-lg border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50"
                                                        onClick={() =>
                                                            addLine(idx)
                                                        }
                                                    >
                                                        Insert
                                                    </button>
                                                    <button
                                                        className="rounded-lg border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50"
                                                        onClick={() =>
                                                            duplicateLine(l.id)
                                                        }
                                                    >
                                                        Duplicate
                                                    </button>
                                                    <button
                                                        className="rounded-lg border border-rose-300 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50"
                                                        onClick={() =>
                                                            deleteLine(l.id)
                                                        }
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                                {rowErrs.some((e) =>
                                                    e.includes("required")
                                                ) &&
                                                    !rowErrs.includes(
                                                        "Account is required"
                                                    ) && (
                                                        <p className="mt-1 text-xs text-rose-600">
                                                            {rowErrs.find((e) =>
                                                                e.includes(
                                                                    "required"
                                                                )
                                                            )}
                                                        </p>
                                                    )}
                                                {rowErrs.includes(
                                                    "Debit or Credit is required"
                                                ) && (
                                                    <p className="mt-1 text-xs text-rose-600">
                                                        Debit or Credit is
                                                        required
                                                    </p>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals footer */}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="text-xs text-slate-500">
                            Hotkeys: ⌘/Ctrl+S Save · Use Excel paste ·
                            Insert/Duplicate/Delete per line
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-slate-100 px-3 py-2 font-mono text-sm text-slate-800">
                                Dr {currency(totals.debit)}
                            </div>
                            <div className="rounded-xl bg-slate-100 px-3 py-2 font-mono text-sm text-slate-800">
                                Cr {currency(totals.credit)}
                            </div>
                            <div
                                className={`rounded-xl px-3 py-2 font-mono text-sm ${
                                    isBalanced
                                        ? "bg-emerald-100 text-emerald-700"
                                        : "bg-amber-100 text-amber-800"
                                }`}
                            >
                                {isBalanced
                                    ? "Balanced"
                                    : `Diff ${currency(Math.abs(totals.diff))}`}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Errors (header) */}
                {errors["__header"] && (
                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                        <p className="font-semibold">
                            Please fix the following:
                        </p>
                        <ul className="mt-1 list-disc pl-5">
                            {(errors["__header"] as string[]).map((e, i) => (
                                <li key={i}>{e}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Toast */}
                {toast && (
                    <div className="fixed bottom-4 right-4 rounded-xl bg-slate-900/90 px-4 py-2 text-sm text-white shadow-lg">
                        {toast}
                    </div>
                )}

                {/* Read-only voucher preview after posting */}
                {header.status === "Posted" && (
                    <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                        <div className="mb-2 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-emerald-800">
                                Posted Voucher
                            </h3>
                            <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs text-white">
                                Posted
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-emerald-900">
                            <div>
                                JE No:{" "}
                                <span className="font-mono">
                                    {header.je_no}
                                </span>
                            </div>
                            <div>Date: {header.doc_date}</div>
                            <div>Period: {header.period_id}</div>
                            <div>Currency: {header.currency_code}</div>
                            {header.reference && (
                                <div className="col-span-2">
                                    Reference: {header.reference}
                                </div>
                            )}
                            {header.memo && (
                                <div className="col-span-2">
                                    Memo: {header.memo}
                                </div>
                            )}
                        </div>
                        <div className="mt-3 overflow-x-auto">
                            <table className="w-full min-w-[700px] table-fixed border-separate border-spacing-0">
                                <thead>
                                    <tr className="text-left text-xs text-emerald-800">
                                        <th className="w-40 border-b border-emerald-200 px-3 py-2">
                                            Account
                                        </th>
                                        <th className="border-b border-emerald-200 px-3 py-2">
                                            Description
                                        </th>
                                        <th className="w-32 border-b border-emerald-200 px-3 py-2 text-right">
                                            Debit
                                        </th>
                                        <th className="w-32 border-b border-emerald-200 px-3 py-2 text-right">
                                            Credit
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lines.map((l) => (
                                        <tr
                                            key={l.id}
                                            className="text-sm text-emerald-900"
                                        >
                                            <td className="px-3 py-2 font-mono">
                                                {l.account_id}{" "}
                                                {l.account_name &&
                                                    `- ${l.account_name}`}
                                            </td>
                                            <td className="px-3 py-2">
                                                {l.memo}
                                            </td>
                                            <td className="px-3 py-2 text-right font-mono">
                                                {num(l.debit)
                                                    ? currency(num(l.debit))
                                                    : ""}
                                            </td>
                                            <td className="px-3 py-2 text-right font-mono">
                                                {num(l.credit)
                                                    ? currency(num(l.credit))
                                                    : ""}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td
                                            className="px-3 py-2"
                                            colSpan={2}
                                        ></td>
                                        <td className="px-3 py-2 text-right font-mono font-semibold">
                                            {currency(totals.debit)}
                                        </td>
                                        <td className="px-3 py-2 text-right font-mono font-semibold">
                                            {currency(totals.credit)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
