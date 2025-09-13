"use client";

import { useState } from "react";
import {
    ClerkProvider,
    SignedIn,
    SignedOut,
    SignInButton,
    SignUpButton,
    UserButton,
} from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import SidebarDrawer from "@/components/layout/SidebarDrawer";
import Topbar from "@/components/layout/Topbar";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const openDrawer = () => setIsDrawerOpen(true);
    const closeDrawer = () => setIsDrawerOpen(false);

    return (
        <ClerkProvider>
            <html lang="en">
                <body
                    className={`${geistSans.variable} ${geistMono.variable} antialiased`}
                >
                    {/* <header className="flex justify-end items-center p-4 gap-4 h-16">
                        <SignedOut>
                            <SignInButton />
                            <SignUpButton>
                                <button className="bg-[#6c47ff] text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer">
                                    Sign Up
                                </button>
                            </SignUpButton>
                        </SignedOut>
                        <SignedIn>
                            <UserButton />
                        </SignedIn>
                    </header> */}

                    <div className="min-h-screen flex bg-white text-black">
                        <SignedIn>
                            {/* Static Sidebar for Desktop */}
                            <div className="hidden md:block w-64 border-r bg-gray-100">
                                <Sidebar />
                            </div>

                            {/* Dialog Sidebar for Mobile */}
                            <SidebarDrawer
                                isOpen={isDrawerOpen}
                                onClose={closeDrawer}
                            >
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

                    <main>{children}</main>
                </body>
            </html>
        </ClerkProvider>
    );
}
