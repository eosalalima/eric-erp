"use client";

import DataListView, { DataListColumn } from "@/components/shared/DataListView";

type FiscalYearPeriod = {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
};

const columns: DataListColumn<FiscalYearPeriod>[] = [
    { id: "name", header: "Period", field: "name" },
    { id: "startDate", header: "Start Date", field: "startDate" },
    { id: "endDate", header: "End Date", field: "endDate" },
];

const data: FiscalYearPeriod[] = [];

export default function FiscalYearPeriodsPage() {
    const handleAdd = () => {
        console.log("Add fiscal year period");
    };

    const handleEdit = (item: FiscalYearPeriod) => {
        console.log("Edit fiscal year period", item.id);
    };

    const handleDelete = (item: FiscalYearPeriod) => {
        console.log("Delete fiscal year period", item.id);
    };

    return (
        <div className="flex h-screen flex-col p-6">
            <div className="shrink-0">
                <h1 className="text-2xl font-semibold text-gray-900">
                    Fiscal Year Periods Settings
                </h1>
                <p className="mt-2 text-sm text-gray-600">
                    Manage your fiscal year periods here.
                </p>
            </div>
            <div className="mt-6 flex-1 overflow-hidden">
                <DataListView
                    columns={columns}
                    data={data}
                    onAdd={handleAdd}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    searchPlaceholder="Search fiscal year periods"
                />
            </div>
        </div>
    );
}
