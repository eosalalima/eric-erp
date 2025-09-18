"use client";

import { useEffect, useState } from "react";
import Sidebar, { type NavigationItem } from "./Sidebar";
import SidebarDrawer from "./SidebarDrawer";
import Topbar from "./Topbar";
import { SignedIn } from "@clerk/nextjs";

export default function SidebarLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [navigation, setNavigation] = useState<NavigationItem[]>([]);

    const openDrawer = () => setIsDrawerOpen(true);
    const closeDrawer = () => setIsDrawerOpen(false);

    useEffect(() => {
        interface NavigationApiItem {
            navigationName: string;
            href: string;
            icon: NavigationItem["icon"];
            current: boolean;
            sortOrder: number;
        }

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
        <div className="min-h-screen flex bg-white text-black">
            <SignedIn>
                {/* Static Sidebar for Desktop */}
                <div className="hidden md:block w-64 border-r bg-gray-100">
                    <Sidebar navigation={navigation} />
                </div>

                {/* Dialog Sidebar for Mobile */}
                <SidebarDrawer isOpen={isDrawerOpen} onClose={closeDrawer}>
                    <Sidebar navigation={navigation} />
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
