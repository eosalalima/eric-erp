"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import {
    MagnifyingGlassIcon,
    FunnelIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";
import { PlusIcon } from "@heroicons/react/20/solid";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import Breadcrumb from "@/components/layout/Breadcrumb";
import PageHeader from "@/components/layout/PageHeader";
import { RedirectToSignIn, SignedIn, SignedOut } from "@clerk/nextjs";
import JournalEntriesTable, { JournalEntry } from "./JournalEntriesTable";

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

type JournalLineForm = {
    account: string;
    debit: string;
    credit: string;
    memo: string;
};

type JournalEntryForm = {
    entryDate: string;
    period: string;
    currency: string;
    exchangeRate: string;
    referenceNumber: string;
    memo: string;
    autoReverse: boolean;
    lines: JournalLineForm[];
};

type JournalLineError = {
    account?: string;
    debit?: string;
    credit?: string;
    amount?: string;
};

type JournalEntryErrors = {
    entryDate?: string;
    period?: string;
    currency?: string;
    exchangeRate?: string;
    referenceNumber?: string;
    memo?: string;
    form?: string;
    lines: JournalLineError[];
};

const createEmptyLine = (): JournalLineForm => ({
    account: "",
    debit: "",
    credit: "",
    memo: "",
});

const createDefaultEntryForm = (): JournalEntryForm => ({
    entryDate: "",
    period: "",
    currency: "USD",
    exchangeRate: "1.00",
    referenceNumber: "",
    memo: "",
    autoReverse: false,
    lines: [createEmptyLine()],
});

const createDefaultErrors = (lineCount: number): JournalEntryErrors => ({
    lines: Array.from({ length: lineCount }, () => ({} as JournalLineError)),
});

const validateEntryForm = (
    form: JournalEntryForm
): {
    errors: JournalEntryErrors;
    totalDebit: number;
    totalCredit: number;
    isValid: boolean;
} => {
    const errors: JournalEntryErrors = {
        ...createDefaultErrors(form.lines.length),
    };

    if (!form.period.trim()) {
        errors.period = "Period is required.";
    }

    if (!form.entryDate.trim()) {
        errors.entryDate = "Entry date is required.";
    }

    if (!form.currency.trim()) {
        errors.currency = "Currency is required.";
    }

    if (!form.exchangeRate.trim()) {
        errors.exchangeRate = "Exchange rate is required.";
    } else {
        const exchangeRateValue = Number(form.exchangeRate);
        if (Number.isNaN(exchangeRateValue) || exchangeRateValue <= 0) {
            errors.exchangeRate = "Enter a valid exchange rate.";
        }
    }

    if (!form.referenceNumber.trim()) {
        errors.referenceNumber = "Reference number is required.";
    }

    let totalDebit = 0;
    let totalCredit = 0;
    let hasAmount = false;

    form.lines.forEach((line, index) => {
        const lineErrors: JournalLineError = {};
        if (!line.account.trim()) {
            lineErrors.account = "Account is required.";
        }

        const debitValue = line.debit.trim() === "" ? 0 : Number(line.debit);
        const creditValue = line.credit.trim() === "" ? 0 : Number(line.credit);

        if (line.debit.trim() !== "" && Number.isNaN(debitValue)) {
            lineErrors.debit = "Enter a valid number.";
        }

        if (line.credit.trim() !== "" && Number.isNaN(creditValue)) {
            lineErrors.credit = "Enter a valid number.";
        }

        if (
            !lineErrors.debit &&
            !lineErrors.credit &&
            line.debit.trim() !== "" &&
            line.credit.trim() !== ""
        ) {
            lineErrors.amount = "Use either debit or credit, not both.";
        }

        if (
            !lineErrors.debit &&
            !lineErrors.credit &&
            debitValue <= 0 &&
            creditValue <= 0
        ) {
            lineErrors.amount = "Enter a debit or credit amount.";
        }

        if (!lineErrors.debit && !lineErrors.credit && !lineErrors.amount) {
            hasAmount = true;
            totalDebit += debitValue;
            totalCredit += creditValue;
        }

        errors.lines[index] = lineErrors;
    });

    if (!hasAmount) {
        errors.form = "Add at least one journal line with an amount.";
    } else if (Math.abs(totalDebit - totalCredit) > 0.01) {
        errors.form = "Total debits must equal total credits.";
    }

    const hasFieldErrors = Object.entries(errors).some(([key, value]) => {
        if (key === "lines" || key === "form") {
            return false;
        }

        return Boolean(value);
    });

    const hasLineErrors = errors.lines.some(
        (lineError) => Object.keys(lineError).length > 0
    );

    const hasErrors = Boolean(errors.form) || hasFieldErrors || hasLineErrors;

    return {
        errors,
        totalDebit,
        totalCredit,
        isValid: !hasErrors,
    };
};

export default function JournalEntriesPage() {
    const [entries, setEntries] = useState<JournalEntry[]>(sampleEntries);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [entryForm, setEntryForm] = useState<JournalEntryForm>(
        createDefaultEntryForm
    );
    const [formErrors, setFormErrors] = useState<JournalEntryErrors>(
        createDefaultErrors(1)
    );

    const resetFormState = () => {
        const defaultForm = createDefaultEntryForm();
        setEntryForm(defaultForm);
        setFormErrors(createDefaultErrors(defaultForm.lines.length));
    };

    const openModal = () => {
        resetFormState();
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        resetFormState();
    };

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

    const handleEntryFieldChange =
        (field: keyof Omit<JournalEntryForm, "lines" | "autoReverse">) =>
        (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
            const value = event.target.value;
            setEntryForm((current) => ({
                ...current,
                [field]: value,
            }));
            setFormErrors((current) => ({
                ...current,
                [field]: undefined,
                form: undefined,
            }));
        };

    const handleMemoChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
        const value = event.target.value;
        setEntryForm((current) => ({
            ...current,
            memo: value,
        }));
        setFormErrors((current) => ({
            ...current,
            memo: undefined,
            form: undefined,
        }));
    };

    const handleAutoReverseChange = (
        event: ChangeEvent<HTMLInputElement>
    ) => {
        const checked = event.target.checked;
        setEntryForm((current) => ({
            ...current,
            autoReverse: checked,
        }));
        setFormErrors((current) => ({
            ...current,
            form: undefined,
        }));
    };

    const handleLineChange = <Field extends keyof JournalLineForm>(
        index: number,
        field: Field,
        value: JournalLineForm[Field]
    ) => {
        setEntryForm((current) => {
            const updatedLines = [...current.lines];
            updatedLines[index] = {
                ...updatedLines[index],
                [field]: value,
            };

            return {
                ...current,
                lines: updatedLines,
            };
        });

        setFormErrors((current) => {
            const updatedLines = [...current.lines];
            const existingLineErrors = updatedLines[index] ?? {};
            const updatedLineErrors: JournalLineError = {
                ...existingLineErrors,
                amount: undefined,
            };

            if (
                field === "account" ||
                field === "debit" ||
                field === "credit"
            ) {
                updatedLineErrors[field as keyof JournalLineError] = undefined;
            }

            updatedLines[index] = updatedLineErrors;

            return {
                ...current,
                lines: updatedLines,
                form: undefined,
            };
        });
    };

    const addJournalLine = () => {
        setEntryForm((current) => ({
            ...current,
            lines: [...current.lines, createEmptyLine()],
        }));
        setFormErrors((current) => ({
            ...current,
            lines: [...current.lines, {}],
            form: undefined,
        }));
    };

    const removeJournalLine = (index: number) => {
        setEntryForm((current) => {
            if (current.lines.length === 1) {
                return current;
            }

            const updatedLines = current.lines.filter(
                (_, idx) => idx !== index
            );

            return {
                ...current,
                lines: updatedLines,
            };
        });

        setFormErrors((current) => {
            if (current.lines.length === 1) {
                return current;
            }

            const updatedLines = current.lines.filter(
                (_, idx) => idx !== index
            );

            return {
                ...current,
                lines: updatedLines,
                form: undefined,
            };
        });
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const validation = validateEntryForm(entryForm);
        setFormErrors(validation.errors);

        if (!validation.isValid) {
            return;
        }

        const referenceNumber = entryForm.referenceNumber
            .trim()
            .toUpperCase();
        const memo = entryForm.memo.trim();
        const description =
            memo || entryForm.referenceNumber.trim() || "New journal entry";
        const today = new Date();
        const formattedToday = today.toISOString().slice(0, 10);
        const totalAmount = Number(validation.totalDebit.toFixed(2));

        const newEntry: JournalEntry = {
            id: `je-${Date.now()}`,
            entryNumber:
                referenceNumber || `JE-${today.getFullYear()}-${Date.now()}`,
            date: entryForm.entryDate,
            description,
            amount: totalAmount,
            status: "Draft",
            createdBy: "Current User",
            lastUpdated: entryForm.entryDate || formattedToday,
        };

        setEntries((current) => [newEntry, ...current]);
        closeModal();
    };

    const currencyOptions = ["USD", "EUR", "GBP", "JPY"];
    const periodOptions = [
        { label: "January 2024", value: "2024-01" },
        { label: "February 2024", value: "2024-02" },
        { label: "March 2024", value: "2024-03" },
    ];

    return (
        <>
            <SignedIn>
                <div className="flex min-h-screen flex-col p-5">
                    <Breadcrumb items={items} />
                    <PageHeader title="Journal Entries" />

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
                                        className="col-start-1 row-start-1 block w-full rounded-l-md bg-white py-1.5 pl-10 pr-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                                    />
                                    <MagnifyingGlassIcon
                                        aria-hidden="true"
                                        className="pointer-events-none col-start-1 row-start-1 ml-3 size-5 self-center text-gray-400 sm:size-4"
                                    />
                                </div>
                                <button
                                    type="button"
                                    className="flex shrink-0 items-center gap-x-1.5 rounded-r-md bg-white px-3 py-2 text-sm font-semibold text-gray-900  outline-1 -outline-offset-1 outline-gray-300 hover:bg-gray-50 focus:relative focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
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
                                    <FunnelIcon
                                        aria-hidden="true"
                                        className="size-4 text-gray-400"
                                    />
                                    Status
                                </label>
                                <select
                                    id="status-filter"
                                    name="status-filter"
                                    value={statusFilter}
                                    onChange={(event) => {
                                        setStatusFilter(
                                            event.target.value as StatusFilter
                                        );
                                    }}
                                    className="rounded-md border-0 bg-white py-1.5 pl-3 pr-8 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600"
                                >
                                    {statusOptions.map((option) => (
                                        <option
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <button
                            type="button"
                            className="inline-flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onClick={openModal}
                        >
                            <PlusIcon aria-hidden="true" className="size-5" />
                            New Entry
                        </button>
                    </div>

                    <div className="mt-4 text-sm text-gray-500">
                        Showing {filteredEntries.length} of {entries.length}{" "}
                        journal entries
                    </div>

                    <div className="mt-8 flex flex-1 min-h-0 flex-col">
                        <div className="-mx-4 -my-2 flex-1 min-h-0 overflow-x-auto sm:-mx-6 lg:-mx-8">
                            <div className="flex h-full min-w-full flex-col py-2 align-middle sm:px-6 lg:px-8">
                                <div className="flex flex-1 min-h-0 flex-col overflow-hidden shadow outline-1 outline-black/5 sm:rounded-lg">
                                    {filteredEntries.length === 0 ? (
                                        <div className="p-4 text-sm text-gray-500">
                                            No journal entries match your
                                            filters.
                                        </div>
                                    ) : (
                                        <div className="flex-1 min-h-0 overflow-y-auto">
                                            <JournalEntriesTable
                                                entries={filteredEntries}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <Dialog
                        open={isModalOpen}
                        onClose={closeModal}
                        className="relative z-10"
                    >
                        <div
                            className="fixed inset-0 bg-gray-500/75"
                            aria-hidden="true"
                        />
                        <div className="fixed inset-0 z-10 overflow-y-auto">
                            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-6">
                                <DialogPanel className="relative w-full max-w-4xl transform overflow-hidden rounded-lg bg-white p-6 text-left shadow-xl transition-all">
                                    <div className="flex items-start justify-between gap-4">
                                        <DialogTitle className="text-base font-semibold text-gray-900">
                                            New Journal Entry
                                        </DialogTitle>
                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            className="rounded-md p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <span className="sr-only">
                                                Close
                                            </span>
                                            <XMarkIcon
                                                aria-hidden="true"
                                                className="size-5"
                                            />
                                        </button>
                                    </div>
                                    <form
                                        className="mt-6 space-y-6"
                                        onSubmit={handleSubmit}
                                    >
                                        {formErrors.form ? (
                                            <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
                                                {formErrors.form}
                                            </div>
                                        ) : null}
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                            <div>
                                                <label
                                                    htmlFor="entryDate"
                                                    className="block text-sm font-medium text-gray-700"
                                                >
                                                    Date
                                                </label>
                                                <input
                                                    type="date"
                                                    id="entryDate"
                                                    name="entryDate"
                                                    value={entryForm.entryDate}
                                                    onChange={handleEntryFieldChange(
                                                        "entryDate"
                                                    )}
                                                    className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                />
                                                {formErrors.entryDate ? (
                                                    <p className="mt-1 text-sm text-red-600">
                                                        {formErrors.entryDate}
                                                    </p>
                                                ) : null}
                                            </div>
                                            <div>
                                                <label
                                                    htmlFor="period"
                                                    className="block text-sm font-medium text-gray-700"
                                                >
                                                    Period
                                                </label>
                                                <select
                                                    id="period"
                                                    name="period"
                                                    value={entryForm.period}
                                                    onChange={handleEntryFieldChange(
                                                        "period"
                                                    )}
                                                    className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                >
                                                    <option value="">
                                                        Select a period
                                                    </option>
                                                    {periodOptions.map(
                                                        (option) => (
                                                            <option
                                                                key={
                                                                    option.value
                                                                }
                                                                value={
                                                                    option.value
                                                                }
                                                            >
                                                                {option.label}
                                                            </option>
                                                        )
                                                    )}
                                                </select>
                                                {formErrors.period ? (
                                                    <p className="mt-1 text-sm text-red-600">
                                                        {formErrors.period}
                                                    </p>
                                                ) : null}
                                            </div>
                                            <div>
                                                <label
                                                    htmlFor="currency"
                                                    className="block text-sm font-medium text-gray-700"
                                                >
                                                    Currency
                                                </label>
                                                <select
                                                    id="currency"
                                                    name="currency"
                                                    value={entryForm.currency}
                                                    onChange={handleEntryFieldChange(
                                                        "currency"
                                                    )}
                                                    className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                >
                                                    <option value="">
                                                        Select a currency
                                                    </option>
                                                    {currencyOptions.map(
                                                        (option) => (
                                                            <option
                                                                key={option}
                                                                value={option}
                                                            >
                                                                {option}
                                                            </option>
                                                        )
                                                    )}
                                                </select>
                                                {formErrors.currency ? (
                                                    <p className="mt-1 text-sm text-red-600">
                                                        {formErrors.currency}
                                                    </p>
                                                ) : null}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                            <div>
                                                <label
                                                    htmlFor="exchangeRate"
                                                    className="block text-sm font-medium text-gray-700"
                                                >
                                                    Exchange Rate
                                                </label>
                                                <input
                                                    type="number"
                                                    id="exchangeRate"
                                                    name="exchangeRate"
                                                    min="0"
                                                    step="0.0001"
                                                    value={entryForm.exchangeRate}
                                                    onChange={handleEntryFieldChange(
                                                        "exchangeRate"
                                                    )}
                                                    className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                />
                                                {formErrors.exchangeRate ? (
                                                    <p className="mt-1 text-sm text-red-600">
                                                        {formErrors.exchangeRate}
                                                    </p>
                                                ) : null}
                                                <p className="mt-1 text-xs text-gray-500">
                                                    Use the spot rate for the journal date.
                                                </p>
                                            </div>
                                            <div>
                                                <label
                                                    htmlFor="referenceNumber"
                                                    className="block text-sm font-medium text-gray-700"
                                                >
                                                    Reference No.
                                                </label>
                                                <input
                                                    type="text"
                                                    id="referenceNumber"
                                                    name="referenceNumber"
                                                    value={entryForm.referenceNumber}
                                                    onChange={handleEntryFieldChange(
                                                        "referenceNumber"
                                                    )}
                                                    className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                    placeholder="Enter journal reference"
                                                />
                                                {formErrors.referenceNumber ? (
                                                    <p className="mt-1 text-sm text-red-600">
                                                        {formErrors.referenceNumber}
                                                    </p>
                                                ) : null}
                                                <p className="mt-1 text-xs text-gray-500">
                                                    This number will appear on listings and exports.
                                                </p>
                                            </div>
                                            <div>
                                                <span className="block text-sm font-medium text-gray-700">
                                                    Auto Reverse
                                                </span>
                                                <div className="mt-2 flex items-start gap-3 rounded-md border border-gray-200 px-3 py-2">
                                                    <input
                                                        type="checkbox"
                                                        id="autoReverse"
                                                        name="autoReverse"
                                                        checked={entryForm.autoReverse}
                                                        onChange={handleAutoReverseChange}
                                                        className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                    <label
                                                        htmlFor="autoReverse"
                                                        className="text-sm text-gray-600"
                                                    >
                                                        Reverse this entry in the next posting period.
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label
                                                htmlFor="memo"
                                                className="block text-sm font-medium text-gray-700"
                                            >
                                                Memo / Description
                                            </label>
                                            <textarea
                                                id="memo"
                                                name="memo"
                                                value={entryForm.memo}
                                                onChange={handleMemoChange}
                                                className="mt-1 min-h-28 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                placeholder="Describe the purpose of the journal entry"
                                            />
                                            {formErrors.memo ? (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {formErrors.memo}
                                                </p>
                                            ) : null}
                                            <p className="mt-1 text-xs text-gray-500">
                                                Provide details for reviewers and approvers.
                                            </p>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-semibold text-gray-900">
                                                    Journal Lines
                                                </h3>
                                                <button
                                                    type="button"
                                                    onClick={addJournalLine}
                                                    className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                >
                                                    Add line
                                                </button>
                                            </div>
                                            <div className="space-y-3">
                                                {entryForm.lines.map(
                                                    (line, index) => {
                                                        const lineErrors =
                                                            formErrors.lines[
                                                                index
                                                            ] || {};

                                                        return (
                                                            <div
                                                                key={`journal-line-${index}`}
                                                                className="rounded-lg border border-gray-200 p-4"
                                                            >
                                                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                                                    <div className="lg:col-span-1">
                                                                        <label
                                                                            htmlFor={`line-account-${index}`}
                                                                            className="block text-sm font-medium text-gray-700"
                                                                        >
                                                                            Account
                                                                        </label>
                                                                        <input
                                                                            type="text"
                                                                            id={`line-account-${index}`}
                                                                            name={`line-account-${index}`}
                                                                            value={
                                                                                line.account
                                                                            }
                                                                            onChange={(
                                                                                event
                                                                            ) =>
                                                                                handleLineChange(
                                                                                    index,
                                                                                    "account",
                                                                                    event
                                                                                        .target
                                                                                        .value
                                                                                )
                                                                            }
                                                                            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                                            placeholder="Account name or number"
                                                                        />
                                                                        {lineErrors.account ? (
                                                                            <p className="mt-1 text-sm text-red-600">
                                                                                {
                                                                                    lineErrors.account
                                                                                }
                                                                            </p>
                                                                        ) : null}
                                                                    </div>
                                                                    <div>
                                                                        <label
                                                                            htmlFor={`line-debit-${index}`}
                                                                            className="block text-sm font-medium text-gray-700"
                                                                        >
                                                                            Debit
                                                                        </label>
                                                                        <input
                                                                            type="number"
                                                                            id={`line-debit-${index}`}
                                                                            name={`line-debit-${index}`}
                                                                            min="0"
                                                                            step="0.01"
                                                                            value={
                                                                                line.debit
                                                                            }
                                                                            onChange={(
                                                                                event
                                                                            ) =>
                                                                                handleLineChange(
                                                                                    index,
                                                                                    "debit",
                                                                                    event
                                                                                        .target
                                                                                        .value
                                                                                )
                                                                            }
                                                                            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                                        />
                                                                        {lineErrors.debit ? (
                                                                            <p className="mt-1 text-sm text-red-600">
                                                                                {
                                                                                    lineErrors.debit
                                                                                }
                                                                            </p>
                                                                        ) : null}
                                                                    </div>
                                                                    <div>
                                                                        <label
                                                                            htmlFor={`line-credit-${index}`}
                                                                            className="block text-sm font-medium text-gray-700"
                                                                        >
                                                                            Credit
                                                                        </label>
                                                                        <input
                                                                            type="number"
                                                                            id={`line-credit-${index}`}
                                                                            name={`line-credit-${index}`}
                                                                            min="0"
                                                                            step="0.01"
                                                                            value={
                                                                                line.credit
                                                                            }
                                                                            onChange={(
                                                                                event
                                                                            ) =>
                                                                                handleLineChange(
                                                                                    index,
                                                                                    "credit",
                                                                                    event
                                                                                        .target
                                                                                        .value
                                                                                )
                                                                            }
                                                                            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                                        />
                                                                        {lineErrors.credit ? (
                                                                            <p className="mt-1 text-sm text-red-600">
                                                                                {
                                                                                    lineErrors.credit
                                                                                }
                                                                            </p>
                                                                        ) : null}
                                                                    </div>
                                                                    <div className="lg:col-span-1">
                                                                        <label
                                                                            htmlFor={`line-memo-${index}`}
                                                                            className="block text-sm font-medium text-gray-700"
                                                                        >
                                                                            Line
                                                                            Memo
                                                                        </label>
                                                                        <input
                                                                            type="text"
                                                                            id={`line-memo-${index}`}
                                                                            name={`line-memo-${index}`}
                                                                            value={
                                                                                line.memo
                                                                            }
                                                                            onChange={(
                                                                                event
                                                                            ) =>
                                                                                handleLineChange(
                                                                                    index,
                                                                                    "memo",
                                                                                    event
                                                                                        .target
                                                                                        .value
                                                                                )
                                                                            }
                                                                            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                                            placeholder="Optional memo"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                {lineErrors.amount ? (
                                                                    <p className="mt-3 text-sm text-red-600">
                                                                        {
                                                                            lineErrors.amount
                                                                        }
                                                                    </p>
                                                                ) : null}
                                                                {entryForm.lines
                                                                    .length >
                                                                1 ? (
                                                                    <div className="mt-4 flex justify-end">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                removeJournalLine(
                                                                                    index
                                                                                )
                                                                            }
                                                                            className="text-sm font-medium text-red-600 hover:text-red-500"
                                                                        >
                                                                            Remove
                                                                            line
                                                                        </button>
                                                                    </div>
                                                                ) : null}
                                                            </div>
                                                        );
                                                    }
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-end gap-3 pt-4">
                                            <button
                                                type="button"
                                                onClick={closeModal}
                                                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            >
                                                Save Entry
                                            </button>
                                        </div>
                                    </form>
                                </DialogPanel>
                            </div>
                        </div>
                    </Dialog>
                </div>
            </SignedIn>
            <SignedOut>
                <RedirectToSignIn redirectUrl="/signin" />
            </SignedOut>
        </>
    );
}
