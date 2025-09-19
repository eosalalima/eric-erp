"use client";

import { useEffect, useState } from "react";
import Sidebar, { type NavigationItem } from "./Sidebar";
import SidebarDrawer from "./SidebarDrawer";
import Topbar from "./Topbar";
import { SignedIn } from "@clerk/nextjs";

// Mapping of roleId to route
const roleRouteTable: { roleId: number; route: string }[] = [
    { roleId: 1, route: "/" },
    { roleId: 2, route: "/modules/finance-accounting" }, 
    { roleId: 3, route: "/modules/human-resource" },
    // Add more mappings as needed
];

export default function SidebarLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [navigation, setNavigation] = useState<NavigationItem[]>([]);

    const openDrawer = () => setIsDrawerOpen(true);
    const closeDrawer = () => setIsDrawerOpen(false);

    // Get the current route
    const [currentRoute, setCurrentRoute] = useState<string>("");
    const [roleId, setRoleId] = useState<number | null>(null);  

    useEffect(() => {
        setCurrentRoute(window.location.pathname);
    }, []);

    console.log("Current Route:", currentRoute);

    useEffect(() => {
        if (!currentRoute) {
            return;
        }

        let newRole: number | null = null;

        if (currentRoute === "/") {
            newRole = 1; // Example roleId for home page
        } else {
            // Match the first two levels of the route (e.g., /modules/finance-accounting)
            const firstTwoLevels = currentRoute.split("/").slice(0, 3).join("/");
            const matchedRole = roleRouteTable.find(
                (entry) => entry.route === firstTwoLevels
            );
            newRole = matchedRole ? matchedRole.roleId : 1;
        }

        if (newRole !== roleId) {
            setRoleId(newRole);
            console.log("Set Role ID to:", newRole);
        }
    }, [currentRoute, roleId]);

    useEffect(() => {
        if (roleId === null) {
            return;
        }

        interface NavigationApiItem {
            navigationName: string;
            href: string;
            icon: NavigationItem["icon"];
            current: boolean;
            sortOrder: number;
        }

        const fetchNavigation = async () => {
            try {
                const response = await fetch(`/api/navigation?roleId=${roleId}`);

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
    }, [roleId]);

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
