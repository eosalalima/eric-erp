"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";

const pageSizeOptions = [10, 20, 50, 100] as const;
type PageSizeOption = (typeof pageSizeOptions)[number];

export type DataListColumn<T> = {
    /** Unique identifier for the column */
    id: string;
    /** Header label rendered in the table head */
    header: ReactNode;
    /** Optional class name to apply to the header cell */
    headerClassName?: string;
    /** Optional class name to apply to the body cells */
    cellClassName?: string;
    /** Field accessor to render plain values */
    field?: keyof T;
    /** Custom accessor to render complex content */
    accessor?: (item: T) => ReactNode;
    /** Optional accessor used when performing a text search */
    searchAccessor?: (item: T) => string | number | boolean | null | undefined;
    /** Whether the column should be included in searches. Defaults to true. */
    searchable?: boolean;
};

export type DataListViewProps<T> = {
    columns: DataListColumn<T>[];
    data: T[];
    onAdd: () => void;
    onEdit: (item: T) => void;
    onDelete: (item: T) => void;
    getRowId?: (item: T, index: number) => string | number;
    initialPageSize?: PageSizeOption;
    searchPlaceholder?: string;
    onSearchTermChange?: (searchTerm: string) => void;
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (pageSize: PageSizeOption) => void;
};

const getCellValue = <T,>(column: DataListColumn<T>, item: T): ReactNode => {
    if (column.accessor) {
        return column.accessor(item);
    }

    if (column.field) {
        const value = item[column.field];
        if (value == null) {
            return "";
        }

        return typeof value === "string" || typeof value === "number"
            ? value
            : String(value);
    }

    return null;
};

const getSearchableValue = <T,>(column: DataListColumn<T>, item: T): string => {
    if (column.searchable === false) {
        return "";
    }

    if (column.searchAccessor) {
        const value = column.searchAccessor(item);
        return value == null ? "" : String(value);
    }

    if (column.field) {
        const value = item[column.field];
        return value == null ? "" : String(value);
    }

    return "";
};

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

export default function DataListView<T>({
    columns,
    data,
    onAdd,
    onEdit,
    onDelete,
    getRowId,
    initialPageSize = 10,
    searchPlaceholder = "Search records",
    onSearchTermChange,
    onPageChange,
    onPageSizeChange,
}: DataListViewProps<T>) {
    const [searchTerm, setSearchTerm] = useState("");
    const [pageSize, setPageSize] = useState<PageSizeOption>(initialPageSize);
    const [currentPage, setCurrentPage] = useState(1);

    const searchableColumns = useMemo(
        () => columns.filter((column) => column.searchable !== false),
        [columns]
    );

    const filteredData = useMemo(() => {
        if (!searchTerm.trim()) {
            return data;
        }

        const normalizedSearch = searchTerm.trim().toLowerCase();

        return data.filter((item) =>
            searchableColumns.some((column) =>
                getSearchableValue(column, item)
                    .toLowerCase()
                    .includes(normalizedSearch)
            )
        );
    }, [data, searchTerm, searchableColumns]);

    const pageCount = useMemo(() => {
        if (filteredData.length === 0) {
            return 1;
        }

        return Math.ceil(filteredData.length / pageSize);
    }, [filteredData.length, pageSize]);

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return filteredData.slice(startIndex, startIndex + pageSize);
    }, [filteredData, currentPage, pageSize]);

    useEffect(() => {
        const clampedPage = clamp(currentPage, 1, pageCount);
        if (clampedPage !== currentPage) {
            setCurrentPage(clampedPage);
            onPageChange?.(clampedPage);
        }
    }, [currentPage, pageCount, onPageChange]);

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const nextSearchTerm = event.target.value;
        setSearchTerm(nextSearchTerm);
        setCurrentPage(1);
        onSearchTermChange?.(nextSearchTerm);
        onPageChange?.(1);
    };

    const handlePageSizeChange = (
        event: React.ChangeEvent<HTMLSelectElement>
    ) => {
        const nextPageSize = Number(event.target.value) as PageSizeOption;
        setPageSize(nextPageSize);
        setCurrentPage(1);
        onPageSizeChange?.(nextPageSize);
        onPageChange?.(1);
    };

    const goToPage = (page: number) => {
        const clampedPage = clamp(page, 1, pageCount);
        setCurrentPage(clampedPage);
        onPageChange?.(clampedPage);
    };

    const handleAdd = () => {
        onAdd();
    };

    const handleEdit = (item: T) => {
        onEdit(item);
    };

    const handleDelete = (item: T) => {
        onDelete(item);
    };

    return (
        <div className="flex flex-col h-full max-h-[calc(85vh-8rem)]">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-xs">
                    <input
                        type="search"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        placeholder={searchPlaceholder}
                        className="block w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        aria-label="Search"
                    />
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="size-5"
                            aria-hidden="true"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="m21 21-3.5-3.5m0 0a7 7 0 1 0-9.9 0 7 7 0 0 0 9.9 0Z"
                            />
                        </svg>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={handleAdd}
                    className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                    Add
                </button>
            </div>
            <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto">
                <table className="relative min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-200 sticky top-0 z-10">
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.id}
                                    scope="col"
                                    className={`px-3 py-3.5 text-left text-sm font-semibold text-gray-900 ${
                                        column.headerClassName ?? ""
                                    }`}
                                >
                                    {column.header}
                                </th>
                            ))}
                            <th
                                scope="col"
                                className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                            >
                                Action
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {paginatedData.map((item, index) => {
                            const key = getRowId
                                ? getRowId(item, index)
                                : index;

                            return (
                                <tr key={key}>
                                    {columns.map((column) => (
                                        <td
                                            key={column.id}
                                            className={`whitespace-nowrap px-3 py-4 text-sm text-gray-500 ${
                                                column.cellClassName ?? ""
                                            }`}
                                        >
                                            {getCellValue(column, item)}
                                        </td>
                                    ))}
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                        <button
                                            type="button"
                                            className="text-indigo-600 hover:text-indigo-900"
                                            aria-label="Edit"
                                            onClick={() => handleEdit(item)}
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
                                                    d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                                                />
                                            </svg>
                                        </button>
                                        <button
                                            type="button"
                                            className="ml-3 text-red-600 hover:text-red-900"
                                            aria-label="Delete"
                                            onClick={() => handleDelete(item)}
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
                            );
                        })}
                        {paginatedData.length === 0 && (
                            <tr>
                                <td
                                    colSpan={columns.length + 1}
                                    className="px-3 py-6 text-center text-sm text-gray-500"
                                >
                                    No records found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">
                        Rows per page:
                    </span>
                    <select
                        value={pageSize}
                        onChange={handlePageSizeChange}
                        className="rounded-md border border-gray-300 bg-white py-1.5 pl-3 pr-8 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        {pageSizeOptions.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center justify-end gap-3 text-sm text-gray-700">
                    <span>
                        Page {pageCount === 0 ? 0 : currentPage} of {pageCount}
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage <= 1}
                            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2 py-1 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <button
                            type="button"
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage >= pageCount}
                            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2 py-1 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
