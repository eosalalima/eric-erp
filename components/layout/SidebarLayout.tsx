"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import SidebarDrawer from "./SidebarDrawer";
import Topbar from "./Topbar";
import { SignedIn } from "@clerk/nextjs";

export default function SidebarLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const openDrawer = () => setIsDrawerOpen(true);
    const closeDrawer = () => setIsDrawerOpen(false);

    return (
        <div className="min-h-screen flex bg-white text-black">
            <SignedIn>
                {/* Static Sidebar for Desktop */}
                <div className="hidden md:block w-64 border-r bg-gray-100">
                    <Sidebar />
                </div>

                {/* Dialog Sidebar for Mobile */}
                <SidebarDrawer isOpen={isDrawerOpen} onClose={closeDrawer}>
                    <Sidebar />
                </SidebarDrawer>
            </SignedIn>

            {/* Main Content Area */}
            <div className="flex-1 relative z-0">
                {/* Toggle Button - only on mobile */}
                <SignedIn>
                    <Topbar onOpenSidebar={openDrawer} />
                </SignedIn>
                <main>{children}</main>
            </div>
        </div>
    );
}
