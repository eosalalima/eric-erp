import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import React from "react";

export default function Breadcrumb({
    items,
}: {
    items: { name: string; href: string }[];
}) {
    return (
        <div>
            <nav aria-label="Back" className="sm:hidden">
                <a
                    href="#"
                    className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                    <ChevronLeftIcon
                        aria-hidden="true"
                        className="mr-1 -ml-1 size-5 shrink-0 text-gray-400"
                    />
                    Back
                </a>
            </nav>
            <nav aria-label="Breadcrumb" className="hidden sm:flex">
                <ol role="list" className="flex items-center space-x-4">
                    {items.map((item, index) => (
                        <React.Fragment key={index}>
                            {index > 0 && (
                                <ChevronRightIcon
                                    aria-hidden="true"
                                    className="size-5 shrink-0 text-gray-400"
                                />
                            )}
                            <li>
                                <div className="flex">
                                    <a
                                        href={item.href}
                                        className="text-sm font-medium text-gray-500 hover:text-gray-700"
                                    >
                                        {item.name}
                                    </a>
                                </div>
                            </li>
                        </React.Fragment>
                    ))}
                </ol>
            </nav>
        </div>
    );
}
