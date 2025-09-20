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
import { useEffect, useState } from "react";

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

function classNames(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(" ");
}

interface SidebarProps {
    navigation: NavigationItem[];
}

export default function Sidebar({ navigation }: SidebarProps) {
    const pathname = usePathname();
    const [openItems, setOpenItems] = useState<Set<string>>(() => {
        const initial = new Set<string>();

        navigation.forEach((item) => {
            const hasChildren = (item.subnavigation?.length ?? 0) > 0;
            if (!hasChildren) {
                return;
            }

            const isActive =
                item.current ||
                pathname === item.href ||
                (item.subnavigation ?? []).some(
                    (child) => child.current || pathname === child.href
                );

            if (isActive) {
                initial.add(item.href);
            }
        });

        return initial;
    });

    useEffect(() => {
        setOpenItems((previous) => {
            const next = new Set(previous);

            navigation.forEach((item) => {
                const hasChildren = (item.subnavigation?.length ?? 0) > 0;
                if (!hasChildren) {
                    return;
                }

                const isActive =
                    item.current ||
                    pathname === item.href ||
                    (item.subnavigation ?? []).some(
                        (child) => child.current || pathname === child.href
                    );

                if (isActive) {
                    next.add(item.href);
                }
            });

            return next;
        });
    }, [navigation, pathname]);

    const toggleItem = (href: string) => {
        setOpenItems((previous) => {
            const next = new Set(previous);

            if (next.has(href)) {
                next.delete(href);
            } else {
                next.add(href);
            }

            return next;
        });
    };

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

                                    const isOpen =
                                        hasChildren && openItems.has(item.href);
                                    const popoverId = `${item.href}-popover`;
                                    const mobileListId = `${item.href}-mobile-list`;

                                    return (
                                        <li
                                            key={item.href}
                                            className={classNames(
                                                "relative",
                                                hasChildren
                                                    ? "group"
                                                    : undefined
                                            )}
                                        >
                                            <div className="relative">
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
                                                        "flex items-center gap-x-3 rounded-md p-2 pr-9 text-sm/6 font-semibold transition md:pr-2"
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
                                                            className={classNames(
                                                                "ml-auto hidden size-4 shrink-0 text-gray-500 transition md:block md:group-hover:text-white",
                                                                isOpen
                                                                    ? "md:rotate-90"
                                                                    : undefined
                                                            )}
                                                        />
                                                    ) : null}
                                                </Link>
                                                {hasChildren ? (
                                                    <button
                                                        type="button"
                                                        aria-controls={mobileListId}
                                                        aria-expanded={isOpen}
                                                        onClick={(event) => {
                                                            event.preventDefault();
                                                            event.stopPropagation();
                                                            toggleItem(item.href);
                                                        }}
                                                        className="absolute inset-y-0 right-2 flex items-center justify-center rounded-md p-1 text-gray-400 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:hidden"
                                                    >
                                                        <ChevronRightIcon
                                                            aria-hidden="true"
                                                            className={classNames(
                                                                "size-4 transition-transform",
                                                                isOpen
                                                                    ? "rotate-90"
                                                                    : "rotate-0"
                                                            )}
                                                        />
                                                        <span className="sr-only">
                                                            Toggle {item.name} navigation
                                                        </span>
                                                    </button>
                                                ) : null}
                                            </div>

                                            {hasChildren ? (
                                                <>
                                                    <div
                                                        id={popoverId}
                                                        className="hidden md:absolute md:left-full md:top-0 md:z-10 md:ml-2 md:flex md:min-w-[12rem] md:flex-col md:gap-1 md:rounded-lg md:bg-gray-900 md:p-3 md:text-sm md:shadow-lg md:ring-1 md:ring-black/20 md:opacity-0 md:pointer-events-none md:transition md:duration-150 md:ease-out md:group-hover:pointer-events-auto md:group-hover:opacity-100 md:group-focus-within:pointer-events-auto md:group-focus-within:opacity-100"
                                                    >
                                                        {item.subnavigation?.map(
                                                            (child) => {
                                                                const ChildIcon =
                                                                    child.icon
                                                                        ? iconMap[
                                                                              child
                                                                                  .icon
                                                                          ]
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
                                                                        href={
                                                                            child.href
                                                                        }
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
                                                                            {
                                                                                child.name
                                                                            }
                                                                        </span>
                                                                    </Link>
                                                                );
                                                            }
                                                        )}
                                                    </div>
                                                    <ul
                                                        id={mobileListId}
                                                        className={classNames(
                                                            "md:hidden",
                                                            isOpen
                                                                ? "mt-1 space-y-1 pl-9"
                                                                : "hidden"
                                                        )}
                                                    >
                                                        {item.subnavigation?.map(
                                                            (child) => {
                                                                const ChildIcon =
                                                                    child.icon
                                                                        ? iconMap[
                                                                              child.icon
                                                                          ]
                                                                        : iconMap[
                                                                              fallbackIconKey
                                                                          ];
                                                                const childIsActive =
                                                                    child.current ||
                                                                    pathname ===
                                                                        child.href;

                                                                return (
                                                                    <li
                                                                        key={`${child.href}-mobile`}
                                                                    >
                                                                        <Link
                                                                            href={
                                                                                child.href
                                                                            }
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
                                                                                {
                                                                                    child.name
                                                                                }
                                                                            </span>
                                                                        </Link>
                                                                    </li>
                                                                );
                                                            }
                                                        )}
                                                    </ul>
                                                </>
                                            ) : null}
                                        </li>
                                    );
                                })}
                            </ul>
                        </li>
                    </ul>
                </nav>
            </div>
        </>
    );
}
