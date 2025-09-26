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
    description: string;
    debit: string;
    credit: string;
    costCenter: string;
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
    description: "",
    debit: "",
    credit: "",
    costCenter: "",
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

const summarizeJournalLines = (
    lines: JournalLineForm[]
): {
    totalDebit: number;
    totalCredit: number;
    hasAmount: boolean;
    lineErrors: JournalLineError[];
} => {
    let totalDebit = 0;
    let totalCredit = 0;
    let hasAmount = false;
    const lineErrors = lines.map(() => ({} as JournalLineError));

    lines.forEach((line, index) => {
        const errors = lineErrors[index];

        if (!line.account.trim()) {
            errors.account = "Account is required.";
        }

        const debitValue = line.debit.trim() === "" ? 0 : Number(line.debit);
        const creditValue = line.credit.trim() === "" ? 0 : Number(line.credit);

        if (line.debit.trim() !== "" && Number.isNaN(debitValue)) {
            errors.debit = "Enter a valid number.";
        }

        if (line.credit.trim() !== "" && Number.isNaN(creditValue)) {
            errors.credit = "Enter a valid number.";
        }

        if (
            !errors.debit &&
            !errors.credit &&
            line.debit.trim() !== "" &&
            line.credit.trim() !== ""
        ) {
            errors.amount = "Use either debit or credit, not both.";
        }

        if (
            !errors.debit &&
            !errors.credit &&
            debitValue <= 0 &&
            creditValue <= 0
        ) {
            errors.amount = "Enter a debit or credit amount.";
        }

        if (!errors.debit && !errors.credit && !errors.amount) {
            hasAmount = true;
            totalDebit += debitValue;
            totalCredit += creditValue;
        }
    });

    return { totalDebit, totalCredit, hasAmount, lineErrors };
};

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

    const { totalDebit, totalCredit, hasAmount, lineErrors } =
        summarizeJournalLines(form.lines);

    errors.lines = lineErrors;

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

    const effectiveCurrency =
        entryForm.currency && entryForm.currency.trim().length === 3
            ? entryForm.currency
            : "USD";

    const currencyFormatter = useMemo(
        () =>
            new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: effectiveCurrency,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }),
        [effectiveCurrency]
    );

    const postingPreview = useMemo(() => {
        const validation = validateEntryForm(entryForm);

        const lines = entryForm.lines.map((line, index) => {
            const debitRaw = line.debit.trim();
            const creditRaw = line.credit.trim();
            const debitValue =
                debitRaw === "" ? null : Number.parseFloat(debitRaw);
            const creditValue =
                creditRaw === "" ? null : Number.parseFloat(creditRaw);

            const debitInvalid =
                debitRaw !== "" && Number.isNaN(debitValue ?? NaN);
            const creditInvalid =
                creditRaw !== "" && Number.isNaN(creditValue ?? NaN);

            return {
                id: index,
                account: line.account.trim(),
                memo: line.memo.trim(),
                debitRaw,
                creditRaw,
                debitValue:
                    debitInvalid || debitValue === null ? null : debitValue,
                creditValue:
                    creditInvalid || creditValue === null
                        ? null
                        : creditValue,
                debitInvalid,
                creditInvalid,
            };
        });

        const totalDebit = Number(validation.totalDebit.toFixed(2));
        const totalCredit = Number(validation.totalCredit.toFixed(2));
        const difference = Number(
            (validation.totalDebit - validation.totalCredit).toFixed(2)
        );

        const hasActivity = totalDebit > 0 || totalCredit > 0;
        const isBalanced = !validation.errors.form && hasActivity;

        return {
            lines,
            totalDebit,
            totalCredit,
            difference,
            isBalanced,
            hasActivity,
            message: validation.errors.form,
        };
    }, [entryForm]);

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

    const insertJournalLine = (index: number) => {
        setEntryForm((current) => {
            const updatedLines = [...current.lines];
            updatedLines.splice(index + 1, 0, createEmptyLine());

            return {
                ...current,
                lines: updatedLines,
            };
        });

        setFormErrors((current) => {
            const updatedLines = [...current.lines];
            updatedLines.splice(index + 1, 0, {});

            return {
                ...current,
                lines: updatedLines,
                form: undefined,
            };
        });
    };

    const duplicateJournalLine = (index: number) => {
        setEntryForm((current) => {
            const updatedLines = [...current.lines];
            const lineToDuplicate = current.lines[index];

            updatedLines.splice(index + 1, 0, {
                ...lineToDuplicate,
            });

            return {
                ...current,
                lines: updatedLines,
            };
        });

        setFormErrors((current) => {
            const updatedLines = [...current.lines];
            updatedLines.splice(index + 1, 0, {});

            return {
                ...current,
                lines: updatedLines,
                form: undefined,
            };
        });
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

    const handlePasteFromExcel = () => {
        window.alert("Paste from Excel coming soon.");
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

    const formId = "journal-entry-form";

    const handleSubmitForApproval = () => {
        // Placeholder for future implementation of the submit workflow
        // Intentionally left blank to avoid breaking the modal until logic is added
    };

    const handlePostEntry = () => {
        // Placeholder for future implementation of the posting workflow
        // Intentionally left blank to avoid breaking the modal until logic is added
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
                                <DialogPanel className="relative w-full max-w-5xl transform overflow-hidden rounded-lg bg-white p-6 text-left shadow-xl transition-all">
                                    <div className="flex items-start justify-between gap-4">
                                        <DialogTitle className="text-base font-semibold text-gray-900">
                                            New Journal Entry
                                        </DialogTitle>
                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            className="rounded-md p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <div className="flex flex-wrap items-center gap-2 text-sm">
                                                <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600 ring-1 ring-inset ring-indigo-600/20">
                                                    Journal Entry
                                                </span>
                                                <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-300">
                                                    Draft
                                                </span>
                                                <span className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 ring-1 ring-inset ring-sky-600/10">
                                                    JE No: Auto
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                                                <div className="flex items-center gap-1">
                                                    <span className="font-medium text-gray-700">
                                                        Date
                                                    </span>
                                                    <span>
                                                        {entryForm.entryDate || "Not set"}
                                                    </span>
                                                </div>
                                            </div>
                                        </DialogTitle>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="submit"
                                                    form={formId}
                                                    className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 hover:bg-indigo-500"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleSubmitForApproval}
                                                    className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 transition hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                                >
                                                    Submit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handlePostEntry}
                                                    className="inline-flex items-center rounded-md bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600 shadow-sm ring-1 ring-inset ring-rose-200 transition hover:bg-rose-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
                                                >
                                                    Post
                                                </button>
                                            </div>
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
                                    </div>
                                    <form className="mt-6" onSubmit={handleSubmit}>
                                        {formErrors.form ? (
                                            <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
                                                {formErrors.form}
                                            </div>
                                        ) : null}
                                        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
                                            <div className="space-y-6">
                                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                    <div>
                                                        <label
                                                            htmlFor="ledger"
                                                            className="block text-sm font-medium text-gray-700"
                                                        >
                                                            Ledger
                                                        </label>
                                                        <select
                                                            id="ledger"
                                                            name="ledger"
                                                            value={entryForm.ledger}
                                                            onChange={handleEntryFieldChange(
                                                                "ledger"
                                                            )}
                                                            className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                        >
                                                            <option value="">
                                                                Select a ledger
                                                            </option>
                                                            {ledgerOptions.map((option) => (
                                                                <option
                                                                    key={option.value}
                                                                    value={option.value}
                                                                >
                                                                    {option.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        {formErrors.ledger ? (
                                                            <p className="mt-1 text-sm text-red-600">
                                                                {formErrors.ledger}
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
                                                            className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                        >
                                                            <option value="">
                                                                Select a period
                                                            </option>
                                                            {periodOptions.map((option) => (
                                                                <option
                                                                    key={option.value}
                                                                    value={option.value}
                                                                >
                                                                    {option.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        {formErrors.period ? (
                                                            <p className="mt-1 text-sm text-red-600">
                                                                {formErrors.period}
                                                            </p>
                                                        ) : null}
                                                    </div>
                                                    <div>
                                                        <label
                                                            htmlFor="entryDate"
                                                            className="block text-sm font-medium text-gray-700"
                                                        >
                                                            Entry Date
                                                        </label>
                                                        <input
                                                            type="date"
                                                            id="entryDate"
                                                            name="entryDate"
                                                            value={entryForm.entryDate}
                                                            onChange={handleEntryFieldChange(
                                                                "entryDate"
                                                            )}
                                                            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                        />
                                                        {formErrors.entryDate ? (
                                                            <p className="mt-1 text-sm text-red-600">
                                                                {formErrors.entryDate}
                                                            </p>
                                                        ) : null}
                                                    </div>
                                                    <div>
                                                        <label
                                                            htmlFor="postingDate"
                                                            className="block text-sm font-medium text-gray-700"
                                                        >
                                                            Posting Date
                                                        </label>
                                                        <input
                                                            type="date"
                                                            id="postingDate"
                                                            name="postingDate"
                                                            value={entryForm.postingDate}
                                                            onChange={handleEntryFieldChange(
                                                                "postingDate"
                                                            )}
                                                            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                        />
                                                        {formErrors.postingDate ? (
                                                            <p className="mt-1 text-sm text-red-600">
                                                                {formErrors.postingDate}
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
                                                            className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                        >
                                                            <option value="">
                                                                Select a currency
                                                            </option>
                                                            {currencyOptions.map((option) => (
                                                                <option key={option} value={option}>
                                                                    {option}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        {formErrors.currency ? (
                                                            <p className="mt-1 text-sm text-red-600">
                                                                {formErrors.currency}
                                                            </p>
                                                        ) : null}
                                                    </div>
                                                    <div>
                                                        <label
                                                            htmlFor="status"
                                                            className="block text-sm font-medium text-gray-700"
                                                        >
                                                            Status
                                                        </label>
                                                        <select
                                                            id="status"
                                                            name="status"
                                                            value={entryForm.status}
                                                            onChange={handleEntryFieldChange(
                                                                "status"
                                                            )}
                                                            className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                        >
                                                            <option value="">
                                                                Select a status
                                                            </option>
                                                            {statusOptions
                                                                .filter((option) => option.value !== "all")
                                                                .map((option) => (
                                                                    <option
                                                                        key={option.value}
                                                                        value={option.value}
                                                                    >
                                                                        {option.label}
                                                                    </option>
                                                                ))}
                                                        </select>
                                                        {formErrors.status ? (
                                                            <p className="mt-1 text-sm text-red-600">
                                                                {formErrors.status}
                                                            </p>
                                                        ) : null}
                                                    </div>
                                                    <div className="sm:col-span-2">
                                                        <label
                                                            htmlFor="reference"
                                                            className="block text-sm font-medium text-gray-700"
                                                        >
                                                            Reference
                                                        </label>
                                                        <input
                                                            type="text"
                                                            id="reference"
                                                            name="reference"
                                                            value={entryForm.reference}
                                                            onChange={handleEntryFieldChange(
                                                                "reference"
                                                            )}
                                                            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                            placeholder="Enter reference or entry number"
                                                        />
                                                        <label
                                                            htmlFor="memo"
                                                            className="mt-4 block text-sm font-medium text-gray-700"
                                                        >
                                                            Memo
                                                        </label>
                                                        <textarea
                                                            id="memo"
                                                            name="memo"
                                                            value={entryForm.memo}
                                                            onChange={handleMemoChange}
                                                            className="mt-1 min-h-24 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                            placeholder="Describe the purpose of the journal entry"
                                                        />
                                                        {formErrors.memo ? (
                                                            <p className="mt-1 text-sm text-red-600">
                                                                {formErrors.memo}
                                                            </p>
                                                        ) : null}
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="text-sm font-semibold text-gray-900">
                                                            Journal Lines
                                                        </h3>
                                                        <button
                                                            type="button"
                                                            onClick={addJournalLine}
                                                            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                        >
                                                            <PlusIcon aria-hidden="true" className="size-4 text-gray-500" />
                                                            Add line
                                                        </button>
                                                    </div>
                                                    <div className="space-y-3">
                                                        {entryForm.lines.map((line, index) => {
                                                            const lineErrors =
                                                                formErrors.lines[index] || {};

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
                                                                                value={line.account}
                                                                                onChange={(event) =>
                                                                                    handleLineChange(
                                                                                        index,
                                                                                        "account",
                                                                                        event.target.value
                                                                                    )
                                                                                }
                                                                                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                                                placeholder="Account name or number"
                                                                            />
                                                                            {lineErrors.account ? (
                                                                                <p className="mt-1 text-sm text-red-600">
                                                                                    {lineErrors.account}
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
                                                                                value={line.debit}
                                                                                onChange={(event) =>
                                                                                    handleLineChange(
                                                                                        index,
                                                                                        "debit",
                                                                                        event.target.value
                                                                                    )
                                                                                }
                                                                                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                                            />
                                                                            {lineErrors.debit ? (
                                                                                <p className="mt-1 text-sm text-red-600">
                                                                                    {lineErrors.debit}
                                                                                </p>
                                                                            ) : null}
                                                                        </div>
                                                                        <div>
                                                                            <label
                                                                                htmlFor={`line-credit-${index}`}
                                                                                className="block text-sm font-medium text-gray-700"
                                                                            >
                                                                                Credit
                                                                            </label>                                                                            <input
                                                                                type="number"
                                                                                id={`line-credit-${index}`}
                                                                                name={`line-credit-${index}`}
                                                                                min="0"
                                                                                step="0.01"
                                                                                value={line.credit}
                                                                                onChange={(event) =>
                                                                                    handleLineChange(
                                                                                        index,
                                                                                        "credit",
                                                                                        event.target.value
                                                                                    )
                                                                                }
                                                                                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                                            />
                                                                            {lineErrors.credit ? (
                                                                                <p className="mt-1 text-sm text-red-600">
                                                                                    {lineErrors.credit}
                                                                                </p>
                                                                            ) : null}
                                                                        </div>
                                                                        <div className="lg:col-span-1">
                                                                            <label
                                                                                htmlFor={`line-memo-${index}`}
                                                                                className="block text-sm font-medium text-gray-700"
                                                                            >
                                                                                Line Memo
                                                                            </label>
                                                                            <input
                                                                                type="text"
                                                                                id={`line-memo-${index}`}
                                                                                name={`line-memo-${index}`}
                                                                                value={line.memo}
                                                                                onChange={(event) =>
                                                                                    handleLineChange(
                                                                                        index,
                                                                                        "memo",
                                                                                        event.target.value
                                                                                    )
                                                                                }
                                                                                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                                                placeholder="Optional memo"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    {lineErrors.amount ? (
                                                                        <p className="mt-3 text-sm text-red-600">
                                                                            {lineErrors.amount}
                                                                        </p>
                                                                    ) : null}
                                                                    {entryForm.lines.length > 1 ? (
                                                                        <div className="mt-4 flex justify-end">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    removeJournalLine(index)
                                                                                }
                                                                                className="text-sm font-medium text-red-600 hover:text-red-500"
                                                                            >
                                                                                Remove line
                                                                            </button>
                                                                        </div>
                                                                    ) : null}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                            <aside className="space-y-4">
                                                <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                                                    <div className="border-b border-slate-200 px-5 py-4">
                                                        <div className="flex items-center justify-between gap-3">
                                                            <h3 className="text-sm font-semibold text-gray-900">
                                                                Posting Preview
                                                            </h3>
                                                            <span
                                                                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${postingPreview.isBalanced ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20" : "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20"}`}
                                                            >
                                                                {postingPreview.isBalanced
                                                                    ? "Balanced"
                                                                    : "Imbalanced"}
                                                            </span>
                                                        </div>
                                                        <p className="mt-1 text-xs text-gray-500">
                                                            Preview updates as you add accounts and amounts.
                                                        </p>
                                                    </div>
                                                    <div className="space-y-5 px-5 py-4">
                                                        <div className="space-y-3">
                                                            {postingPreview.lines.map((line) => {
                                                                const hasContent =
                                                                    line.account ||
                                                                    line.memo ||
                                                                    line.debitRaw ||
                                                                    line.creditRaw;

                                                                return (
                                                                    <div
                                                                        key={`preview-line-${line.id}`}
                                                                        className="flex items-start justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2"
                                                                    >
                                                                        <div className="min-w-0">
                                                                            <p className="truncate text-sm font-medium text-gray-900">
                                                                                {line.account || `Line ${line.id + 1}`}
                                                                            </p>
                                                                            {line.memo ? (
                                                                                <p className="mt-0.5 text-xs text-gray-500">
                                                                                    {line.memo}
                                                                                </p>
                                                                            ) : null}
                                                                            {!hasContent ? (
                                                                                <p className="mt-0.5 text-xs text-gray-400">
                                                                                    Waiting for details
                                                                                </p>
                                                                            ) : null}
                                                                        </div>
                                                                        <div className="flex flex-shrink-0 gap-6 text-right">
                                                                            <div>
                                                                                <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                                                                                    Debit
                                                                                </p>
                                                                                <p
                                                                                    className={`text-sm font-semibold ${line.debitInvalid ? "text-red-600" : "text-sky-700"}`}
                                                                                >
                                                                                    {line.debitInvalid
                                                                                        ? "Invalid"
                                                                                        : line.debitValue !== null
                                                                                        ? currencyFormatter.format(line.debitValue)
                                                                                        : "—"}
                                                                                </p>
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                                                                                    Credit
                                                                                </p>
                                                                                <p
                                                                                    className={`text-sm font-semibold ${line.creditInvalid ? "text-red-600" : "text-indigo-700"}`}
                                                                                >
                                                                                    {line.creditInvalid
                                                                                        ? "Invalid"
                                                                                        : line.creditValue !== null
                                                                                        ? currencyFormatter.format(line.creditValue)
                                                                                        : "—"}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                        <div className="space-y-3 rounded-lg bg-slate-100 px-4 py-3 text-sm">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-gray-600">
                                                                    Total debit
                                                                </span>
                                                                <span className="font-semibold text-sky-700">
                                                                    {currencyFormatter.format(postingPreview.totalDebit)}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-gray-600">
                                                                    Total credit
                                                                </span>
                                                                <span className="font-semibold text-indigo-700">
                                                                    {currencyFormatter.format(postingPreview.totalCredit)}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center justify-between border-t border-white/60 pt-2 text-sm">
                                                                <span className="text-gray-600">
                                                                    Difference
                                                                </span>
                                                                <span
                                                                    className={`font-semibold ${postingPreview.isBalanced ? "text-emerald-600" : "text-amber-600"}`}
                                                                >
                                                                    {currencyFormatter.format(
                                                                        Math.abs(postingPreview.difference)
                                                                    )}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-gray-500">
                                                                {postingPreview.message
                                                                    ? postingPreview.message
                                                                    : postingPreview.isBalanced
                                                                    ? "Debits equal credits. Review header details before posting."
                                                                    : postingPreview.hasActivity
                                                                    ? "Totals must balance before the entry can be posted."
                                                                    : "Add at least one journal line with a debit or credit to begin."}
                                                            </p>
                                                        </div>
                                                        <div className="border-t border-slate-200 pt-4">
                                                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                                Posting guidelines
                                                            </p>
                                                            <ul className="mt-3 space-y-2 text-xs text-gray-600">
                                                                <li className="flex gap-2">
                                                                    <span className="mt-[6px] size-1.5 rounded-full bg-indigo-400" />
                                                                    Use a single debit or credit per line to keep balances clear.
                                                                </li>
                                                                <li className="flex gap-2">
                                                                    <span className="mt-[6px] size-1.5 rounded-full bg-indigo-400" />
                                                                    Totals must match exactly before you can post the entry.
                                                                </li>
                                                                <li className="flex gap-2">
                                                                    <span className="mt-[6px] size-1.5 rounded-full bg-indigo-400" />
                                                                    Add memos to document the business purpose for each amount.
                                                                </li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </div>
                                            </aside>
                                        </div>
                                        <div className="mt-6 flex items-center justify-end gap-3">
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
