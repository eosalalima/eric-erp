"use client";

import Breadcrumb from "@/components/layout/Breadcrumb";
import PageHeader from "@/components/layout/PageHeader";
import ChartOfAccountsTable from "./ChartOfAccountsTable";
import { useState, useEffect, useRef, ChangeEvent, useMemo } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import {
    ChevronDownIcon,
    ChartBarIcon,
    MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import {
    CheckCircleIcon,
    XCircleIcon as AlertXCircleIcon,
} from "@heroicons/react/20/solid";
import { RedirectToSignIn, SignedIn, SignedOut } from "@clerk/nextjs";

const items = [
    { name: "Home", href: "/modules/finance-accounting" },
    {
        name: "General Ledger",
        href: "/modules/finance-accounting/general-ledger",
    },
    {
        name: "Chart of Accounts",
        href: "/modules/finance-accounting/general-ledger/chart-of-accounts",
    },
];

// Import the Account type from ChartOfAccountsTable
import type { Account } from "./ChartOfAccountsTable";

type FormValues = {
    code: string;
    name: string;
    level: string;
    accountType: string;
    normalBalance: string;
};

const defaultFormValues: FormValues = {
    code: "",
    name: "",
    level: "",
    accountType: "ASSET",
    normalBalance: "Debit",
};

const defaultTouchedFields: Record<keyof FormValues, boolean> = {
    code: false,
    name: false,
    level: false,
    accountType: false,
    normalBalance: false,
};

export default function ChartOfAccountsPage() {
    const [open, setOpen] = useState(false);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [saveStatus, setSaveStatus] = useState<{
        type: "success" | "error";
        message: string;
    } | null>(null);
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(
        null
    );
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [pendingDeleteAccount, setPendingDeleteAccount] =
        useState<Account | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [formValues, setFormValues] = useState<FormValues>(defaultFormValues);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [touchedFields, setTouchedFields] =
        useState<Record<keyof FormValues, boolean>>(defaultTouchedFields);
    const [searchQuery, setSearchQuery] = useState("");
    const formRef = useRef<HTMLFormElement>(null);

    const validateRequiredFields = (values: FormValues) => {
        const errors: Record<string, string> = {};

        if (!values.code.trim()) {
            errors.code = "Code is required.";
        }

        if (!values.name.trim()) {
            errors.name = "Account name is required.";
        }

        if (!values.level.trim()) {
            errors.level = "Level is required.";
        } else if (Number.isNaN(Number(values.level))) {
            errors.level = "Level must be a valid number.";
        }

        if (!values.accountType) {
            errors.accountType = "Account type is required.";
        }

        if (!values.normalBalance) {
            errors.normalBalance = "Normal balance is required.";
        }

        return {
            errors,
            isValid: Object.keys(errors).length === 0,
        };
    };

    const handleFieldChange =
        (field: keyof FormValues) =>
        (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
            const value = event.target.value;
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

            const { errors } = validateRequiredFields(updatedValues);
            const filteredErrors = Object.fromEntries(
                Object.entries(errors).filter(
                    ([key]) => updatedTouched[key as keyof FormValues]
                )
            ) as Record<string, string>;

            setFormErrors(filteredErrors);
        };

    const handleFieldBlur = (field: keyof FormValues) => () => {
        if (touchedFields[field]) {
            return;
        }

        const updatedTouched = {
            ...touchedFields,
            [field]: true,
        } as Record<keyof FormValues, boolean>;

        setTouchedFields(updatedTouched);

        const { errors } = validateRequiredFields(formValues);
        const filteredErrors = Object.fromEntries(
            Object.entries(errors).filter(
                ([key]) => updatedTouched[key as keyof FormValues]
            )
        ) as Record<string, string>;

        setFormErrors(filteredErrors);
    };

    const { isValid: isFormValid } = validateRequiredFields(formValues);

    useEffect(() => {
        if (!saveStatus) {
            return;
        }

        const timeoutId = setTimeout(() => {
            setSaveStatus(null);
        }, 3000);

        return () => {
            clearTimeout(timeoutId);
        };
    }, [saveStatus]);

    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const res = await fetch("/api/finance-accounting/accounts");
                if (!res.ok) throw new Error("Network response was not ok");
                const data = (await res.json()) as Account[];
                setAccounts(data);
            } catch (fetchError) {
                console.error(fetchError);
                setFetchError(
                    "Unable to load accounts at this time. Please try again later."
                );
            }
        };
        fetchAccounts();
    }, []);

    useEffect(() => {
        if (!open) {
            return;
        }

        if (selectedAccount) {
            setFormValues({
                code: selectedAccount.code ?? "",
                name: selectedAccount.name ?? "",
                level:
                    selectedAccount.level === undefined ||
                    selectedAccount.level === null
                        ? ""
                        : String(selectedAccount.level),
                accountType: selectedAccount.type ?? "ASSET",
                normalBalance:
                    selectedAccount.normal_balance.toUpperCase() === "CREDIT"
                        ? "Credit"
                        : "Debit",
            });
        } else {
            setFormValues(defaultFormValues);
        }

        setFormErrors({});
        setTouchedFields({ ...defaultTouchedFields });
    }, [open, selectedAccount]);

    useEffect(() => {
        if (!open || !formRef.current) {
            return;
        }

        const form = formRef.current;

        if (!selectedAccount) {
            form.reset();
            return;
        }

        const assignValue = (
            name: string,
            value: string | number | null | undefined
        ) => {
            const element = form.elements.namedItem(name);

            if (element instanceof HTMLInputElement) {
                if (element.type === "checkbox") {
                    element.checked = Boolean(value);
                } else {
                    element.value = value == null ? "" : String(value);
                }
            } else if (
                element instanceof HTMLSelectElement ||
                element instanceof HTMLTextAreaElement
            ) {
                element.value = value == null ? "" : String(value);
            }
        };

        assignValue("description", selectedAccount.description ?? "");

        const parentField = form.elements.namedItem("parent-account");
        if (parentField instanceof HTMLSelectElement) {
            parentField.value = selectedAccount.parent_id ?? "";
        }

        const isActiveField = form.elements.namedItem("is-active");
        if (isActiveField instanceof HTMLInputElement) {
            isActiveField.checked = selectedAccount.status === "ACTIVE";
        }

        const isPostableField = form.elements.namedItem("is-postable");
        if (isPostableField instanceof HTMLInputElement) {
            isPostableField.checked = Boolean(selectedAccount.is_postable);
        }
    }, [selectedAccount, open]);

    const filteredAccounts = useMemo(() => {
        const normalizedQuery = searchQuery.trim().toLowerCase();

        if (!normalizedQuery) {
            return accounts;
        }

        return accounts.filter((account) => {
            const code = account.code?.toLowerCase() ?? "";
            const name = account.name?.toLowerCase() ?? "";

            return (
                code.includes(normalizedQuery) || name.includes(normalizedQuery)
            );
        });
    }, [accounts, searchQuery]);

    const isLoadingAccounts = !fetchError && accounts.length === 0;

    const handleEdit = (accountId: string) => {
        const accountToEdit = accounts.find(
            (account) => account.id === accountId
        );
        if (!accountToEdit) {
            return;
        }

        console.log("Editing account:", accountToEdit);

        setSaveStatus(null);
        setOpen(true);
        setSelectedAccount(accountToEdit);
        setFormErrors({});
        setTouchedFields({ ...defaultTouchedFields });
    };

    const handleDrawerClose = (options?: { clearSaveStatus?: boolean }) => {
        setOpen(false);
        setSelectedAccount(null);
        setFormValues(defaultFormValues);
        setFormErrors({});
        setTouchedFields({ ...defaultTouchedFields });
        if (formRef.current) {
            formRef.current.reset();
        }
        if (options?.clearSaveStatus ?? true) {
            setSaveStatus(null);
        }
    };

    const handleSave = async () => {
        if (!formRef.current) {
            return;
        }

        setSaveStatus(null);

        const { errors, isValid } = validateRequiredFields(formValues);

        if (!isValid) {
            setTouchedFields({
                code: true,
                name: true,
                level: true,
                accountType: true,
                normalBalance: true,
            });
            setFormErrors(errors);
            setSaveStatus({
                type: "error",
                message: "Please correct the errors before saving.",
            });
            return;
        }

        setFormErrors({});

        const formData = new FormData(formRef.current);

        const description = formData.get("description");
        const parentAccount = formData.get("parent-account");
        const normalBalance =
            formValues.normalBalance.toLowerCase() === "credit"
                ? "CREDIT"
                : "DEBIT";
        const parsedLevel = Number(formValues.level);

        const selectedParentId =
            typeof parentAccount === "string" && parentAccount !== ""
                ? parentAccount
                : null;

        let ledgerId: string | null = selectedAccount?.ledger_id ?? null;
        if (selectedParentId) {
            const parentAccountDetails = accounts.find(
                (account) => account.id === selectedParentId
            );
            ledgerId = parentAccountDetails?.ledger_id ?? null;
        }

        if (!ledgerId && accounts.length > 0) {
            ledgerId = accounts[0]?.ledger_id ?? null;
        }

        if (!ledgerId) {
            setSaveStatus({
                type: "error",
                message: "Unable to determine the ledger for the new account.",
            });
            return;
        }

        const payload = {
            code: formValues.code.trim(),
            name: formValues.name.trim(),
            description:
                typeof description === "string" && description.trim() !== ""
                    ? description
                    : null,
            level: parsedLevel,
            parent_id: selectedParentId,
            type:
                formValues.accountType && formValues.accountType !== ""
                    ? formValues.accountType
                    : "ASSET",
            normal_balance: normalBalance,
            is_postable: formData.get("is-postable") === "on",
            status: formData.get("is-active") === "on" ? "ACTIVE" : "INACTIVE",
            ledger_id: ledgerId,
        };

        try {
            if (selectedAccount) {
                const response = await fetch(
                    `/api/finance-accounting/accounts/${selectedAccount.id}`,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(payload),
                    }
                );

                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }

                const updatedAccount = (await response.json()) as Account;
                setAccounts((prevAccounts) =>
                    prevAccounts.map((account) =>
                        account.id === updatedAccount.id
                            ? updatedAccount
                            : account
                    )
                );
                setSelectedAccount(null);
            } else {
                const response = await fetch(
                    "/api/finance-accounting/accounts",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(payload),
                    }
                );

                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }

                const newAccount = (await response.json()) as Account;
                setAccounts((prevAccounts) => [...prevAccounts, newAccount]);
            }
            setSaveStatus({
                type: "success",
                message: "Successfully saved.",
            });
            handleDrawerClose({ clearSaveStatus: false });
        } catch (saveError) {
            console.error(saveError);
            setSaveStatus({
                type: "error",
                message: "An error occurred during save.",
            });
        }
    };

    const handleDeleteRequest = (account: Account) => {
        setPendingDeleteAccount(account);
        setIsDeleteModalOpen(true);
        setDeleteError(null);
    };

    const resetDeleteState = () => {
        setIsDeleteModalOpen(false);
        setPendingDeleteAccount(null);
        setDeleteError(null);
        setIsDeleting(false);
    };

    const handleDeleteConfirm = async () => {
        if (!pendingDeleteAccount) {
            return;
        }

        setIsDeleting(true);
        setDeleteError(null);

        try {
            const response = await fetch(
                `/api/finance-accounting/accounts/${pendingDeleteAccount.id}`,
                {
                    method: "DELETE",
                }
            );

            if (!response.ok) {
                let errorMessage = "Failed to delete account.";
                try {
                    const data = await response.json();
                    if (data?.message) {
                        errorMessage = data.message;
                    }
                } catch {
                    // Ignore parsing errors and use the default message
                }

                throw new Error(errorMessage);
            }

            setAccounts((prevAccounts) =>
                prevAccounts.filter(
                    (account) => account.id !== pendingDeleteAccount.id
                )
            );

            setSaveStatus({
                type: "success",
                message: "Account deleted successfully.",
            });

            resetDeleteState();
        } catch (error) {
            console.error(error);
            const message =
                error instanceof Error
                    ? error.message
                    : "Failed to delete account.";
            setDeleteError(message);
            setSaveStatus({
                type: "error",
                message,
            });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <SignedIn>
                <div className="flex min-h-screen flex-col p-5">
                    <Breadcrumb items={items} />
                    <PageHeader title="Chart of Accounts" />

                    <div className="mt-5 flex items-center justify-between">
                        <div className="mt-2 flex">
                            <div className="-mr-px grid grow grid-cols-1 focus-within:relative">
                                <input
                                    id="query"
                                    name="query"
                                    type="text"
                                    placeholder="Enter account name or code"
                                    value={searchQuery}
                                    onChange={(event) => {
                                        setSearchQuery(event.target.value);
                                    }}
                                    className="col-start-1 row-start-1 block w-full rounded-l-md bg-white py-1.5 pl-10 pr-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                                />
                                <ChartBarIcon
                                    aria-hidden="true"
                                    className="pointer-events-none col-start-1 row-start-1 ml-3 size-5 self-center text-gray-400 sm:size-4"
                                />
                            </div>
                            <button
                                type="button"
                                className="flex shrink-0 items-center gap-x-1.5 rounded-r-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 outline-1 -outline-offset-1 outline-gray-300 hover:bg-gray-50 focus:relative focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                            >
                                <MagnifyingGlassIcon
                                    aria-hidden="true"
                                    className="-ml-0.5 size-4 text-gray-400"
                                />
                                Search
                            </button>
                        </div>
                        <button
                            type="button"
                            className="inline-flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onClick={() => {
                                setSaveStatus(null);
                                setSelectedAccount(null);

                                if (formRef.current) {
                                    formRef.current.reset();
                                }
                                setFormValues(defaultFormValues);
                                setFormErrors({});
                                setTouchedFields({ ...defaultTouchedFields });
                                setOpen(true);
                            }}
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
                                    d="M12 4.5v15m7.5-7.5h-15"
                                />
                            </svg>
                            Add
                        </button>
                    </div>

                    <div className="mt-8 flex flex-1 min-h-0 flex-col">
                        <div className="-mx-4 -my-2 flex-1 min-h-0 overflow-x-auto sm:-mx-6 lg:-mx-8">
                            <div className="flex h-full min-w-full flex-col py-2 align-middle sm:px-6 lg:px-8">
                                <div className="flex flex-1 min-h-0 flex-col overflow-hidden shadow outline-1 outline-black/5 sm:rounded-lg">
                                    {saveStatus ? (
                                        <div className="fixed top-4 left-1/2 z-50 w-full max-w-md -translate-x-1/2 px-4">
                                            <div
                                                className={`rounded-md p-4 ${
                                                    saveStatus.type ===
                                                    "success"
                                                        ? "bg-green-100"
                                                        : "bg-red-100"
                                                }`}
                                            >
                                                <div className="flex">
                                                    <div className="flex-shrink-0">
                                                        {saveStatus.type ===
                                                        "success" ? (
                                                            <CheckCircleIcon className="size-5 text-green-400" />
                                                        ) : (
                                                            <AlertXCircleIcon className="size-5 text-red-400" />
                                                        )}
                                                    </div>
                                                    <div className="ml-3">
                                                        <p
                                                            className={`text-sm font-medium ${
                                                                saveStatus.type ===
                                                                "success"
                                                                    ? "text-green-800"
                                                                    : "text-red-800"
                                                            }`}
                                                        >
                                                            {saveStatus.message}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : null}
                                    {fetchError ? (
                                        <div className="bg-red-50 p-4">
                                            <p className="text-sm text-red-700">
                                                {fetchError}
                                            </p>
                                        </div>
                                    ) : filteredAccounts.length === 0 ? (
                                        <div className="p-4 text-sm text-gray-500">
                                            No accounts found.
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex-1 min-h-0 min-w-full overflow-y-auto overflow-x-auto">
                                                <ChartOfAccountsTable
                                                    accounts={filteredAccounts}
                                                    onEdit={(account) => {
                                                        handleEdit(account.id);
                                                    }}
                                                    onDelete={
                                                        handleDeleteRequest
                                                    }
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <Dialog
                        open={open}
                        onClose={(value) => {
                            setOpen(value);
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
                                        className="pointer-events-auto w-screen max-w-4xl transform transition duration-500 ease-in-out data-[closed]:translate-x-full sm:duration-700"
                                    >
                                        <div className="relative flex h-full flex-col overflow-y-auto bg-white shadow-xl">
                                            <div className="bg-indigo-700 px-4 py-6 sm:px-6">
                                                <div className="flex items-center justify-between">
                                                    <DialogTitle className="text-base font-semibold text-white">
                                                        {selectedAccount
                                                            ? "Edit Chart of Account"
                                                            : "Add Chart of Account"}
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
                                                        {selectedAccount
                                                            ? "Update or modify the details of an existing account in the chart of accounts."
                                                            : "Create a new account entry in the chart of accounts with details such as code, name, type, and hierarchy."}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="relative flex-1 px-4 py-6 sm:px-6 overflow-auto">
                                                <form ref={formRef}>
                                                    <div className="sm:col-span-4">
                                                        <label
                                                            htmlFor="code"
                                                            className="block text-sm/6 font-medium text-gray-900"
                                                        >
                                                            Code
                                                        </label>
                                                        <div className="mt-2">
                                                            <div
                                                                className={`flex items-center rounded-md bg-white pl-3 outline-1 -outline-offset-1 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600 ${
                                                                    formErrors.code
                                                                        ? "outline-red-500"
                                                                        : "outline-gray-300"
                                                                }`}
                                                            >
                                                                <input
                                                                    id="code"
                                                                    name="code"
                                                                    type="text"
                                                                    placeholder=""
                                                                    required
                                                                    value={
                                                                        formValues.code
                                                                    }
                                                                    onChange={handleFieldChange(
                                                                        "code"
                                                                    )}
                                                                    onBlur={handleFieldBlur(
                                                                        "code"
                                                                    )}
                                                                    aria-invalid={Boolean(
                                                                        formErrors.code
                                                                    )}
                                                                    className="block min-w-0 grow bg-white py-1.5 pl-1 pr-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline-0 sm:text-sm/6"
                                                                />
                                                            </div>
                                                            {formErrors.code ? (
                                                                <p
                                                                    className="mt-2 text-sm text-red-600"
                                                                    role="alert"
                                                                >
                                                                    {
                                                                        formErrors.code
                                                                    }
                                                                </p>
                                                            ) : null}
                                                        </div>
                                                    </div>

                                                    <div className="sm:col-span-4 mt-4">
                                                        <label
                                                            htmlFor="name"
                                                            className="block text-sm/6 font-medium text-gray-900"
                                                        >
                                                            Account Name
                                                        </label>
                                                        <div className="mt-2">
                                                            <div
                                                                className={`flex items-center rounded-md bg-white pl-3 outline-1 -outline-offset-1 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600 ${
                                                                    formErrors.name
                                                                        ? "outline-red-500"
                                                                        : "outline-gray-300"
                                                                }`}
                                                            >
                                                                <input
                                                                    id="name"
                                                                    name="name"
                                                                    type="text"
                                                                    placeholder=""
                                                                    required
                                                                    value={
                                                                        formValues.name
                                                                    }
                                                                    onChange={handleFieldChange(
                                                                        "name"
                                                                    )}
                                                                    onBlur={handleFieldBlur(
                                                                        "name"
                                                                    )}
                                                                    aria-invalid={Boolean(
                                                                        formErrors.name
                                                                    )}
                                                                    className="block min-w-0 grow bg-white py-1.5 pl-1 pr-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline-0 sm:text-sm/6"
                                                                />
                                                            </div>
                                                            {formErrors.name ? (
                                                                <p
                                                                    className="mt-2 text-sm text-red-600"
                                                                    role="alert"
                                                                >
                                                                    {
                                                                        formErrors.name
                                                                    }
                                                                </p>
                                                            ) : null}
                                                        </div>
                                                    </div>

                                                    <div className="sm:col-span-4 mt-4">
                                                        <label
                                                            htmlFor="description"
                                                            className="block text-sm/6 font-medium text-gray-900"
                                                        >
                                                            Description
                                                        </label>
                                                        <div className="mt-2">
                                                            <div className="flex items-center rounded-md bg-white pl-3 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600">
                                                                <textarea
                                                                    id="description"
                                                                    name="description"
                                                                    rows={4}
                                                                    placeholder=""
                                                                    defaultValue={
                                                                        selectedAccount
                                                                            ? selectedAccount.description ??
                                                                              ""
                                                                            : ""
                                                                    }
                                                                    className="block min-w-0 grow bg-white py-1.5 pl-1 pr-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline-0 sm:text-sm/6"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="sm:col-span-4 mt-4">
                                                        <label
                                                            htmlFor="level"
                                                            className="block text-sm/6 font-medium text-gray-900"
                                                        >
                                                            Level
                                                        </label>
                                                        <div className="mt-2">
                                                            <div
                                                                className={`flex items-center rounded-md bg-white pl-3 outline-1 -outline-offset-1 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600 ${
                                                                    formErrors.level
                                                                        ? "outline-red-500"
                                                                        : "outline-gray-300"
                                                                }`}
                                                            >
                                                                <input
                                                                    id="level"
                                                                    name="level"
                                                                    type="number"
                                                                    placeholder=""
                                                                    required
                                                                    value={
                                                                        formValues.level
                                                                    }
                                                                    onChange={handleFieldChange(
                                                                        "level"
                                                                    )}
                                                                    onBlur={handleFieldBlur(
                                                                        "level"
                                                                    )}
                                                                    aria-invalid={Boolean(
                                                                        formErrors.level
                                                                    )}
                                                                    className="block min-w-0 grow bg-white py-1.5 pl-1 pr-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline-0 sm:text-sm/6"
                                                                />
                                                            </div>
                                                            {formErrors.level ? (
                                                                <p
                                                                    className="mt-2 text-sm text-red-600"
                                                                    role="alert"
                                                                >
                                                                    {
                                                                        formErrors.level
                                                                    }
                                                                </p>
                                                            ) : null}
                                                        </div>
                                                    </div>

                                                    <div className="sm:col-span-3 mt-4">
                                                        <label
                                                            htmlFor="parent-account"
                                                            className="block text-sm/6 font-medium text-gray-900"
                                                        >
                                                            Parent Account
                                                        </label>
                                                        <div className="mt-2 grid grid-cols-1">
                                                            <select
                                                                id="parent-account"
                                                                name="parent-account"
                                                                autoComplete="parent-account"
                                                                defaultValue={
                                                                    selectedAccount
                                                                        ? selectedAccount.parent_id ??
                                                                          ""
                                                                        : ""
                                                                }
                                                                className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pl-3 pr-8 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                                                            >
                                                                <option
                                                                    value=""
                                                                    disabled
                                                                    hidden
                                                                >
                                                                    {isLoadingAccounts
                                                                        ? "Loading accounts..."
                                                                        : "No parent account"}
                                                                </option>
                                                                {accounts.map(
                                                                    (
                                                                        account
                                                                    ) => (
                                                                        <option
                                                                            key={
                                                                                account.id
                                                                            }
                                                                            value={
                                                                                account.id
                                                                            }
                                                                        >
                                                                            {`${account.code} – ${account.name}`}
                                                                        </option>
                                                                    )
                                                                )}
                                                            </select>
                                                            <ChevronDownIcon
                                                                aria-hidden="true"
                                                                className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="sm:col-span-3 mt-4">
                                                        <label
                                                            htmlFor="account-type"
                                                            className="block text-sm/6 font-medium text-gray-900"
                                                        >
                                                            Account Type
                                                        </label>
                                                        <div className="mt-2 grid grid-cols-1">
                                                            <select
                                                                id="account-type"
                                                                name="account-type"
                                                                autoComplete="account-type"
                                                                required
                                                                value={
                                                                    formValues.accountType
                                                                }
                                                                onChange={handleFieldChange(
                                                                    "accountType"
                                                                )}
                                                                onBlur={handleFieldBlur(
                                                                    "accountType"
                                                                )}
                                                                aria-invalid={Boolean(
                                                                    formErrors.accountType
                                                                )}
                                                                className={`col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pl-3 pr-8 text-base text-gray-900 outline-1 -outline-offset-1 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 ${
                                                                    formErrors.accountType
                                                                        ? "outline-red-500"
                                                                        : "outline-gray-300"
                                                                }`}
                                                            >
                                                                <option value="ASSET">
                                                                    Asset
                                                                </option>
                                                                <option value="LIABILITY">
                                                                    Liability
                                                                </option>
                                                                <option value="EQUITY">
                                                                    Equity
                                                                </option>
                                                                <option value="REVENUE">
                                                                    Revenue
                                                                </option>
                                                                <option value="EXPENSE">
                                                                    Expense
                                                                </option>
                                                                <option value="OFF_BALANCE">
                                                                    Off Balance
                                                                </option>
                                                            </select>
                                                            <ChevronDownIcon
                                                                aria-hidden="true"
                                                                className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"
                                                            />
                                                        </div>
                                                        {formErrors.accountType ? (
                                                            <p
                                                                className="mt-2 text-sm text-red-600"
                                                                role="alert"
                                                            >
                                                                {
                                                                    formErrors.accountType
                                                                }
                                                            </p>
                                                        ) : null}
                                                    </div>

                                                    <div className="sm:col-span-3 mt-4">
                                                        <label
                                                            htmlFor="normal-balance"
                                                            className="block text-sm/6 font-medium text-gray-900"
                                                        >
                                                            Normal Balance
                                                        </label>
                                                        <div className="mt-2 grid grid-cols-1">
                                                            <select
                                                                id="normal-balance"
                                                                name="normal-balance"
                                                                autoComplete="normal-balance"
                                                                required
                                                                value={
                                                                    formValues.normalBalance
                                                                }
                                                                onChange={handleFieldChange(
                                                                    "normalBalance"
                                                                )}
                                                                onBlur={handleFieldBlur(
                                                                    "normalBalance"
                                                                )}
                                                                aria-invalid={Boolean(
                                                                    formErrors.normalBalance
                                                                )}
                                                                className={`col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pl-3 pr-8 text-base text-gray-900 outline-1 -outline-offset-1 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 ${
                                                                    formErrors.normalBalance
                                                                        ? "outline-red-500"
                                                                        : "outline-gray-300"
                                                                }`}
                                                            >
                                                                <option value="Debit">
                                                                    Debit
                                                                </option>
                                                                <option value="Credit">
                                                                    Credit
                                                                </option>
                                                            </select>
                                                            <ChevronDownIcon
                                                                aria-hidden="true"
                                                                className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"
                                                            />
                                                        </div>
                                                        {formErrors.normalBalance ? (
                                                            <p
                                                                className="mt-2 text-sm text-red-600"
                                                                role="alert"
                                                            >
                                                                {
                                                                    formErrors.normalBalance
                                                                }
                                                            </p>
                                                        ) : null}
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                                                        <div>
                                                            <label
                                                                htmlFor="is-postable"
                                                                className="block text-sm/6 font-medium text-gray-900"
                                                            >
                                                                Is Postable
                                                            </label>
                                                            <div className="group relative inline-flex w-11 shrink-0 rounded-full bg-gray-200 p-0.5 outline-offset-2 outline-indigo-600 ring-1 ring-inset ring-gray-900/5 transition-colors duration-200 ease-in-out has-[:checked]:bg-indigo-600 has-[:focus-visible]:outline-2">
                                                                <span className="size-5 rounded-full bg-white shadow-sm ring-1 ring-gray-900/5 transition-transform duration-200 ease-in-out group-has-[:checked]:translate-x-5" />
                                                                <input
                                                                    name="is-postable"
                                                                    type="checkbox"
                                                                    defaultChecked={
                                                                        selectedAccount
                                                                            ? Boolean(
                                                                                  selectedAccount.is_postable
                                                                              )
                                                                            : false
                                                                    }
                                                                    aria-label="Use setting"
                                                                    className="absolute inset-0 appearance-none focus:outline-none"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label
                                                                htmlFor="is-active"
                                                                className="block text-sm/6 font-medium text-gray-900"
                                                            >
                                                                Is Active
                                                            </label>
                                                            <div className="group relative inline-flex w-11 shrink-0 rounded-full bg-gray-200 p-0.5 outline-offset-2 outline-indigo-600 ring-1 ring-inset ring-gray-900/5 transition-colors duration-200 ease-in-out has-[:checked]:bg-indigo-600 has-[:focus-visible]:outline-2">
                                                                <span className="size-5 rounded-full bg-white shadow-sm ring-1 ring-gray-900/5 transition-transform duration-200 ease-in-out group-has-[:checked]:translate-x-5" />
                                                                <input
                                                                    name="is-active"
                                                                    type="checkbox"
                                                                    defaultChecked={
                                                                        selectedAccount
                                                                            ? Boolean(
                                                                                  selectedAccount.status
                                                                              )
                                                                            : false
                                                                    }
                                                                    aria-label="Use setting"
                                                                    className="absolute inset-0 appearance-none focus:outline-none"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="sm:col-span-3 mt-4"></div>
                                                </form>
                                            </div>

                                            <div className="mt-8 flex justify-end gap-3 bg-gray-200 p-4">
                                                <button
                                                    type="button"
                                                    className="rounded px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                                                    onClick={() => {
                                                        handleDrawerClose({
                                                            clearSaveStatus:
                                                                false,
                                                        });
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="button"
                                                    className="rounded px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                                                    onClick={handleSave}
                                                    disabled={!isFormValid}
                                                >
                                                    Save
                                                </button>
                                            </div>
                                        </div>
                                    </DialogPanel>
                                </div>
                            </div>
                        </div>
                    </Dialog>
                    <Dialog
                        open={isDeleteModalOpen}
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
                                        account{" "}
                                        <span className="font-medium text-gray-900">
                                            {pendingDeleteAccount
                                                ? `${pendingDeleteAccount.code} – ${pendingDeleteAccount.name}`
                                                : "this account"}
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
                                        className="rounded px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
                                        onClick={resetDeleteState}
                                        disabled={isDeleting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="rounded px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50"
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
