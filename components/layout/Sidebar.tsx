"use client";

import {
    AcademicCapIcon,
    AdjustmentsHorizontalIcon,
    ArrowPathRoundedSquareIcon,
    BanknotesIcon,
    BeakerIcon,
    BellAlertIcon,
    BookOpenIcon,
    BugAntIcon,
    BuildingOffice2Icon,
    ChartBarIcon,
    ChartBarSquareIcon,
    ChartPieIcon,
    ChevronRightIcon,
    ChatBubbleLeftRightIcon,
    ChatBubbleOvalLeftEllipsisIcon,
    CheckCircleIcon,
    ClipboardDocumentCheckIcon,
    ClipboardDocumentListIcon,
    CogIcon,
    Cog6ToothIcon,
    Cog8ToothIcon,
    ComputerDesktopIcon,
    CreditCardIcon,
    CurrencyDollarIcon,
    DocumentChartBarIcon,
    DocumentCheckIcon,
    EnvelopeIcon,
    ExclamationTriangleIcon,
    FolderIcon,
    HandThumbUpIcon,
    HeartIcon,
    HomeIcon,
    LightBulbIcon,
    LockClosedIcon,
    MagnifyingGlassIcon,
    PresentationChartLineIcon,
    PuzzlePieceIcon,
    ReceiptPercentIcon,
    ReceiptRefundIcon,
    QuestionMarkCircleIcon,
    ShieldCheckIcon,
    ShoppingCartIcon,
    StarIcon,
    UserCircleIcon,
    UserGroupIcon,
    UserPlusIcon,
    UsersIcon,
    WalletIcon,
    WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const iconMap = {
    AcademicCapIcon,
    AdjustmentsHorizontalIcon,
    ArrowPathRoundedSquareIcon,
    BanknotesIcon,
    BeakerIcon,
    BellAlertIcon,
    BookOpenIcon,
    BugAntIcon,
    BuildingOffice2Icon,
    ChartBarIcon,
    ChartPieIcon,
    ChartBarSquareIcon,
    ChatBubbleLeftRightIcon,
    ChatBubbleOvalLeftEllipsisIcon,
    CheckCircleIcon,
    ClipboardDocumentCheckIcon,
    ClipboardDocumentListIcon,
    CogIcon,
    Cog6ToothIcon,
    Cog8ToothIcon,
    ComputerDesktopIcon,
    CreditCardIcon,
    CurrencyDollarIcon,
    DocumentChartBarIcon,
    DocumentCheckIcon,
    EnvelopeIcon,
    ExclamationTriangleIcon,
    FolderIcon,
    HandThumbUpIcon,
    HeartIcon,
    HomeIcon,
    LightBulbIcon,
    LockClosedIcon,
    MagnifyingGlassIcon,
    PresentationChartLineIcon,
    PuzzlePieceIcon,
    ReceiptPercentIcon,
    ReceiptRefundIcon,
    QuestionMarkCircleIcon,
    ShieldCheckIcon,
    ShoppingCartIcon,
    StarIcon,
    UserCircleIcon,
    UserGroupIcon,
    UserPlusIcon,
    UsersIcon,
    WalletIcon,
    WrenchScrewdriverIcon,
};

const fallbackIconKey = "HomeIcon" satisfies keyof typeof iconMap;

export interface SubNavigationItem {
    name: string;
    href: string;
    icon?: keyof typeof iconMap;
    current?: boolean;
}

export interface NavigationItem {
    name: string;
    href: string;
    icon: keyof typeof iconMap;
    current: boolean;
    subnavigation?: SubNavigationItem[];
}

const teams = [
    {
        id: 1,
        name: "Heroicons",
        href: "/heroicons",
        initial: "H",
        current: false,
    },
    {
        id: 2,
        name: "Tailwind Labs",
        href: "/tailwindlabs",
        initial: "T",
        current: false,
    },
    {
        id: 3,
        name: "Workcation",
        href: "/workcation",
        initial: "W",
        current: false,
    },
];

function classNames(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(" ");
}

interface SidebarProps {
    navigation: NavigationItem[];
}

export default function Sidebar({ navigation }: SidebarProps) {
    const pathname = usePathname();

    return (
        <>
            {/* Sidebar component, swap this element with another sidebar if you like */}
            <div className="fixed flex flex-col h-full w-64 gap-y-5 overflow-y-auto overflow-x-visible bg-gray-900 px-6 pb-4 ring-1 ring-white/10">
                <div className="flex h-16 shrink-0 items-center">
                    <Image
                        alt="ERIC ERP"
                        src="/Logo.png"
                        className="mt-4 mb-2 h-14 w-auto"
                        width={150}
                        height={96}
                    />
                    <div>
                        <span className="text-xl font-semibold text-lime-500">
                            ERIC ERP
                        </span>
                    </div>
                </div>
                <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-7">
                        <li>
                            <ul role="list" className="-mx-2 space-y-1">
                                {navigation.map((item) => {
                                    const hasChildren =
                                        (item.subnavigation?.length ?? 0) > 0;
                                    const Icon =
                                        iconMap[item.icon] ??
                                        iconMap[fallbackIconKey];
                                    const isActive =
                                        item.current ||
                                        pathname === item.href ||
                                        (item.subnavigation ?? []).some(
                                            (child) =>
                                                child.current ||
                                                pathname === child.href
                                        );

                                    return (
                                        <li
                                            key={item.href}
                                            className={classNames(
                                                "relative",
                                                hasChildren ? "group" : undefined
                                            )}
                                        >
                                            <Link
                                                {...(pathname === "/"
                                                    ? { target: "_blank" }
                                                    : {})}
                                                rel="noopener noreferrer"
                                                href={item.href}
                                                className={classNames(
                                                    isActive
                                                        ? "bg-gray-800 text-white"
                                                        : "text-gray-400 hover:bg-gray-800 hover:text-white",
                                                    "flex items-center gap-x-3 rounded-md p-2 text-sm/6 font-semibold transition"
                                                )}
                                            >
                                                <Icon
                                                    aria-hidden="true"
                                                    className="size-6 shrink-0"
                                                />
                                                <span className="truncate">
                                                    {item.name}
                                                </span>
                                                {hasChildren ? (
                                                    <ChevronRightIcon
                                                        aria-hidden="true"
                                                        className="ml-auto size-4 shrink-0 text-gray-500 transition group-hover:text-white"
                                                    />
                                                ) : null}
                                            </Link>

                                            {hasChildren ? (
                                                <>
                                                    <div className="mt-1 ml-9 space-y-1 border-l border-gray-800 pl-3 md:hidden">
                                                        {item.subnavigation?.map((child) => {
                                                            const ChildIcon =
                                                                child.icon
                                                                    ? iconMap[child.icon]
                                                                    : iconMap[
                                                                          fallbackIconKey
                                                                      ];
                                                            const childIsActive =
                                                                child.current ||
                                                                pathname ===
                                                                    child.href;

                                                            return (
                                                                <Link
                                                                    key={child.href}
                                                                    href={child.href}
                                                                    className={classNames(
                                                                        childIsActive
                                                                            ? "bg-gray-800 text-white"
                                                                            : "text-gray-300 hover:bg-gray-800 hover:text-white",
                                                                        "flex items-center gap-x-2 rounded-md px-2 py-1 text-sm font-medium transition"
                                                                    )}
                                                                >
                                                                    <ChildIcon
                                                                        aria-hidden="true"
                                                                        className="size-4 shrink-0"
                                                                    />
                                                                    <span className="truncate">
                                                                        {child.name}
                                                                    </span>
                                                                </Link>
                                                            );
                                                        })}
                                                    </div>

                                                    <div className="hidden md:absolute md:left-full md:top-0 md:z-10 md:ml-2 md:flex md:min-w-[12rem] md:flex-col md:gap-1 md:rounded-lg md:bg-gray-900 md:p-3 md:text-sm md:shadow-lg md:ring-1 md:ring-black/20 md:opacity-0 md:pointer-events-none md:transition md:duration-150 md:ease-out md:group-hover:pointer-events-auto md:group-hover:opacity-100 md:group-focus-within:pointer-events-auto md:group-focus-within:opacity-100">
                                                        {item.subnavigation?.map((child) => {
                                                            const ChildIcon =
                                                                child.icon
                                                                    ? iconMap[child.icon]
                                                                    : iconMap[
                                                                          fallbackIconKey
                                                                      ];
                                                            const childIsActive =
                                                                child.current ||
                                                                pathname ===
                                                                    child.href;

                                                            return (
                                                                <Link
                                                                    key={`${child.href}-popover`}
                                                                    href={child.href}
                                                                    className={classNames(
                                                                        childIsActive
                                                                            ? "bg-gray-800 text-white"
                                                                            : "text-gray-300 hover:bg-gray-800 hover:text-white",
                                                                        "flex items-center gap-x-2 rounded-md px-2 py-1 font-medium transition"
                                                                    )}
                                                                >
                                                                    <ChildIcon
                                                                        aria-hidden="true"
                                                                        className="size-4 shrink-0"
                                                                    />
                                                                    <span className="truncate">
                                                                        {child.name}
                                                                    </span>
                                                                </Link>
                                                            );
                                                        })}
                                                    </div>
                                                </>
                                            ) : null}
                                        </li>
                                    );
                                })}
                            </ul>
                        </li>
                        <li>
                            <div className="text-xs/6 font-semibold text-gray-400">
                                Your teams
                            </div>
                            <ul role="list" className="-mx-2 mt-2 space-y-1">
                                {teams.map((team) => (
                                    <li key={team.name}>
                                        <a
                                            href={team.href}
                                            className={classNames(
                                                team.current
                                                    ? "bg-gray-800 text-white"
                                                    : "text-gray-400 hover:bg-gray-800 hover:text-white",
                                                "group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold"
                                            )}
                                        >
                                            <span className="flex size-6 shrink-0 items-center justify-center rounded-lg border border-gray-700 bg-gray-800 text-[0.625rem] font-medium text-gray-400 group-hover:text-white">
                                                {team.initial}
                                            </span>
                                            <span className="truncate">
                                                {team.name}
                                            </span>
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </li>
                        <li className="mt-auto">
                            <Link
                                href="/admin"
                                className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold text-gray-400 hover:bg-gray-800 hover:text-white"
                            >
                                <AdjustmentsHorizontalIcon
                                    aria-hidden="true"
                                    className="size-6 shrink-0"
                                />
                                Admin
                            </Link>
                            <Link
                                href="/settings"
                                className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold text-gray-400 hover:bg-gray-800 hover:text-white"
                            >
                                <Cog6ToothIcon
                                    aria-hidden="true"
                                    className="size-6 shrink-0"
                                />
                                Settings
                            </Link>
                        </li>
                    </ul>
                </nav>
            </div>
        </>
    );
}
