import Breadcrumb from "@/components/layout/Breadcrumb";
import PageHeader from "@/components/layout/PageHeader";
import { RedirectToSignIn, SignedIn, SignedOut } from "@clerk/nextjs";

const breadcrumbItems = [
    { name: "Home", href: "/modules/finance-accounting" },
    { name: "Dashboard", href: "/modules/finance-accounting/dashboard" },
];

export default function FinanceDashboardPage() {
    const kpis = [
        {
            label: "Monthly Revenue",
            value: "$1.2M",
            delta: "+8.4%",
            trend: "vs. last month",
        },
        {
            label: "Gross Margin",
            value: "58.2%",
            delta: "+1.2pts",
            trend: "improvement",
        },
        {
            label: "Operating Income",
            value: "$320K",
            delta: "+6.1%",
            trend: "vs. plan",
        },
        {
            label: "Cash on Hand",
            value: "$2.8M",
            delta: "-3.4%",
            trend: "vs. last month",
        },
    ];

    const revenueTrend = [
        { month: "Jan", revenue: 920000, expense: 610000 },
        { month: "Feb", revenue: 980000, expense: 640000 },
        { month: "Mar", revenue: 1030000, expense: 670000 },
        { month: "Apr", revenue: 1080000, expense: 690000 },
        { month: "May", revenue: 1140000, expense: 710000 },
        { month: "Jun", revenue: 1200000, expense: 735000 },
    ];

    const cashFlow = [
        { label: "Operating", inflow: 480000, outflow: 310000 },
        { label: "Investing", inflow: 45000, outflow: 95000 },
        { label: "Financing", inflow: 120000, outflow: 60000 },
    ];

    const receivableAging = [
        { bucket: "Current", amount: 450000 },
        { bucket: "1-30 days", amount: 180000 },
        { bucket: "31-60 days", amount: 90000 },
        { bucket: "61-90 days", amount: 45000 },
        { bucket: "> 90 days", amount: 28000 },
    ];

    const payableAging = [
        { bucket: "Current", amount: 320000 },
        { bucket: "1-30 days", amount: 140000 },
        { bucket: "31-60 days", amount: 78000 },
        { bucket: "61-90 days", amount: 52000 },
        { bucket: "> 90 days", amount: 17000 },
    ];

    const profitAndLoss = [
        { category: "Revenue", amount: 1200000 },
        { category: "Cost of Goods Sold", amount: -502000 },
        { category: "Operating Expenses", amount: -368000 },
        { category: "Net Income", amount: 330000 },
    ];

    const costCenters = [
        { name: "R&D", spend: 145000, change: "+6.7%" },
        { name: "Sales", spend: 132000, change: "+3.2%" },
        { name: "Customer Success", spend: 98000, change: "-1.8%" },
        { name: "Operations", spend: 87000, change: "+4.1%" },
    ];

    const insights = [
        {
            title: "Renewal bookings trending above target",
            description:
                "Pipeline conversion has increased 12% month-over-month.",
            severity: "positive",
        },
        {
            title: "Overdue invoices up 9%",
            description:
                "Follow up with top three enterprise accounts to accelerate payments.",
            severity: "warning",
        },
        {
            title: "Capital expenditures pacing slower",
            description:
                "Only 42% of the quarterly facilities budget has been deployed.",
            severity: "neutral",
        },
    ];

    const overdueInvoices = [
        {
            customer: "Acme Manufacturing",
            amount: "$42,300",
            aging: "58 days",
            owner: "Kelly Price",
        },
        {
            customer: "Northwind Logistics",
            amount: "$31,850",
            aging: "44 days",
            owner: "Dustin James",
        },
        {
            customer: "Blue Harbor Co.",
            amount: "$27,125",
            aging: "37 days",
            owner: "Lara Patel",
        },
    ];

    const forecastCallouts = [
        {
            label: "Q3 Revenue",
            value: "$3.5M",
            detail: "On track to exceed target by 4.6% with two large deals pending.",
        },
        {
            label: "Operating Cash",
            value: "$2.1M",
            detail: "Projected dip in August as inventory receipts accelerate.",
        },
    ];

    const maxRevenue = Math.max(...revenueTrend.map((item) => item.revenue));
    const maxCash = Math.max(...cashFlow.map((item) => item.inflow));

    return (
        <>
            <SignedIn>
                <div className="space-y-8 bg-slate-50 p-6 sm:p-8 lg:p-10">
                    <div>
                        <Breadcrumb items={breadcrumbItems} />
                        <PageHeader title="Finance & Accounting Dashboard" />
                        <p className="mt-2 max-w-3xl text-sm text-gray-600">
                            Monitor the latest performance across revenue,
                            profitability, cash, and working capital to stay
                            ahead of forecast and compliance targets.
                        </p>
                    </div>

                    <section
                        aria-labelledby="kpi-heading"
                        className="space-y-4"
                    >
                        <h3
                            id="kpi-heading"
                            className="text-base font-semibold text-gray-900"
                        >
                            Key performance indicators
                        </h3>
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            {kpis.map((kpi) => (
                                <div
                                    key={kpi.label}
                                    className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
                                >
                                    <div>
                                        <p className="text-sm font-medium text-slate-500">
                                            {kpi.label}
                                        </p>
                                        <p className="mt-2 text-2xl font-semibold text-slate-900">
                                            {kpi.value}
                                        </p>
                                    </div>
                                    <p
                                        className={`mt-3 text-sm font-medium ${
                                            kpi.delta.startsWith("-")
                                                ? "text-rose-600"
                                                : "text-emerald-600"
                                        }`}
                                    >
                                        {kpi.delta} {kpi.trend}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section
                        aria-labelledby="trend-heading"
                        className="grid gap-6 xl:grid-cols-2"
                    >
                        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div>
                                <h3
                                    id="trend-heading"
                                    className="text-base font-semibold text-gray-900"
                                >
                                    Revenue vs. expense trend
                                </h3>
                                <p className="mt-1 text-sm text-gray-600">
                                    Rolling six-month comparison of revenue
                                    recognized against operating expenses.
                                </p>
                            </div>
                            <div className="space-y-3" role="list">
                                {revenueTrend.map((item) => (
                                    <div
                                        key={item.month}
                                        className="space-y-1"
                                        role="listitem"
                                    >
                                        <div className="flex items-center justify-between text-sm font-medium text-slate-700">
                                            <span>{item.month}</span>
                                            <span>
                                                <span className="text-emerald-600">
                                                    $
                                                    {item.revenue.toLocaleString()}
                                                </span>{" "}
                                                <span className="text-slate-400">
                                                    /
                                                </span>{" "}
                                                <span className="text-rose-600">
                                                    $
                                                    {item.expense.toLocaleString()}
                                                </span>
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 flex-1 rounded-full bg-emerald-100">
                                                <div
                                                    className="h-2 rounded-full bg-emerald-500"
                                                    style={{
                                                        width: `${
                                                            (item.revenue /
                                                                maxRevenue) *
                                                            100
                                                        }%`,
                                                    }}
                                                />
                                            </div>
                                            <div className="h-2 flex-1 rounded-full bg-rose-100">
                                                <div
                                                    className="h-2 rounded-full bg-rose-500"
                                                    style={{
                                                        width: `${
                                                            (item.expense /
                                                                maxRevenue) *
                                                            100
                                                        }%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div>
                                <h3 className="text-base font-semibold text-gray-900">
                                    Cash flow snapshot
                                </h3>
                                <p className="mt-1 text-sm text-gray-600">
                                    Compare inflows and outflows across
                                    operating, investing, and financing
                                    activities.
                                </p>
                            </div>
                            <div className="space-y-4">
                                {cashFlow.map((bucket) => {
                                    const net = bucket.inflow - bucket.outflow;
                                    const netColor =
                                        net >= 0
                                            ? "text-emerald-600"
                                            : "text-rose-600";
                                    return (
                                        <div
                                            key={bucket.label}
                                            className="space-y-2"
                                        >
                                            <div className="flex items-center justify-between text-sm font-medium text-slate-700">
                                                <span>{bucket.label}</span>
                                                <span>
                                                    <span className="text-emerald-600">
                                                        $
                                                        {bucket.inflow.toLocaleString()}
                                                    </span>{" "}
                                                    <span className="text-slate-400">
                                                        /
                                                    </span>{" "}
                                                    <span className="text-rose-600">
                                                        $
                                                        {bucket.outflow.toLocaleString()}
                                                    </span>
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex flex-1 items-center gap-2">
                                                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-emerald-100">
                                                        <div
                                                            aria-hidden="true"
                                                            className="h-full rounded-full bg-emerald-500"
                                                            style={{
                                                                width: `${
                                                                    (bucket.inflow /
                                                                        maxCash) *
                                                                    100
                                                                }%`,
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-rose-100">
                                                        <div
                                                            aria-hidden="true"
                                                            className="h-full rounded-full bg-rose-500"
                                                            style={{
                                                                width: `${
                                                                    (bucket.outflow /
                                                                        maxCash) *
                                                                    100
                                                                }%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                                <span
                                                    className={`text-sm font-semibold ${netColor}`}
                                                >
                                                    {net >= 0 ? "+" : "-"}$
                                                    {Math.abs(
                                                        net
                                                    ).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>

                    <section
                        aria-labelledby="working-capital-heading"
                        className="grid gap-6 xl:grid-cols-2"
                    >
                        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div>
                                <h3
                                    id="working-capital-heading"
                                    className="text-base font-semibold text-gray-900"
                                >
                                    Receivables aging
                                </h3>
                                <p className="mt-1 text-sm text-gray-600">
                                    Outstanding customer balances by aging
                                    bucket.
                                </p>
                            </div>
                            <dl className="grid gap-3 sm:grid-cols-2">
                                {receivableAging.map((item) => (
                                    <div
                                        key={item.bucket}
                                        className="rounded-lg bg-emerald-50 p-4"
                                    >
                                        <dt className="text-sm font-medium text-emerald-900">
                                            {item.bucket}
                                        </dt>
                                        <dd className="mt-2 text-xl font-semibold text-emerald-700">
                                            ${item.amount.toLocaleString()}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div>
                                <h3 className="text-base font-semibold text-gray-900">
                                    Payables aging
                                </h3>
                                <p className="mt-1 text-sm text-gray-600">
                                    Vendor obligations prioritized for cash
                                    planning.
                                </p>
                            </div>
                            <dl className="grid gap-3 sm:grid-cols-2">
                                {payableAging.map((item) => (
                                    <div
                                        key={item.bucket}
                                        className="rounded-lg bg-slate-100 p-4"
                                    >
                                        <dt className="text-sm font-medium text-slate-800">
                                            {item.bucket}
                                        </dt>
                                        <dd className="mt-2 text-xl font-semibold text-slate-700">
                                            ${item.amount.toLocaleString()}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    </section>

                    <section
                        aria-labelledby="pl-heading"
                        className="grid gap-6 xl:grid-cols-2"
                    >
                        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div>
                                <h3
                                    id="pl-heading"
                                    className="text-base font-semibold text-gray-900"
                                >
                                    Profit &amp; loss summary
                                </h3>
                                <p className="mt-1 text-sm text-gray-600">
                                    High-level performance for the current
                                    fiscal period.
                                </p>
                            </div>
                            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                                <thead>
                                    <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        <th scope="col" className="py-2">
                                            Category
                                        </th>
                                        <th
                                            scope="col"
                                            className="py-2 text-right"
                                        >
                                            Amount
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {profitAndLoss.map((row) => (
                                        <tr key={row.category}>
                                            <th
                                                scope="row"
                                                className="py-3 text-sm font-medium text-slate-700"
                                            >
                                                {row.category}
                                            </th>
                                            <td className="py-3 text-right text-sm font-semibold text-slate-900">
                                                {row.amount < 0 ? "-" : ""}$
                                                {Math.abs(
                                                    row.amount
                                                ).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div>
                                <h3 className="text-base font-semibold text-gray-900">
                                    Top cost centers
                                </h3>
                                <p className="mt-1 text-sm text-gray-600">
                                    Track spending hotspots and shifts from the
                                    prior month.
                                </p>
                            </div>
                            <ul className="space-y-3">
                                {costCenters.map((center) => (
                                    <li
                                        key={center.name}
                                        className="flex items-center justify-between rounded-lg bg-slate-50 p-4"
                                    >
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">
                                                {center.name}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                Change {center.change}
                                            </p>
                                        </div>
                                        <p className="text-lg font-semibold text-slate-800">
                                            ${center.spend.toLocaleString()}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </section>

                    <section
                        aria-labelledby="collections-heading"
                        className="grid gap-6 xl:grid-cols-2"
                    >
                        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div>
                                <h3
                                    id="collections-heading"
                                    className="text-base font-semibold text-gray-900"
                                >
                                    Overdue invoices
                                </h3>
                                <p className="mt-1 text-sm text-gray-600">
                                    Focus collection efforts on the longest
                                    outstanding balances.
                                </p>
                            </div>
                            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                                <thead>
                                    <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        <th scope="col" className="py-2">
                                            Customer
                                        </th>
                                        <th scope="col" className="py-2">
                                            Owner
                                        </th>
                                        <th
                                            scope="col"
                                            className="py-2 text-right"
                                        >
                                            Amount
                                        </th>
                                        <th
                                            scope="col"
                                            className="py-2 text-right"
                                        >
                                            Aging
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {overdueInvoices.map((invoice) => (
                                        <tr key={invoice.customer}>
                                            <th
                                                scope="row"
                                                className="py-3 text-sm font-medium text-slate-700"
                                            >
                                                {invoice.customer}
                                            </th>
                                            <td className="py-3 text-sm text-slate-600">
                                                {invoice.owner}
                                            </td>
                                            <td className="py-3 text-right text-sm font-semibold text-slate-900">
                                                {invoice.amount}
                                            </td>
                                            <td className="py-3 text-right text-sm text-slate-600">
                                                {invoice.aging}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div>
                                <h3 className="text-base font-semibold text-gray-900">
                                    Forecast callouts
                                </h3>
                                <p className="mt-1 text-sm text-gray-600">
                                    Key updates flagged by FP&amp;A for
                                    executive review.
                                </p>
                            </div>
                            <ul className="space-y-3">
                                {forecastCallouts.map((callout) => (
                                    <li
                                        key={callout.label}
                                        className="rounded-lg border border-slate-100 bg-slate-50 p-4"
                                    >
                                        <p className="text-sm font-semibold text-slate-900">
                                            {callout.label}
                                        </p>
                                        <p className="mt-1 text-lg font-bold text-slate-800">
                                            {callout.value}
                                        </p>
                                        <p className="mt-1 text-sm text-slate-600">
                                            {callout.detail}
                                        </p>
                                    </li>
                                ))}
                            </ul>

                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold text-slate-900">
                                    Insights &amp; alerts
                                </h4>
                                <ul className="space-y-2">
                                    {insights.map((insight) => {
                                        const severityStyles = {
                                            positive:
                                                "border-emerald-200 bg-emerald-50 text-emerald-900",
                                            warning:
                                                "border-amber-200 bg-amber-50 text-amber-900",
                                            neutral:
                                                "border-slate-200 bg-slate-50 text-slate-900",
                                        } as const;
                                        type Severity =
                                            keyof typeof severityStyles;
                                        return (
                                            <li
                                                key={insight.title}
                                                className={`rounded-lg border p-4 text-sm ${
                                                    severityStyles[
                                                        insight.severity as Severity
                                                    ]
                                                }`}
                                            >
                                                <p className="font-semibold">
                                                    {insight.title}
                                                </p>
                                                <p className="mt-1 text-xs leading-5 text-current">
                                                    {insight.description}
                                                </p>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        </div>
                    </section>
                </div>
            </SignedIn>
            <SignedOut>
                <RedirectToSignIn redirectUrl="/signin" />
            </SignedOut>
        </>
    );
}
