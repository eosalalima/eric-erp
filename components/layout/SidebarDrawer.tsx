"use client";

import {
    Dialog,
    DialogPanel,
    Transition,
    TransitionChild,
} from "@headlessui/react";
import { Fragment } from "react";

type SidebarDrawerProps = {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
};

export default function SidebarDrawer({
    isOpen,
    onClose,
    children,
}: SidebarDrawerProps) {
    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog
                as="div"
                className="relative z-50 md:hidden"
                onClose={onClose}
            >
                {/* Overlay */}
                <TransitionChild
                    as={Fragment}
                    enter="transition-opacity ease-out duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="transition-opacity ease-in duration-150"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/40" />
                </TransitionChild>

                {/* Sidebar Panel */}
                <TransitionChild
                    as={Fragment}
                    enter="transition ease-in-out duration-300 transform"
                    enterFrom="-translate-x-full"
                    enterTo="translate-x-0"
                    leave="transition ease-in-out duration-200 transform"
                    leaveFrom="translate-x-0"
                    leaveTo="-translate-x-full"
                >
                    <div className="fixed inset-0 flex">
                        <DialogPanel className="relative top-0 left-0 h-full w-64 bg-white shadow-lg">
                            <div className="absolute top-4 right-4 flex justify-end">
                                <button
                                    onClick={onClose}
                                    className="text-gray-500 hover:text-black"
                                >
                                    ✕
                                </button>
                            </div>
                            {children}
                        </DialogPanel>
                    </div>
                </TransitionChild>
            </Dialog>
        </Transition>
    );
}
