"use client";

import Breadcrumb from "@/components/layout/Breadcrumb";
import PageHeader from "@/components/layout/PageHeader";
import ChartOfAccountsTable from "./ChartOfAccountsTable";
import { FormEvent, useEffect, useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
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

type Account = {
    id: string;
    code: string;
    name: string;
    type: string;
    normal_balance: string;
    status: string;
    [key: string]: unknown;
};

type FormState = {
    code: string;
    name: string;
    description: string;
    level: string;
    parentId: string;
    type: string;
    normalBalance: string;
    isPostable: boolean;
    isActive: boolean;
};

const validatableFields = [
    "code",
    "name",
    "level",
    "type",
    "normalBalance",
] as const;

type ValidatableField = (typeof validatableFields)[number];
type FormErrors = Partial<Record<ValidatableField, string>>;

const accountTypes = [
    "ASSET",
    "LIABILITY",
    "EQUITY",
    "REVENUE",
    "EXPENSE",
    "OFF_BALANCE",
] as const;

const normalBalanceOptions = ["DEBIT", "CREDIT"] as const;

const createInitialFormState = (): FormState => ({
    code: "",
    name: "",
    description: "",
    level: "",
    parentId: "",
    type: accountTypes[0],
    normalBalance: normalBalanceOptions[0],
    isPostable: true,
    isActive: true,
});

const getSelectClasses = (hasError: boolean) =>
    `col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pl-3 pr-8 text-base text-gray-900 outline-1 -outline-offset-1 focus:outline-2 focus:-outline-offset-2 sm:text-sm/6 ${
        hasError
            ? "outline-red-500 focus:outline-red-500"
            : "outline-gray-300 focus:outline-indigo-600"
    }`;

export default function ChartOfAccountsPage() {
    const [open, setOpen] = useState(false);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [accountsError, setAccountsError] = useState<string | null>(null);
    const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
    const [formData, setFormData] = useState<FormState>(() =>
        createInitialFormState()
    );
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const [submissionError, setSubmissionError] = useState<string | null>(
        null
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchAccounts = async () => {
            setIsLoadingAccounts(true);
            try {
                const res = await fetch("/api/finance-accounting/accounts");
                if (!res.ok) throw new Error("Network response was not ok");
                const data = await res.json();
                setAccounts(data);
                setAccountsError(null);
            } catch (fetchError) {
                console.error(fetchError);
                setAccountsError(
                    "Unable to load accounts at this time. Please try again later."
                );
            } finally {
                setIsLoadingAccounts(false);
            }
        };

        fetchAccounts();
    }, []);

    const resetForm = () => {
        setFormData(createInitialFormState());
        setFormErrors({});
        setSubmissionError(null);
    };

    const isValidatableField = (
        field: keyof FormState
    ): field is ValidatableField =>
        validatableFields.includes(field as ValidatableField);

    const updateFormField = <K extends keyof FormState>(
        field: K,
        value: FormState[K]
    ) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));

        if (isValidatableField(field)) {
            setFormErrors((prev) => {
                if (!prev[field]) return prev;

                const { [field]: _ignored, ...rest } = prev;
                void _ignored;
                return rest;
            });
        }
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmissionError(null);

        const trimmedCode = formData.code.trim();
        const trimmedName = formData.name.trim();
        const normalizedType = formData.type.trim().toUpperCase();
        const normalizedNormalBalance = formData.normalBalance
            .trim()
            .toUpperCase();
        const parsedLevel = Number.parseInt(formData.level, 10);

        const nextErrors: FormErrors = {};

        if (!trimmedCode) {
            nextErrors.code = "Code is required.";
        }

        if (!trimmedName) {
            nextErrors.name = "Account name is required.";
        }

        if (Number.isNaN(parsedLevel)) {
            nextErrors.level = "Level must be a valid number.";
        } else if (parsedLevel < 0) {
            nextErrors.level = "Level must be zero or greater.";
        }

        if (!accountTypes.includes(normalizedType as (typeof accountTypes)[number])) {
            nextErrors.type = "Select a valid account type.";
        }

        if (
            !normalBalanceOptions.includes(
                normalizedNormalBalance as (typeof normalBalanceOptions)[number]
            )
        ) {
            nextErrors.normalBalance = "Select a valid normal balance.";
        }

        if (Object.keys(nextErrors).length > 0) {
            setFormErrors(nextErrors);
            setSubmissionError("Please review the highlighted fields.");
            return;
        }

        setIsSubmitting(true);

        const payload = {
            code: trimmedCode,
            name: trimmedName,
            description: formData.description.trim() || null,
            level: parsedLevel,
            parentId: formData.parentId || null,
            type: normalizedType,
            normalBalance: normalizedNormalBalance,
            isPostable: formData.isPostable,
            isActive: formData.isActive,
        };

        try {
            const response = await fetch("/api/finance-accounting/accounts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            let responseBody: unknown = null;
            try {
                responseBody = await response.json();
            } catch (parseError) {
                console.error("Failed to parse response", parseError);
            }

            if (!response.ok) {
                if (
                    responseBody &&
                    typeof responseBody === "object" &&
                    "errors" in responseBody
                ) {
                    const rawErrors = responseBody.errors as Record<
                        string,
                        unknown
                    >;
                    const normalizedErrors: FormErrors = {};

                    Object.entries(rawErrors).forEach(([key, value]) => {
                        if (typeof value !== "string") return;

                        switch (key) {
                            case "code":
                                normalizedErrors.code = value;
                                break;
                            case "name":
                                normalizedErrors.name = value;
                                break;
                            case "level":
                                normalizedErrors.level = value;
                                break;
                            case "type":
                            case "accountType":
                                normalizedErrors.type = value;
                                break;
                            case "normalBalance":
                            case "normal_balance":
                                normalizedErrors.normalBalance = value;
                                break;
                            default:
                                break;
                        }
                    });

                    setFormErrors(normalizedErrors);
                }

                const apiErrorMessage =
                    responseBody &&
                    typeof responseBody === "object" &&
                    "error" in responseBody &&
                    typeof responseBody.error === "string"
                        ? responseBody.error
                        : "Unable to create the account. Please try again.";

                setSubmissionError(apiErrorMessage);
                return;
            }

            if (
                responseBody &&
                typeof responseBody === "object" &&
                responseBody !== null
            ) {
                setAccounts((previous) => [
                    ...previous,
                    responseBody as Account,
                ]);
            }

            resetForm();
            setOpen(false);
        } catch (submitError) {
            console.error(submitError);
            setSubmissionError(
                "An unexpected error occurred. Please try again."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenModal = () => {
        resetForm();
        setOpen(true);
    };

    const handleCloseModal = () => {
        setOpen(false);
        resetForm();
    };

    const handleDialogToggle = (value: boolean) => {
        setOpen(value);
        if (!value) {
            resetForm();
        }
    };

    const getFieldWrapperClasses = (field?: ValidatableField) => {
        const hasError = field ? Boolean(formErrors[field]) : false;
        const colorClasses = hasError
            ? "outline-red-500 focus-within:outline-red-500"
            : "outline-gray-300 focus-within:outline-indigo-600";

        return `flex items-center rounded-md bg-white pl-3 outline-1 -outline-offset-1 focus-within:outline-2 focus-within:-outline-offset-2 ${colorClasses}`;
    };

    return (
        <>
            <SignedIn>
                <div className="flex min-h-screen flex-col p-5">
                    <Breadcrumb items={items} />
                    <PageHeader title="Chart of Accounts" />

                    <div className="flex items-center justify-between">
                        <div />
                        <button
                            type="button"
                            className="inline-flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onClick={handleOpenModal}
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
                                    {accountsError ? (
                                        <div className="bg-red-50 p-4">
                                            <p className="text-sm text-red-700">
                                                {accountsError}
                                            </p>
                                        </div>
                                    ) : isLoadingAccounts ? (
                                        <div className="p-4 text-sm text-gray-500">
                                            Loading accounts...
                                        </div>
                                    ) : accounts.length === 0 ? (
                                        <div className="p-4 text-sm text-gray-500">
                                            No accounts found.
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex-1 min-h-0 min-w-full overflow-y-auto overflow-x-auto">
                                                <ChartOfAccountsTable
                                                    accounts={accounts}
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
                        onClose={handleDialogToggle}
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
                                                        Add Chart of Account
                                                    </DialogTitle>
                                                    <div className="ml-3 flex h-7 items-center">
                                                        <button
                                                            type="button"
                                                            onClick={handleCloseModal}
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
                                                        Lorem, ipsum dolor sit
                                                        amet consectetur
                                                        adipisicing elit aliquam
                                                        ad hic recusandae
                                                        soluta.
                                                    </p>
                                                </div>
                                            </div>

                                            <form
                                                onSubmit={handleSubmit}
                                                className="flex flex-1 flex-col"
                                            >
                                                <div className="relative flex-1 overflow-auto px-4 py-6 sm:px-6">
                                                    <div className="sm:col-span-4">
                                                        <label
                                                            htmlFor="code"
                                                            className="block text-sm/6 font-medium text-gray-900"
                                                        >
                                                            Code
                                                        </label>
                                                        <div className="mt-2">
                                                            <div className={getFieldWrapperClasses("code")}>
                                                                <input
                                                                    id="code"
                                                                    name="code"
                                                                    type="text"
                                                                    placeholder=""
                                                                    className="block min-w-0 grow bg-white py-1.5 pl-1 pr-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline-0 sm:text-sm/6"
                                                                    value={formData.code}
                                                                    onChange={(event) =>
                                                                        updateFormField(
                                                                            "code",
                                                                            event.target.value
                                                                        )
                                                                    }
                                                                    aria-invalid={Boolean(
                                                                        formErrors.code
                                                                    )}
                                                                    aria-describedby={
                                                                        formErrors.code
                                                                            ? "code-error"
                                                                            : undefined
                                                                    }
                                                                />
                                                            </div>
                                                        </div>
                                                        {formErrors.code ? (
                                                            <p
                                                                id="code-error"
                                                                className="mt-2 text-sm text-red-600"
                                                            >
                                                                {formErrors.code}
                                                            </p>
                                                        ) : null}
                                                    </div>

                                                    <div className="sm:col-span-4 mt-4">
                                                        <label
                                                            htmlFor="name"
                                                            className="block text-sm/6 font-medium text-gray-900"
                                                        >
                                                            Account Name
                                                        </label>
                                                        <div className="mt-2">
                                                            <div className={getFieldWrapperClasses("name")}>
                                                                <input
                                                                    id="name"
                                                                    name="name"
                                                                    type="text"
                                                                    placeholder=""
                                                                    className="block min-w-0 grow bg-white py-1.5 pl-1 pr-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline-0 sm:text-sm/6"
                                                                    value={formData.name}
                                                                    onChange={(event) =>
                                                                        updateFormField(
                                                                            "name",
                                                                            event.target.value
                                                                        )
                                                                    }
                                                                    aria-invalid={Boolean(
                                                                        formErrors.name
                                                                    )}
                                                                    aria-describedby={
                                                                        formErrors.name
                                                                            ? "name-error"
                                                                            : undefined
                                                                    }
                                                                />
                                                            </div>
                                                        </div>
                                                        {formErrors.name ? (
                                                            <p
                                                                id="name-error"
                                                                className="mt-2 text-sm text-red-600"
                                                            >
                                                                {formErrors.name}
                                                            </p>
                                                        ) : null}
                                                    </div>

                                                    <div className="sm:col-span-4 mt-4">
                                                        <label
                                                            htmlFor="description"
                                                            className="block text-sm/6 font-medium text-gray-900"
                                                        >
                                                            Description
                                                        </label>
                                                        <div className="mt-2">
                                                            <div className={getFieldWrapperClasses()}>
                                                                <textarea
                                                                    id="description"
                                                                    name="description"
                                                                    rows={4}
                                                                    placeholder=""
                                                                    className="block min-w-0 grow bg-white py-1.5 pl-1 pr-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline-0 sm:text-sm/6"
                                                                    value={formData.description}
                                                                    onChange={(event) =>
                                                                        updateFormField(
                                                                            "description",
                                                                            event.target.value
                                                                        )
                                                                    }
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
                                                            <div className={getFieldWrapperClasses("level")}>
                                                                <input
                                                                    id="level"
                                                                    name="level"
                                                                    type="number"
                                                                    placeholder=""
                                                                    className="block min-w-0 grow bg-white py-1.5 pl-1 pr-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline-0 sm:text-sm/6"
                                                                    value={formData.level}
                                                                    onChange={(event) =>
                                                                        updateFormField(
                                                                            "level",
                                                                            event.target.value
                                                                        )
                                                                    }
                                                                    aria-invalid={Boolean(
                                                                        formErrors.level
                                                                    )}
                                                                    aria-describedby={
                                                                        formErrors.level
                                                                            ? "level-error"
                                                                            : undefined
                                                                    }
                                                                    min={0}
                                                                />
                                                            </div>
                                                        </div>
                                                        {formErrors.level ? (
                                                            <p
                                                                id="level-error"
                                                                className="mt-2 text-sm text-red-600"
                                                            >
                                                                {formErrors.level}
                                                            </p>
                                                        ) : null}
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
                                                                name="parentId"
                                                                autoComplete="parent-account"
                                                                className={getSelectClasses(false)}
                                                                value={formData.parentId}
                                                                onChange={(event) =>
                                                                    updateFormField(
                                                                        "parentId",
                                                                        event.target.value
                                                                    )
                                                                }
                                                                disabled={isLoadingAccounts}
                                                            >
                                                                <option value="">
                                                                    {isLoadingAccounts
                                                                        ? "Loading accounts..."
                                                                        : "No parent account"}
                                                                </option>
                                                                {accounts.map((account) => (
                                                                    <option
                                                                        key={account.id}
                                                                        value={account.id}
                                                                    >
                                                                        {`${account.code} – ${account.name}`}
                                                                    </option>
                                                                ))}
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
                                                                name="type"
                                                                autoComplete="account-type"
                                                                className={getSelectClasses(
                                                                    Boolean(formErrors.type)
                                                                )}
                                                                value={formData.type}
                                                                onChange={(event) =>
                                                                    updateFormField(
                                                                        "type",
                                                                        event.target.value
                                                                    )
                                                                }
                                                                aria-invalid={Boolean(
                                                                    formErrors.type
                                                                )}
                                                                aria-describedby={
                                                                    formErrors.type
                                                                        ? "type-error"
                                                                        : undefined
                                                                }
                                                            >
                                                                {accountTypes.map(
                                                                    (accountType) => (
                                                                        <option
                                                                            key={accountType}
                                                                            value={accountType}
                                                                        >
                                                                            {accountType.replace(
                                                                                /_/g,
                                                                                " "
                                                                            )}
                                                                        </option>
                                                                    )
                                                                )}
                                                            </select>
                                                            <ChevronDownIcon
                                                                aria-hidden="true"
                                                                className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"
                                                            />
                                                        </div>
                                                        {formErrors.type ? (
                                                            <p
                                                                id="type-error"
                                                                className="mt-2 text-sm text-red-600"
                                                            >
                                                                {formErrors.type}
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
                                                                name="normalBalance"
                                                                autoComplete="normal-balance"
                                                                className={getSelectClasses(
                                                                    Boolean(
                                                                        formErrors.normalBalance
                                                                    )
                                                                )}
                                                                value={formData.normalBalance}
                                                                onChange={(event) =>
                                                                    updateFormField(
                                                                        "normalBalance",
                                                                        event.target.value
                                                                    )
                                                                }
                                                                aria-invalid={Boolean(
                                                                    formErrors.normalBalance
                                                                )}
                                                                aria-describedby={
                                                                    formErrors.normalBalance
                                                                        ? "normal-balance-error"
                                                                        : undefined
                                                                }
                                                            >
                                                                {normalBalanceOptions.map(
                                                                    (balance) => (
                                                                        <option
                                                                            key={balance}
                                                                            value={balance}
                                                                        >
                                                                            {balance.charAt(0) +
                                                                                balance
                                                                                    .slice(1)
                                                                                    .toLowerCase()}
                                                                        </option>
                                                                    )
                                                                )}
                                                            </select>
                                                            <ChevronDownIcon
                                                                aria-hidden="true"
                                                                className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"
                                                            />
                                                        </div>
                                                        {formErrors.normalBalance ? (
                                                            <p
                                                                id="normal-balance-error"
                                                                className="mt-2 text-sm text-red-600"
                                                            >
                                                                {formErrors.normalBalance}
                                                            </p>
                                                        ) : null}
                                                    </div>

                                                    <div className="grid grid-cols-1 gap-4 mt-4 sm:grid-cols-2">
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
                                                                    id="is-postable"
                                                                    name="isPostable"
                                                                    type="checkbox"
                                                                    aria-label="Is postable"
                                                                    className="absolute inset-0 appearance-none focus:outline-none"
                                                                    checked={formData.isPostable}
                                                                    onChange={(event) =>
                                                                        updateFormField(
                                                                            "isPostable",
                                                                            event.target.checked
                                                                        )
                                                                    }
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
                                                                    id="is-active"
                                                                    name="isActive"
                                                                    type="checkbox"
                                                                    aria-label="Is active"
                                                                    className="absolute inset-0 appearance-none focus:outline-none"
                                                                    checked={formData.isActive}
                                                                    onChange={(event) =>
                                                                        updateFormField(
                                                                            "isActive",
                                                                            event.target.checked
                                                                        )
                                                                    }
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {submissionError ? (
                                                        <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                                            {submissionError}
                                                        </div>
                                                    ) : null}
                                                </div>

                                                <div className="flex justify-end gap-3 bg-gray-200 p-4">
                                                    <button
                                                        type="button"
                                                        className="rounded bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:cursor-not-allowed disabled:opacity-70"
                                                        onClick={handleCloseModal}
                                                        disabled={isSubmitting}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
                                                        disabled={isSubmitting}
                                                    >
                                                        {isSubmitting ? "Saving..." : "Save"}
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </DialogPanel>
                                </div>
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
