import { Bars3Icon } from "@heroicons/react/24/outline";

type SidebarToggleProps = {
    onClick: () => void;
};

export default function SidebarToggle({ onClick }: SidebarToggleProps) {
    return (
        <>
            <button
                type="button"
                onClick={onClick}
                className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            >
                <span className="sr-only">Open sidebar</span>
                <Bars3Icon aria-hidden="true" className="size-6" />
            </button>
        </>
    );
}
