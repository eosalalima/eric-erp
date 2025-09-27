"use client";

import {
    type ChangeEvent,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import {
    CheckCircleIcon,
    XCircleIcon as AlertXCircleIcon,
} from "@heroicons/react/20/solid";
import Breadcrumb from "@/components/layout/Breadcrumb";
import PageHeader from "@/components/layout/PageHeader";
import DataListView, {
    type DataListColumn,
} from "@/components/shared/DataListView";
import { RedirectToSignIn, SignedIn, SignedOut } from "@clerk/nextjs";

const breadcrumbItems = [
    { name: "Home", href: "/modules/finance-accounting" },
    { name: "Settings", href: "/modules/finance-accounting/settings" },
    {
        name: "Fiscal Year & Periods",
        href: "/modules/finance-accounting/settings/fiscal-year-periods",
    },
];

const STATUS_OPTIONS = ["OPEN", "CLOSED", "LOCKED"] as const;
type FiscalYearStatus = (typeof STATUS_OPTIONS)[number];

type LedgerOption = {
    id: string;
    name: string | null;
    code: string | null;
};

type FiscalYearRecord = {
    id: string;
    ledger_id: string;
    year: number;
    start_date: string;
    end_date: string;
    status: FiscalYearStatus;
    ledger?: LedgerOption | null;
};

type FormValues = {
    ledgerId: string;
    year: string;
    startDate: string;
    endDate: string;
    status: FiscalYearStatus;
};

const defaultFormValues: FormValues = {
    ledgerId: "",
    year: "",
    startDate: "",
    endDate: "",
    status: "OPEN",
};

const defaultTouchedFields: Record<keyof FormValues, boolean> = {
    ledgerId: false,
    year: false,
    startDate: false,
    endDate: false,
    status: false,
};

type ValidationErrors = Partial<Record<keyof FormValues, string>>;

type StatusMessage = {
    type: "success" | "error";
    message: string;
};

const dateFormatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
});

function formatDisplayDate(value: string | null | undefined) {
    if (!value) {
        return "";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return dateFormatter.format(date);
}

function toDateInputValue(value: string | null | undefined) {
    if (!value) {
        return "";
    }

    if (value.length >= 10) {
        return value.slice(0, 10);
    }

    return value;
}

function validateForm(values: FormValues): {
    errors: ValidationErrors;
    isValid: boolean;
} {
    const errors: ValidationErrors = {};

    if (!values.ledgerId.trim()) {
        errors.ledgerId = "Ledger is required.";
    }

    if (!values.year.trim()) {
        errors.year = "Year is required.";
    } else if (!/^\d{4}$/.test(values.year.trim())) {
        errors.year = "Year must be a four-digit number.";
    }

    if (!values.startDate) {
        errors.startDate = "Start date is required.";
    }

    if (!values.endDate) {
        errors.endDate = "End date is required.";
    }

    if (values.startDate && values.endDate) {
        const start = new Date(`${values.startDate}T00:00:00.000Z`).getTime();
        const end = new Date(`${values.endDate}T00:00:00.000Z`).getTime();
        if (Number.isNaN(start) || Number.isNaN(end)) {
            errors.startDate = errors.startDate ?? "Dates must be valid.";
            errors.endDate = errors.endDate ?? "Dates must be valid.";
        } else if (end < start) {
            errors.endDate = "End date cannot be earlier than start date.";
        }
    }

    if (!values.status) {
        errors.status = "Status is required.";
    }

    return {
        errors,
        isValid: Object.keys(errors).length === 0,
    };
}

function buildStatusLabel(status: string) {
    const normalized = status.toUpperCase();
    return normalized.charAt(0) + normalized.slice(1).toLowerCase();
}

export default function FiscalYearPeriodsPage() {
    const [fiscalYears, setFiscalYears] = useState<FiscalYearRecord[]>([]);
    const [ledgerOptions, setLedgerOptions] = useState<LedgerOption[]>([]);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedFiscalYear, setSelectedFiscalYear] =
        useState<FiscalYearRecord | null>(null);
    const [formValues, setFormValues] = useState<FormValues>(defaultFormValues);
    const [touchedFields, setTouchedFields] =
        useState<Record<keyof FormValues, boolean>>(defaultTouchedFields);
    const [formErrors, setFormErrors] = useState<ValidationErrors>({});
    const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(
        null
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [pendingDelete, setPendingDelete] = useState<FiscalYearRecord | null>(
        null
    );
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const columns: DataListColumn<FiscalYearRecord>[] = useMemo(
        () => [
            {
                id: "ledger",
                header: "Ledger",
                accessor: (item) => {
                    const ledgerName = item.ledger?.name ?? null;
                    const ledgerCode = item.ledger?.code ?? null;

                    if (ledgerName) {
                        return ledgerCode
                            ? `${ledgerName} (${ledgerCode})`
                            : ledgerName;
                    }

                    if (ledgerCode) {
                        return ledgerCode;
                    }

                    return item.ledger_id;
                },
                searchAccessor: (item) =>
                    [
                        item.ledger?.name ?? "",
                        item.ledger?.code ?? "",
                        item.ledger_id,
                    ]
                        .join(" ")
                        .trim(),
            },
            {
                id: "year",
                header: "Year",
                field: "year",
            },
            {
                id: "startDate",
                header: "Start Date",
                accessor: (item) => formatDisplayDate(item.start_date),
            },
            {
                id: "endDate",
                header: "End Date",
                accessor: (item) => formatDisplayDate(item.end_date),
            },
            {
                id: "status",
                header: "Status",
                accessor: (item) => (
                    <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            item.status === "OPEN"
                                ? "bg-green-50 text-green-700"
                                : item.status === "LOCKED"
                                ? "bg-yellow-50 text-yellow-700"
                                : "bg-slate-50 text-slate-700"
                        }`}
                    >
                        {buildStatusLabel(item.status)}
                    </span>
                ),
                searchAccessor: (item) => item.status,
            },
        ],
        []
    );

    const refreshFiscalYears = useCallback(async () => {
        setIsLoading(true);
        setFetchError(null);
        try {
            const response = await fetch(
                "/api/finance-accounting/fiscal-years?includeLedgers=true"
            );
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }

            const data = (await response.json()) as
                | FiscalYearRecord[]
                | {
                      fiscalYears?: FiscalYearRecord[];
                      ledgers?: LedgerOption[];
                  };

            if (Array.isArray(data)) {
                setFiscalYears(data);
                const derivedLedgers = Array.from(
                    new Map(
                        data
                            .map((item) => item.ledger)
                            .filter((ledger): ledger is LedgerOption =>
                                Boolean(ledger)
                            )
                            .map((ledger) => [ledger.id, ledger])
                    ).values()
                );
                setLedgerOptions(derivedLedgers);
            } else {
                setFiscalYears(data.fiscalYears ?? []);
                setLedgerOptions(data.ledgers ?? []);
            }
        } catch (error) {
            console.error(error);
            setFetchError(
                "Unable to load fiscal years at this time. Please try again later."
            );
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshFiscalYears();
    }, [refreshFiscalYears]);

    useEffect(() => {
        if (!isDrawerOpen) {
            return;
        }

        if (selectedFiscalYear) {
            setFormValues({
                ledgerId: selectedFiscalYear.ledger_id ?? "",
                year: selectedFiscalYear.year
                    ? String(selectedFiscalYear.year)
                    : "",
                startDate: toDateInputValue(selectedFiscalYear.start_date),
                endDate: toDateInputValue(selectedFiscalYear.end_date),
                status:
                    (selectedFiscalYear.status?.toUpperCase() as FiscalYearStatus) ??
                    "OPEN",
            });
        } else {
            setFormValues(defaultFormValues);
        }

        setTouchedFields({ ...defaultTouchedFields });
        setFormErrors({});
    }, [isDrawerOpen, selectedFiscalYear]);

    useEffect(() => {
        if (!statusMessage) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            setStatusMessage(null);
        }, 4000);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [statusMessage]);

    const applyValidation = useCallback(
        (values: FormValues, touched: Record<keyof FormValues, boolean>) => {
            const { errors } = validateForm(values);
            const filteredErrors = Object.fromEntries(
                Object.entries(errors).filter(
                    ([key]) => touched[key as keyof FormValues]
                )
            ) as ValidationErrors;
            setFormErrors(filteredErrors);
        },
        []
    );

    const handleFieldChange = useCallback(
        (field: keyof FormValues) =>
            (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
                const value = event.target.value as FormValues[typeof field];
                const updatedValues = {
                    ...formValues,
                    [field]: value,
                } as FormValues;
                const updatedTouched = {
                    ...touchedFields,
                    [field]: true,
                } as Record<keyof FormValues, boolean>;

                setFormValues(updatedValues);
                setTouchedFields(updatedTouched);
                applyValidation(updatedValues, updatedTouched);
            },
        [applyValidation, formValues, touchedFields]
    );

    const handleFieldBlur = useCallback(
        (field: keyof FormValues) => () => {
            if (touchedFields[field]) {
                return;
            }

            const updatedTouched = {
                ...touchedFields,
                [field]: true,
            } as Record<keyof FormValues, boolean>;

            setTouchedFields(updatedTouched);
            applyValidation(formValues, updatedTouched);
        },
        [applyValidation, formValues, touchedFields]
    );

    const handleDrawerClose = useCallback(
        (options?: { preserveStatusMessage?: boolean }) => {
            setIsDrawerOpen(false);
            setSelectedFiscalYear(null);
            setFormValues(defaultFormValues);
            setTouchedFields({ ...defaultTouchedFields });
            setFormErrors({});
            setIsSubmitting(false);

            if (!options?.preserveStatusMessage) {
                setStatusMessage(null);
            }
        },
        []
    );

    const handleSubmit = useCallback(
        async (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            setStatusMessage(null);

            const { errors, isValid } = validateForm(formValues);

            if (!isValid) {
                setTouchedFields({
                    ledgerId: true,
                    year: true,
                    startDate: true,
                    endDate: true,
                    status: true,
                });
                setFormErrors(errors);
                setStatusMessage({
                    type: "error",
                    message: "Please correct the errors before saving.",
                });
                return;
            }

            setIsSubmitting(true);

            const payload = {
                ledger_id: formValues.ledgerId.trim(),
                year: Number.parseInt(formValues.year, 10),
                start_date: `${formValues.startDate}T00:00:00.000Z`,
                end_date: `${formValues.endDate}T00:00:00.000Z`,
                status: formValues.status,
            };

            try {
                const endpoint = selectedFiscalYear
                    ? `/api/finance-accounting/fiscal-years/${selectedFiscalYear.id}`
                    : "/api/finance-accounting/fiscal-years";
                const method = selectedFiscalYear ? "PUT" : "POST";

                const response = await fetch(endpoint, {
                    method,
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                });

                if (!response.ok) {
                    let message = "Failed to save fiscal year.";
                    try {
                        const data = (await response.json()) as {
                            error?: string;
                        };
                        if (data?.error) {
                            message = data.error;
                        }
                    } catch {
                        // ignore JSON parsing error
                    }
                    throw new Error(message);
                }

                await refreshFiscalYears();

                setStatusMessage({
                    type: "success",
                    message: selectedFiscalYear
                        ? "Fiscal year updated successfully."
                        : "Fiscal year created successfully.",
                });
                handleDrawerClose({ preserveStatusMessage: true });
            } catch (error) {
                console.error(error);
                const message =
                    error instanceof Error
                        ? error.message
                        : "An unexpected error occurred while saving.";
                setStatusMessage({ type: "error", message });
            } finally {
                setIsSubmitting(false);
            }
        },
        [formValues, handleDrawerClose, refreshFiscalYears, selectedFiscalYear]
    );

    const handleAdd = useCallback(() => {
        setSelectedFiscalYear(null);
        setStatusMessage(null);
        setIsDrawerOpen(true);
    }, []);

    const handleEdit = useCallback((item: FiscalYearRecord) => {
        setSelectedFiscalYear(item);
        setStatusMessage(null);
        setIsDrawerOpen(true);
    }, []);

    const handleDeleteRequest = useCallback((item: FiscalYearRecord) => {
        setPendingDelete(item);
        setDeleteError(null);
        setIsDeleteDialogOpen(true);
    }, []);

    const resetDeleteState = useCallback(() => {
        setIsDeleteDialogOpen(false);
        setPendingDelete(null);
        setDeleteError(null);
        setIsDeleting(false);
    }, []);

    const handleDeleteConfirm = useCallback(async () => {
        if (!pendingDelete) {
            return;
        }

        setIsDeleting(true);
        setDeleteError(null);

        try {
            const response = await fetch(
                `/api/finance-accounting/fiscal-years/${pendingDelete.id}`,
                {
                    method: "DELETE",
                }
            );

            if (!response.ok) {
                let message = "Failed to delete fiscal year.";
                try {
                    const data = (await response.json()) as {
                        message?: string;
                    };
                    if (data?.message) {
                        message = data.message;
                    }
                } catch {
                    // ignore parsing errors
                }
                throw new Error(message);
            }

            await refreshFiscalYears();

            setStatusMessage({
                type: "success",
                message: "Fiscal year deleted successfully.",
            });
            resetDeleteState();
        } catch (error) {
            console.error(error);
            const message =
                error instanceof Error
                    ? error.message
                    : "An unexpected error occurred while deleting.";
            setDeleteError(message);
        } finally {
            setIsDeleting(false);
        }
    }, [pendingDelete, refreshFiscalYears, resetDeleteState]);

    const hasLedgerOptions = ledgerOptions.length > 0;
    const isFormValid = validateForm(formValues).isValid;

    return (
        <>
            <SignedIn>
                <div className="space-y-6 p-4">
                    <Breadcrumb items={breadcrumbItems} />
                    <PageHeader title="Fiscal Year & Periods" />

                    {statusMessage ? (
                        <div
                            className={`rounded-md p-4 ${
                                statusMessage.type === "success"
                                    ? "bg-green-50"
                                    : "bg-red-50"
                            }`}
                        >
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    {statusMessage.type === "success" ? (
                                        <CheckCircleIcon
                                            aria-hidden="true"
                                            className="size-5 text-green-400"
                                        />
                                    ) : (
                                        <AlertXCircleIcon
                                            aria-hidden="true"
                                            className="size-5 text-red-400"
                                        />
                                    )}
                                </div>
                                <div className="ml-3">
                                    <p
                                        className={`text-sm font-medium ${
                                            statusMessage.type === "success"
                                                ? "text-green-800"
                                                : "text-red-800"
                                        }`}
                                    >
                                        {statusMessage.message}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {fetchError ? (
                        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                            {fetchError}
                        </div>
                    ) : null}

                    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                        {isLoading ? (
                            <div className="p-4 text-sm text-gray-500">
                                Loading fiscal years...
                            </div>
                        ) : (
                            <DataListView
                                columns={columns}
                                data={fiscalYears}
                                onAdd={handleAdd}
                                onEdit={handleEdit}
                                onDelete={handleDeleteRequest}
                                getRowId={(item) => item.id}
                                searchPlaceholder="Search fiscal years"
                            />
                        )}
                    </div>

                    <Dialog
                        open={isDrawerOpen}
                        onClose={(value) => {
                            setIsDrawerOpen(value);
                            if (!value) {
                                handleDrawerClose();
                            }
                        }}
                        className="relative z-10"
                    >
                        <div className="fixed inset-0" />

                        <div className="fixed inset-0 overflow-hidden">
                            <div className="absolute inset-0 overflow-hidden">
                                <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
                                    <DialogPanel
                                        transition
                                        className="pointer-events-auto w-screen max-w-3xl transform transition duration-500 ease-in-out data-[closed]:translate-x-full sm:duration-700"
                                    >
                                        <div className="relative flex h-full flex-col overflow-y-auto bg-white shadow-xl">
                                            <div className="bg-indigo-700 px-4 py-6 sm:px-6">
                                                <div className="flex items-center justify-between">
                                                    <DialogTitle className="text-base font-semibold text-white">
                                                        {selectedFiscalYear
                                                            ? "Edit Fiscal Year"
                                                            : "Add Fiscal Year"}
                                                    </DialogTitle>
                                                    <div className="ml-3 flex h-7 items-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                handleDrawerClose();
                                                            }}
                                                            className="relative rounded-md text-indigo-200 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                                                        >
                                                            <span className="absolute -inset-2.5" />
                                                            <span className="sr-only">
                                                                Close panel
                                                            </span>
                                                            <XMarkIcon
                                                                aria-hidden="true"
                                                                className="size-6"
                                                            />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="mt-1">
                                                    <p className="text-sm text-indigo-300">
                                                        {selectedFiscalYear
                                                            ? "Update the selected fiscal year details."
                                                            : "Create a new fiscal year for the selected ledger."}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="relative flex-1 overflow-auto px-4 py-6 sm:px-6">
                                                <form
                                                    className="space-y-6"
                                                    onSubmit={handleSubmit}
                                                >
                                                    <div>
                                                        <label
                                                            htmlFor="ledgerId"
                                                            className="block text-sm font-medium text-gray-900"
                                                        >
                                                            Ledger
                                                        </label>
                                                        <div className="mt-2">
                                                            {hasLedgerOptions ? (
                                                                <div
                                                                    className={`rounded-md bg-white outline-1 -outline-offset-1 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600 ${
                                                                        formErrors.ledgerId
                                                                            ? "outline-red-500"
                                                                            : "outline-gray-300"
                                                                    }`}
                                                                >
                                                                    <select
                                                                        id="ledgerId"
                                                                        name="ledgerId"
                                                                        value={
                                                                            formValues.ledgerId
                                                                        }
                                                                        onChange={handleFieldChange(
                                                                            "ledgerId"
                                                                        )}
                                                                        onBlur={handleFieldBlur(
                                                                            "ledgerId"
                                                                        )}
                                                                        className="block w-full rounded-md border-0 bg-transparent py-2 pl-3 pr-10 text-sm text-gray-900 focus:outline-none"
                                                                    >
                                                                        <option
                                                                            value=""
                                                                            disabled
                                                                        >
                                                                            Select
                                                                            a
                                                                            ledger
                                                                        </option>
                                                                        {ledgerOptions.map(
                                                                            (
                                                                                ledger
                                                                            ) => (
                                                                                <option
                                                                                    key={
                                                                                        ledger.id
                                                                                    }
                                                                                    value={
                                                                                        ledger.id
                                                                                    }
                                                                                >
                                                                                    {ledger.name ??
                                                                                        ledger.code ??
                                                                                        ledger.id}
                                                                                    {ledger.code
                                                                                        ? ` (${ledger.code})`
                                                                                        : ""}
                                                                                </option>
                                                                            )
                                                                        )}
                                                                    </select>
                                                                </div>
                                                            ) : (
                                                                <div
                                                                    className={`rounded-md bg-white pl-3 outline-1 -outline-offset-1 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600 ${
                                                                        formErrors.ledgerId
                                                                            ? "outline-red-500"
                                                                            : "outline-gray-300"
                                                                    }`}
                                                                >
                                                                    <input
                                                                        id="ledgerId"
                                                                        name="ledgerId"
                                                                        type="text"
                                                                        value={
                                                                            formValues.ledgerId
                                                                        }
                                                                        onChange={handleFieldChange(
                                                                            "ledgerId"
                                                                        )}
                                                                        onBlur={handleFieldBlur(
                                                                            "ledgerId"
                                                                        )}
                                                                        className="block w-full min-w-0 grow bg-transparent py-2 pl-1 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                                                                        placeholder="Enter ledger ID"
                                                                    />
                                                                </div>
                                                            )}
                                                            {formErrors.ledgerId ? (
                                                                <p
                                                                    className="mt-2 text-sm text-red-600"
                                                                    role="alert"
                                                                >
                                                                    {
                                                                        formErrors.ledgerId
                                                                    }
                                                                </p>
                                                            ) : null}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label
                                                            htmlFor="year"
                                                            className="block text-sm font-medium text-gray-900"
                                                        >
                                                            Fiscal year
                                                        </label>
                                                        <div className="mt-2">
                                                            <div
                                                                className={`rounded-md bg-white pl-3 outline-1 -outline-offset-1 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600 ${
                                                                    formErrors.year
                                                                        ? "outline-red-500"
                                                                        : "outline-gray-300"
                                                                }`}
                                                            >
                                                                <input
                                                                    id="year"
                                                                    name="year"
                                                                    type="text"
                                                                    inputMode="numeric"
                                                                    value={
                                                                        formValues.year
                                                                    }
                                                                    onChange={handleFieldChange(
                                                                        "year"
                                                                    )}
                                                                    onBlur={handleFieldBlur(
                                                                        "year"
                                                                    )}
                                                                    className="block w-full min-w-0 grow bg-transparent py-2 pl-1 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                                                                    placeholder="e.g. 2025"
                                                                />
                                                            </div>
                                                            {formErrors.year ? (
                                                                <p
                                                                    className="mt-2 text-sm text-red-600"
                                                                    role="alert"
                                                                >
                                                                    {
                                                                        formErrors.year
                                                                    }
                                                                </p>
                                                            ) : null}
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                                        <div>
                                                            <label
                                                                htmlFor="startDate"
                                                                className="block text-sm font-medium text-gray-900"
                                                            >
                                                                Start date
                                                            </label>
                                                            <div className="mt-2">
                                                                <div
                                                                    className={`rounded-md bg-white pl-3 outline-1 -outline-offset-1 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600 ${
                                                                        formErrors.startDate
                                                                            ? "outline-red-500"
                                                                            : "outline-gray-300"
                                                                    }`}
                                                                >
                                                                    <input
                                                                        id="startDate"
                                                                        name="startDate"
                                                                        type="date"
                                                                        value={
                                                                            formValues.startDate
                                                                        }
                                                                        onChange={handleFieldChange(
                                                                            "startDate"
                                                                        )}
                                                                        onBlur={handleFieldBlur(
                                                                            "startDate"
                                                                        )}
                                                                        className="block w-full min-w-0 grow bg-transparent py-2 pl-1 pr-3 text-sm text-gray-900 focus:outline-none"
                                                                    />
                                                                </div>
                                                                {formErrors.startDate ? (
                                                                    <p
                                                                        className="mt-2 text-sm text-red-600"
                                                                        role="alert"
                                                                    >
                                                                        {
                                                                            formErrors.startDate
                                                                        }
                                                                    </p>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label
                                                                htmlFor="endDate"
                                                                className="block text-sm font-medium text-gray-900"
                                                            >
                                                                End date
                                                            </label>
                                                            <div className="mt-2">
                                                                <div
                                                                    className={`rounded-md bg-white pl-3 outline-1 -outline-offset-1 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600 ${
                                                                        formErrors.endDate
                                                                            ? "outline-red-500"
                                                                            : "outline-gray-300"
                                                                    }`}
                                                                >
                                                                    <input
                                                                        id="endDate"
                                                                        name="endDate"
                                                                        type="date"
                                                                        value={
                                                                            formValues.endDate
                                                                        }
                                                                        onChange={handleFieldChange(
                                                                            "endDate"
                                                                        )}
                                                                        onBlur={handleFieldBlur(
                                                                            "endDate"
                                                                        )}
                                                                        className="block w-full min-w-0 grow bg-transparent py-2 pl-1 pr-3 text-sm text-gray-900 focus:outline-none"
                                                                    />
                                                                </div>
                                                                {formErrors.endDate ? (
                                                                    <p
                                                                        className="mt-2 text-sm text-red-600"
                                                                        role="alert"
                                                                    >
                                                                        {
                                                                            formErrors.endDate
                                                                        }
                                                                    </p>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label
                                                            htmlFor="status"
                                                            className="block text-sm font-medium text-gray-900"
                                                        >
                                                            Status
                                                        </label>
                                                        <div className="mt-2">
                                                            <div
                                                                className={`rounded-md bg-white outline-1 -outline-offset-1 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600 ${
                                                                    formErrors.status
                                                                        ? "outline-red-500"
                                                                        : "outline-gray-300"
                                                                }`}
                                                            >
                                                                <select
                                                                    id="status"
                                                                    name="status"
                                                                    value={
                                                                        formValues.status
                                                                    }
                                                                    onChange={handleFieldChange(
                                                                        "status"
                                                                    )}
                                                                    onBlur={handleFieldBlur(
                                                                        "status"
                                                                    )}
                                                                    className="block w-full rounded-md border-0 bg-transparent py-2 pl-3 pr-10 text-sm text-gray-900 focus:outline-none"
                                                                >
                                                                    {STATUS_OPTIONS.map(
                                                                        (
                                                                            option
                                                                        ) => (
                                                                            <option
                                                                                key={
                                                                                    option
                                                                                }
                                                                                value={
                                                                                    option
                                                                                }
                                                                            >
                                                                                {buildStatusLabel(
                                                                                    option
                                                                                )}
                                                                            </option>
                                                                        )
                                                                    )}
                                                                </select>
                                                            </div>
                                                            {formErrors.status ? (
                                                                <p
                                                                    className="mt-2 text-sm text-red-600"
                                                                    role="alert"
                                                                >
                                                                    {
                                                                        formErrors.status
                                                                    }
                                                                </p>
                                                            ) : null}
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-end gap-3 border-t border-gray-200 pt-6">
                                                        <button
                                                            type="button"
                                                            className="rounded px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                                            onClick={() =>
                                                                handleDrawerClose()
                                                            }
                                                            disabled={
                                                                isSubmitting
                                                            }
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            type="submit"
                                                            className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
                                                            disabled={
                                                                isSubmitting ||
                                                                !isFormValid
                                                            }
                                                        >
                                                            {isSubmitting
                                                                ? selectedFiscalYear
                                                                    ? "Updating..."
                                                                    : "Creating..."
                                                                : selectedFiscalYear
                                                                ? "Update"
                                                                : "Create"}
                                                        </button>
                                                    </div>
                                                </form>
                                            </div>
                                        </div>
                                    </DialogPanel>
                                </div>
                            </div>
                        </div>
                    </Dialog>

                    <Dialog
                        open={isDeleteDialogOpen}
                        onClose={resetDeleteState}
                        className="relative z-50"
                    >
                        <div
                            className="fixed inset-0 bg-gray-500/75"
                            aria-hidden="true"
                        />
                        <div className="fixed inset-0 flex items-center justify-center p-4">
                            <DialogPanel className="w-full max-w-lg transform overflow-hidden rounded-lg bg-white shadow-xl">
                                <div className="p-6">
                                    <DialogTitle className="text-base font-semibold text-gray-900">
                                        Confirm deletion
                                    </DialogTitle>
                                    <p className="mt-4 text-sm text-gray-600">
                                        Are you sure you want to delete the
                                        fiscal year{" "}
                                        <span className="font-medium text-gray-900">
                                            {pendingDelete
                                                ? `${pendingDelete.year} (${
                                                      pendingDelete.ledger
                                                          ?.name ??
                                                      pendingDelete.ledger
                                                          ?.code ??
                                                      pendingDelete.ledger_id
                                                  })`
                                                : "this fiscal year"}
                                        </span>
                                        ? This action cannot be undone.
                                    </p>
                                    {deleteError ? (
                                        <p
                                            className="mt-4 text-sm text-red-600"
                                            role="alert"
                                        >
                                            {deleteError}
                                        </p>
                                    ) : null}
                                </div>
                                <div className="flex justify-end gap-3 bg-gray-50 px-6 py-4">
                                    <button
                                        type="button"
                                        className="rounded px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
                                        onClick={resetDeleteState}
                                        disabled={isDeleting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="rounded px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        onClick={handleDeleteConfirm}
                                        disabled={isDeleting}
                                    >
                                        {isDeleting ? "Deleting..." : "Delete"}
                                    </button>
                                </div>
                            </DialogPanel>
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
