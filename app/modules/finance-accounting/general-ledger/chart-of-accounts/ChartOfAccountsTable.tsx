"use client";

import { useMemo, useState } from "react";
// Define the Account type locally if not available from @prisma/client
export type Account = {
    id: string;
    code: string;
    name: string;
    type: string;
    normal_balance: string;
    status: string;
    ledger_id: string;
    parent_id: string;
    level: number;
    description?: string | null;
    is_postable?: boolean;
};

type SortKey = "code" | "name";
type SortDirection = "asc" | "desc";

type SortConfig = {
    key: SortKey;
    direction: SortDirection;
};

type ChartOfAccountsTableProps = {
    accounts: Account[];
    onEdit: (account: Account) => void;
    onDelete: (account: Account) => void;
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

export default function ChartOfAccountsTable({
    accounts,
    onEdit,
    onDelete,
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
                return stringA.localeCompare(stringB, undefined, {
                    sensitivity: "base",
                });
            }

            return stringB.localeCompare(stringA, undefined, {
                sensitivity: "base",
            });
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
        <div className="flex flex-col h-full max-h-[calc(85vh-8rem)]">
            <div className="flex-1 overflow-auto">
                <table className="relative min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-200 sticky top-0 z-10">
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
                                        Sort by code,{" "}
                                        {getSortDescription(sortConfig, "code")}
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
                                        Sort by name,{" "}
                                        {getSortDescription(sortConfig, "name")}
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
                            <th
                                scope="col"
                                className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                            >
                                Action
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
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                    <button
                                        type="button"
                                        className="text-indigo-600 hover:text-indigo-900"
                                        aria-label="Edit"
                                        onClick={() => onEdit(account)}
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke-width="1.5"
                                            stroke="currentColor"
                                            className="size-6"
                                        >
                                            <path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                                            />
                                        </svg>
                                    </button>
                                    <button
                                        type="button"
                                        className="ml-3 text-red-600 hover:text-red-900"
                                        aria-label="Delete"
                                        onClick={() => onDelete(account)}
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={1.5}
                                            stroke="currentColor"
                                            className="size-6"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M6 7.5V19.125A2.625 2.625 0 0 0 8.625 21.75h6.75A2.625 2.625 0 0 0 18 19.125V7.5M4.5 7.5h15m-10.125 0V5.625A1.125 1.125 0 0 1 10.5 4.5h3a1.125 1.125 0 0 1 1.125 1.125V7.5"
                                            />
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
