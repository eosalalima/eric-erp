"use client";

import { useMemo, useState } from "react";
import { MagnifyingGlassIcon, FunnelIcon } from "@heroicons/react/24/outline";
import { PlusIcon } from "@heroicons/react/20/solid";
import Breadcrumb from "@/components/layout/Breadcrumb";
import PageHeader from "@/components/layout/PageHeader";
import { RedirectToSignIn, SignedIn, SignedOut } from "@clerk/nextjs";
import JournalEntriesTable, {
    JournalEntry,
} from "./JournalEntriesTable";

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
];

const sampleEntries: JournalEntry[] = [
    {
        id: "je-2024-001",
        entryNumber: "JE-2024-001",
        date: "2024-01-05",
        description: "January rent accrual",
        amount: 4500,
        status: "Posted",
        createdBy: "Alex Lopez",
        lastUpdated: "2024-01-07",
    },
    {
        id: "je-2024-002",
        entryNumber: "JE-2024-002",
        date: "2024-01-09",
        description: "Office supplies purchase",
        amount: 320.75,
        status: "Posted",
        createdBy: "Priya Patel",
        lastUpdated: "2024-01-10",
    },
    {
        id: "je-2024-003",
        entryNumber: "JE-2024-003",
        date: "2024-01-12",
        description: "Payroll adjustment",
        amount: 1895.25,
        status: "Draft",
        createdBy: "Samuel Green",
        lastUpdated: "2024-01-12",
    },
    {
        id: "je-2024-004",
        entryNumber: "JE-2024-004",
        date: "2024-01-20",
        description: "Revenue recognition - subscription",
        amount: 8250,
        status: "Posted",
        createdBy: "Alex Lopez",
        lastUpdated: "2024-01-21",
    },
    {
        id: "je-2024-005",
        entryNumber: "JE-2024-005",
        date: "2024-01-22",
        description: "Foreign currency revaluation",
        amount: 670.1,
        status: "Draft",
        createdBy: "Priya Patel",
        lastUpdated: "2024-01-23",
    },
    {
        id: "je-2024-006",
        entryNumber: "JE-2024-006",
        date: "2024-01-24",
        description: "Customer refund write-off",
        amount: 210,
        status: "Reversed",
        createdBy: "Samuel Green",
        lastUpdated: "2024-01-26",
    },
];

type StatusFilter = "all" | JournalEntry["status"];

const statusOptions: Array<{ label: string; value: StatusFilter }> = [
    { label: "All statuses", value: "all" },
    { label: "Draft", value: "Draft" },
    { label: "Posted", value: "Posted" },
    { label: "Reversed", value: "Reversed" },
];

export default function JournalEntriesPage() {
    const [entries] = useState<JournalEntry[]>(sampleEntries);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

    const filteredEntries = useMemo(() => {
        const normalizedQuery = searchQuery.trim().toLowerCase();

        return entries.filter((entry) => {
            const matchesQuery =
                normalizedQuery.length === 0 ||
                entry.entryNumber.toLowerCase().includes(normalizedQuery) ||
                entry.description.toLowerCase().includes(normalizedQuery) ||
                entry.createdBy.toLowerCase().includes(normalizedQuery);

            const matchesStatus =
                statusFilter === "all" || entry.status === statusFilter;

            return matchesQuery && matchesStatus;
        });
    }, [entries, searchQuery, statusFilter]);

    return (
        <>
            <SignedIn>
                <div className="flex min-h-screen flex-col p-5">
                    <Breadcrumb items={items} />
                    <PageHeader
                        title="Journal Entries"
                        description="Review, search, and monitor journal entries posted to the general ledger."
                    />

                    <div className="mt-5 flex flex-wrap items-center gap-4">
                        <div className="flex w-full flex-1 flex-wrap items-center gap-3 sm:flex-nowrap">
                            <div className="flex min-w-0 flex-1">
                                <div className="-mr-px grid grow grid-cols-1 focus-within:relative">
                                    <input
                                        id="journal-entry-search"
                                        name="journal-entry-search"
                                        type="text"
                                        placeholder="Search by entry number, description, or preparer"
                                        value={searchQuery}
                                        onChange={(event) => {
                                            setSearchQuery(event.target.value);
                                        }}
                                        className="col-start-1 row-start-1 block w-full rounded-l-md bg-white py-1.5 pl-10 pr-3 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                                    />
                                    <MagnifyingGlassIcon
                                        aria-hidden="true"
                                        className="pointer-events-none col-start-1 row-start-1 ml-3 size-5 self-center text-gray-400 sm:size-4"
                                    />
                                </div>
                                <button
                                    type="button"
                                    className="flex shrink-0 items-center gap-x-1.5 rounded-r-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 hover:bg-gray-50 focus:relative focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                                >
                                    <MagnifyingGlassIcon
                                        aria-hidden="true"
                                        className="-ml-0.5 size-4 text-gray-400"
                                    />
                                    Search
                                </button>
                            </div>
                            <div className="flex items-center gap-2 sm:ml-4">
                                <label
                                    htmlFor="status-filter"
                                    className="inline-flex items-center gap-1 text-sm font-medium text-gray-700"
                                >
                                    <FunnelIcon aria-hidden="true" className="size-4 text-gray-400" />
                                    Status
                                </label>
                                <select
                                    id="status-filter"
                                    name="status-filter"
                                    value={statusFilter}
                                    onChange={(event) => {
                                        setStatusFilter(event.target.value as StatusFilter);
                                    }}
                                    className="rounded-md border-0 bg-white py-1.5 pl-3 pr-8 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600"
                                >
                                    {statusOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <button
                            type="button"
                            className="inline-flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <PlusIcon aria-hidden="true" className="size-5" />
                            New entry
                        </button>
                    </div>

                    <div className="mt-4 text-sm text-gray-500">
                        Showing {filteredEntries.length} of {entries.length} journal entries
                    </div>

                    <div className="mt-8 flex flex-1 min-h-0 flex-col">
                        <div className="-mx-4 -my-2 flex-1 min-h-0 overflow-x-auto sm:-mx-6 lg:-mx-8">
                            <div className="flex h-full min-w-full flex-col py-2 align-middle sm:px-6 lg:px-8">
                                <div className="flex flex-1 min-h-0 flex-col overflow-hidden shadow outline-1 outline-black/5 sm:rounded-lg">
                                    {filteredEntries.length === 0 ? (
                                        <div className="p-4 text-sm text-gray-500">
                                            No journal entries match your filters.
                                        </div>
                                    ) : (
                                        <div className="flex-1 min-h-0 overflow-y-auto">
                                            <JournalEntriesTable entries={filteredEntries} />
                                        </div>
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
