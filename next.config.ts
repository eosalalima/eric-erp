import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    pageExtensions: ["mdx", "md", "jsx", "js", "tsx", "ts"],

    images: {
        domains: [
            "plus.unsplash.com",
            "images.unsplash.com",
            "res.cloudinary.com",
            "cdn.pixabay.com",
            "images.pexels.com",
            "tailwindcss.com",
            "randomuser.me",
        ],
    },
};

export default nextConfig;
