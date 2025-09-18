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
    ChatBubbleLeftRightIcon,
    ChatBubbleOvalLeftEllipsisIcon,
    CheckCircleIcon,
    ClipboardDocumentCheckIcon,
    ClipboardDocumentListIcon,
    CogIcon,
    Cog6ToothIcon,
    Cog8ToothIcon,
    ComputerDesktopIcon,
    CurrencyDollarIcon,
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
    QuestionMarkCircleIcon,
    ShoppingCartIcon,
    StarIcon,
    UserCircleIcon,
    UserGroupIcon,
    UserPlusIcon,
    UsersIcon,
    WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";

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
    CurrencyDollarIcon,
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
    QuestionMarkCircleIcon,
    ShoppingCartIcon,
    StarIcon,
    UserCircleIcon,
    UserGroupIcon,
    UserPlusIcon,
    UsersIcon,
    WrenchScrewdriverIcon,
};

interface NavigationItem {
    name: string;
    href: string;
    icon: keyof typeof iconMap;
    current: boolean;
}

interface NavigationApiItem {
    navigationName: string;
    href: string;
    icon: keyof typeof iconMap;
    current: boolean;
    sortOrder: number;
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

export default function Sidebar() {
    const pathname = usePathname();
    const [navigation, setNavigation] = useState<NavigationItem[]>([]);

    useEffect(() => {
        const fetchNavigation = async () => {
            try {
                const response = await fetch("/api/navigation");

                if (!response.ok) {
                    console.error(
                        "Failed to fetch navigation:",
                        response.status,
                        response.statusText
                    );
                    setNavigation([]);
                    return;
                }

                const body = await response.text();

                if (!body) {
                    setNavigation([]);
                    return;
                }

                let parsed: unknown;

                try {
                    parsed = JSON.parse(body);
                } catch (error) {
                    console.error(
                        "Failed to parse navigation response:",
                        error
                    );
                    setNavigation([]);
                    return;
                }

                if (!Array.isArray(parsed)) {
                    console.error("Navigation response is not an array");
                    setNavigation([]);
                    return;
                }

                const data = parsed as NavigationApiItem[];

                const sorted = [...data].sort(
                    (a, b) => a.sortOrder - b.sortOrder
                );

                setNavigation(
                    sorted.map((item) => ({
                        name: item.navigationName,
                        href: item.href,
                        icon: item.icon,
                        current: item.current,
                    }))
                );
            } catch (error) {
                console.error("Error fetching navigation:", error);
                setNavigation([]);
            }
        };

        fetchNavigation();
    }, []);

    return (
        <>
            {/* Sidebar component, swap this element with another sidebar if you like */}
            <div className="fixed flex flex-col h-full w-64 gap-y-5 overflow-y-auto bg-gray-900 px-6 pb-4 ring-1 ring-white/10">
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
                                {navigation.map((item) => (
                                    <li key={item.href}>
                                        <Link
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            href={item.href}
                                            className={classNames(
                                                pathname === item.href
                                                    ? "bg-gray-800 text-white"
                                                    : "text-gray-400 hover:bg-gray-800 hover:text-white",
                                                "group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold"
                                            )}
                                        >
                                            {(() => {
                                                const Icon =
                                                    iconMap[item.icon] ??
                                                    HomeIcon;
                                                return (
                                                    <Icon
                                                        aria-hidden="true"
                                                        className="size-6 shrink-0"
                                                    />
                                                );
                                            })()}
                                            {item.name}
                                        </Link>
                                    </li>
                                ))}
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
