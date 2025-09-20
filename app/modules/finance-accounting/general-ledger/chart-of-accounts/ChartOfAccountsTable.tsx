"use client";

import { useMemo, useState } from "react";
import type { Account } from "@prisma/client";

type SortKey = "code" | "name";
type SortDirection = "asc" | "desc";

type SortConfig = {
    key: SortKey;
    direction: SortDirection;
};

type ChartOfAccountsTableProps = {
    accounts: Account[];
};

const directionLabels: Record<SortDirection, string> = {
    asc: "ascending",
    desc: "descending",
};

const getSortDescription = (
    sortConfig: SortConfig,
    column: SortKey,
) => {
    if (sortConfig.key === column) {
        return `currently sorted ${directionLabels[sortConfig.direction]}`;
    }

    return "currently unsorted";
};

function getAriaSort(
    sortConfig: SortConfig,
    column: SortKey,
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

export default function ChartOfAccountsTable({
    accounts,
}: ChartOfAccountsTableProps) {
    const [sortConfig, setSortConfig] = useState<SortConfig>({
        key: "code",
        direction: "asc",
    });

    const sortedAccounts = useMemo(() => {
        const sorted = [...accounts];

        sorted.sort((a, b) => {
            const valueA = a[sortConfig.key];
            const valueB = b[sortConfig.key];

            if (valueA === valueB) {
                return 0;
            }

            const stringA = valueA == null ? "" : String(valueA);
            const stringB = valueB == null ? "" : String(valueB);

            if (sortConfig.direction === "asc") {
                return stringA.localeCompare(stringB, undefined, { sensitivity: "base" });
            }

            return stringB.localeCompare(stringA, undefined, { sensitivity: "base" });
        });

        return sorted;
    }, [accounts, sortConfig]);

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
        <table className="relative min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
                <tr>
                    <th
                        scope="col"
                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                        aria-sort={getAriaSort(sortConfig, "code")}
                    >
                        <button
                            type="button"
                            onClick={() => handleSort("code")}
                            className="flex items-center gap-1 text-left font-semibold text-gray-900 focus:outline-none focus-visible:underline"
                        >
                            <span>Code</span>
                            <SortIndicator
                                active={sortConfig.key === "code"}
                                direction={sortConfig.direction}
                            />
                            <span className="sr-only">
                                Sort by code, {getSortDescription(sortConfig, "code")}
                            </span>
                        </button>
                    </th>
                    <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                        aria-sort={getAriaSort(sortConfig, "name")}
                    >
                        <button
                            type="button"
                            onClick={() => handleSort("name")}
                            className="flex items-center gap-1 text-left font-semibold text-gray-900 focus:outline-none focus-visible:underline"
                        >
                            <span>Name</span>
                            <SortIndicator
                                active={sortConfig.key === "name"}
                                direction={sortConfig.direction}
                            />
                            <span className="sr-only">
                                Sort by name, {getSortDescription(sortConfig, "name")}
                            </span>
                        </button>
                    </th>
                    <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                        Type
                    </th>
                    <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                        Normal Balance
                    </th>
                    <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                        Status
                    </th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
                {sortedAccounts.map((account) => (
                    <tr key={account.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                            {account.code}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {account.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {account.type}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {account.normal_balance}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {account.status}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
