"use client";

import { useMemo, useState } from "react";

export type JournalEntry = {
    id: string;
    entryNumber: string;
    date: string;
    description: string;
    amount: number;
    status: "Draft" | "Posted" | "Reversed";
    createdBy: string;
    lastUpdated: string;
};

type SortKey = "entryNumber" | "date" | "status" | "amount";
type SortDirection = "asc" | "desc";

type SortConfig = {
    key: SortKey;
    direction: SortDirection;
};

const directionLabels: Record<SortDirection, string> = {
    asc: "ascending",
    desc: "descending",
};

const getSortDescription = (sortConfig: SortConfig, column: SortKey) => {
    if (sortConfig.key === column) {
        return `currently sorted ${directionLabels[sortConfig.direction]}`;
    }

    return "currently unsorted";
};

function getAriaSort(
    sortConfig: SortConfig,
    column: SortKey
): "ascending" | "descending" | "none" {
    if (sortConfig.key !== column) {
        return "none";
    }

    return sortConfig.direction === "asc" ? "ascending" : "descending";
}

const SortIndicator = ({
    active,
    direction,
}: {
    active: boolean;
    direction: SortDirection;
}) => (
    <span aria-hidden="true" className="text-xs">
        {active ? (direction === "asc" ? "▲" : "▼") : "↕"}
    </span>
);

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
    }).format(value);
};

const formatDate = (value: string) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
};

const getStatusStyles = (status: JournalEntry["status"]) => {
    switch (status) {
        case "Posted":
            return "bg-green-50 text-green-700 ring-green-600/20";
        case "Draft":
            return "bg-yellow-50 text-yellow-800 ring-yellow-600/20";
        case "Reversed":
            return "bg-red-50 text-red-700 ring-red-600/10";
        default:
            return "bg-gray-50 text-gray-700 ring-gray-600/10";
    }
};

const compareValues = (
    a: JournalEntry,
    b: JournalEntry,
    sortConfig: SortConfig
) => {
    const multiplier = sortConfig.direction === "asc" ? 1 : -1;

    if (sortConfig.key === "date") {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return (dateA - dateB) * multiplier;
    }

    if (sortConfig.key === "amount") {
        return (a.amount - b.amount) * multiplier;
    }

    const valueA = a[sortConfig.key];
    const valueB = b[sortConfig.key];

    const stringA = valueA == null ? "" : String(valueA);
    const stringB = valueB == null ? "" : String(valueB);

    return stringA.localeCompare(stringB, undefined, {
        sensitivity: "base",
    }) * multiplier;
};

type JournalEntriesTableProps = {
    entries: JournalEntry[];
};

export default function JournalEntriesTable({
    entries,
}: JournalEntriesTableProps) {
    const [sortConfig, setSortConfig] = useState<SortConfig>({
        key: "date",
        direction: "desc",
    });

    const sortedEntries = useMemo(() => {
        const sorted = [...entries];

        sorted.sort((first, second) => compareValues(first, second, sortConfig));

        return sorted;
    }, [entries, sortConfig]);

    const handleSort = (key: SortKey) => {
        setSortConfig((current) => {
            if (current.key === key) {
                return {
                    key,
                    direction: current.direction === "asc" ? "desc" : "asc",
                };
            }

            return {
                key,
                direction: "asc",
            };
        });
    };

    return (
        <div className="flex h-full max-h-[calc(85vh-8rem)] flex-col">
            <div className="flex-1 overflow-auto">
                <table className="relative min-w-full divide-y divide-gray-300">
                    <thead className="sticky top-0 z-10 bg-gray-50">
                        <tr>
                            <th
                                scope="col"
                                className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                                aria-sort={getAriaSort(sortConfig, "entryNumber")}
                            >
                                <button
                                    type="button"
                                    onClick={() => handleSort("entryNumber")}
                                    className="flex items-center gap-1 text-left font-semibold text-gray-900 focus:outline-none focus-visible:underline"
                                >
                                    <span>Entry #</span>
                                    <SortIndicator
                                        active={sortConfig.key === "entryNumber"}
                                        direction={sortConfig.direction}
                                    />
                                    <span className="sr-only">
                                        Sort by entry number, {" "}
                                        {getSortDescription(sortConfig, "entryNumber")}
                                    </span>
                                </button>
                            </th>
                            <th
                                scope="col"
                                className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                                aria-sort={getAriaSort(sortConfig, "date")}
                            >
                                <button
                                    type="button"
                                    onClick={() => handleSort("date")}
                                    className="flex items-center gap-1 text-left font-semibold text-gray-900 focus:outline-none focus-visible:underline"
                                >
                                    <span>Date</span>
                                    <SortIndicator
                                        active={sortConfig.key === "date"}
                                        direction={sortConfig.direction}
                                    />
                                    <span className="sr-only">
                                        Sort by date, {" "}
                                        {getSortDescription(sortConfig, "date")}
                                    </span>
                                </button>
                            </th>
                            <th
                                scope="col"
                                className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                            >
                                Description
                            </th>
                            <th
                                scope="col"
                                className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                                aria-sort={getAriaSort(sortConfig, "amount")}
                            >
                                <button
                                    type="button"
                                    onClick={() => handleSort("amount")}
                                    className="flex items-center gap-1 text-left font-semibold text-gray-900 focus:outline-none focus-visible:underline"
                                >
                                    <span>Total Amount</span>
                                    <SortIndicator
                                        active={sortConfig.key === "amount"}
                                        direction={sortConfig.direction}
                                    />
                                    <span className="sr-only">
                                        Sort by amount, {" "}
                                        {getSortDescription(sortConfig, "amount")}
                                    </span>
                                </button>
                            </th>
                            <th
                                scope="col"
                                className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                                aria-sort={getAriaSort(sortConfig, "status")}
                            >
                                <button
                                    type="button"
                                    onClick={() => handleSort("status")}
                                    className="flex items-center gap-1 text-left font-semibold text-gray-900 focus:outline-none focus-visible:underline"
                                >
                                    <span>Status</span>
                                    <SortIndicator
                                        active={sortConfig.key === "status"}
                                        direction={sortConfig.direction}
                                    />
                                    <span className="sr-only">
                                        Sort by status, {" "}
                                        {getSortDescription(sortConfig, "status")}
                                    </span>
                                </button>
                            </th>
                            <th
                                scope="col"
                                className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                            >
                                Created By
                            </th>
                            <th
                                scope="col"
                                className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                            >
                                Last Updated
                            </th>
                            <th
                                scope="col"
                                className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                            >
                                Action
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {sortedEntries.length === 0 ? (
                            <tr>
                                <td
                                    className="px-3 py-6 text-center text-sm text-gray-500"
                                    colSpan={8}
                                >
                                    No journal entries found.
                                </td>
                            </tr>
                        ) : (
                            sortedEntries.map((entry) => (
                                <tr key={entry.id}>
                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                        {entry.entryNumber}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                        {formatDate(entry.date)}
                                    </td>
                                    <td className="px-3 py-4 text-sm text-gray-900">
                                        <p className="font-medium text-gray-900">
                                            {entry.description}
                                        </p>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                        {formatCurrency(entry.amount)}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                                        <span
                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${getStatusStyles(entry.status)}`}
                                        >
                                            {entry.status}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                        {entry.createdBy}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                        {formatDate(entry.lastUpdated)}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                                        <button
                                            type="button"
                                            className="inline-flex items-center rounded-md px-2.5 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                                        >
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
