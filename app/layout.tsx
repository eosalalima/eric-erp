"use client";

import {
    ClerkProvider,
    SignedIn,
    SignedOut,
    SignInButton,
    SignUpButton,
} from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import SidebarLayout from "@/components/layout/SidebarLayout";

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
    return (
        <ClerkProvider>
            <html lang="en">
                <body
                    className={`${geistSans.variable} ${geistMono.variable} antialiased`}
                >
                    <SignedOut>
                        <header className="flex justify-end items-center p-4 gap-4 h-16">
                            <SignInButton />
                            <SignUpButton>
                                <button className="bg-[#6c47ff] text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer">
                                    Sign Up
                                </button>
                            </SignUpButton>
                        </header>
                        <main>{children}</main>
                    </SignedOut>

                    <SignedIn>
                        <SidebarLayout>
                            <main>{children}</main>
                        </SidebarLayout>
                    </SignedIn>
                </body>
            </html>
        </ClerkProvider>
    );
}
