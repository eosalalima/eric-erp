"use client";

import { useEffect, useState } from "react";
import Sidebar, { type NavigationItem } from "./Sidebar";
import SidebarDrawer from "./SidebarDrawer";
import Topbar from "./Topbar";
import { SignedIn } from "@clerk/nextjs";

// Mapping of applicationId to route
const applicationRouteTable: { applicationId: number; route: string }[] = [
    { applicationId: 1, route: "/" },
    { applicationId: 2, route: "/modules/finance-accounting" },
    { applicationId: 3, route: "/modules/human-resource" },
    { applicationId: 4, route: "/modules/supply-chain" },
    { applicationId: 5, route: "/modules/customer-relationship" },
    { applicationId: 6, route: "/modules/sales-distribution" },
    { applicationId: 7, route: "/modules/project-management" },
    { applicationId: 8, route: "/modules/business-intelligence" },
    { applicationId: 9, route: "/modules/compliance-risk" },
    { applicationId: 10, route: "/modules/ecommerce-customer-portal" },
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
    const [applicationId, setApplicationId] = useState<number | null>(null);

    useEffect(() => {
        setCurrentRoute(window.location.pathname);
    }, []);

    console.log("Current Route:", currentRoute);

    useEffect(() => {
        if (!currentRoute) {
            return;
        }

        let newApplicationId: number | null = null;

        if (currentRoute === "/") {
            newApplicationId = 1; // Example applicationId for home page
        } else {
            // Match the first two levels of the route (e.g., /modules/finance-accounting)
            const firstTwoLevels = currentRoute
                .split("/")
                .slice(0, 3)
                .join("/");
            const matchedApplication = applicationRouteTable.find(
                (entry) => entry.route === firstTwoLevels
            );
            newApplicationId = matchedApplication
                ? matchedApplication.applicationId
                : 1;
        }

        if (newApplicationId !== applicationId) {
            setApplicationId(newApplicationId);
            console.log("Set Application ID to:", newApplicationId);
        }
    }, [currentRoute, applicationId]);

    useEffect(() => {
        if (applicationId === null) {
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
                const response = await fetch(
                    `/api/navigation?applicationId=${applicationId}`
                );

                if (!response.ok) {
                    console.error(
                        "Failed to fetch navigation for application:",
                        applicationId,
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
                        "Failed to parse navigation response for application:",
                        applicationId,
                        error
                    );
                    setNavigation([]);
                    return;
                }

                if (!Array.isArray(parsed)) {
                    console.error(
                        "Navigation response is not an array for application:",
                        applicationId
                    );
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
                console.error(
                    "Error fetching navigation for application:",
                    applicationId,
                    error
                );
                setNavigation([]);
            }
        };

        fetchNavigation();
    }, [applicationId]);

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
