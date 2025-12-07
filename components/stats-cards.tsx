import { Package, ShoppingCart, Truck, Users } from "lucide-react";

const stats = [
    {
        title: "Total Product",
        value: "120",
        icon: Package,
        description: "+10% from last month",
    },
    {
        title: "Total Orders",
        value: "250",
        icon: ShoppingCart,
        description: "+20% from last month",
    },
    {
        title: "Order Delivered",
        value: "230",
        icon: Truck,
        description: "+15% from last month",
    },
    {
        title: "Total Customers",
        value: "450",
        icon: Users,
        description: "+5% from last month",
    },
];

export function StatsCards() {
    return (
        <div className="w-[94%] mt-[30px] mx-auto grid gap-12 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
                <div
                    key={stat.title}
                    className="rounded-xl border bg-[#D8FAE7] text-black shadow p-4"
                >
                    <div className="flex flex-row items-center justify-between space-y-1 pb-2">
                        <h3 className="tracking-tight text-xl font-medium">
                            {stat.title}
                        </h3>
                        <stat.icon className="h-6 w-6 text-[#0B1DFF]" />
                    </div>
                    <div className="pt-0">
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <p className="text-sm text-black">
                            {stat.description}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}
