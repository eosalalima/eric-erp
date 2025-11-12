import Image from "next/image";
import Link from "next/link";

export default function FinanceAccountingPage() {
    return (
        <div className="overflow-hidden bg-white py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-2 lg:items-start">
                    <div className="lg:pr-4 lg:pt-4">
                        <div className="lg:max-w-lg">
                            <h2 className="text-base/7 font-semibold text-indigo-600">
                                Drive Profitability
                            </h2>
                            <p className="mt-2 text-pretty text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
                                Finance & Accounting
                            </p>
                            <p className="mt-6 text-lg/8 text-gray-700">
                                Keep your business finances accurate, compliant,
                                and transparent with a centralized Finance &
                                Accounting module. From recording transactions
                                to generating real-time reports, this module
                                empowers your team to streamline financial
                                processes, improve decision-making, and ensure
                                regulatory compliance.
                            </p>
                            <div className="mt-8">
                                <Link
                                    href="/modules/finance-accounting/dashboard"
                                    className="inline-flex rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                >
                                    Get started
                                </Link>
                            </div>
                            <figure className="mt-16 border-l border-gray-200 pl-8 text-gray-700">
                                <blockquote className="text-base/7">
                                    <p>
                                        “Beware of little expenses; a small leak
                                        will sink a great ship.”
                                    </p>
                                </blockquote>
                                <figcaption className="mt-6 flex gap-x-4 text-sm/6">
                                    <div>
                                        <span className="font-semibold text-gray-900">
                                            Benjamin Franklin
                                        </span>{" "}
                                        –{" "}
                                        <span className="text-gray-600">
                                            American polymath
                                        </span>
                                    </div>
                                </figcaption>
                            </figure>
                        </div>
                    </div>
                    <Image
                        alt="Product screenshot"
                        src="/images/finance-accounting-banner.png"
                        width={2432}
                        height={1442}
                        className="w-[48rem] max-w-none rounded-xl shadow-xl ring-1 ring-gray-400/10 sm:w-[57rem] md:-ml-4 lg:ml-0"
                    />
                </div>
            </div>
        </div>
    );
}
