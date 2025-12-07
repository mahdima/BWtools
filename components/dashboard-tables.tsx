import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const topProducts = [
    {
        id: "PROD-001",
        name: "Wireless Mouse",
        category: "Electronics",
        sales: 1200,
    },
    {
        id: "PROD-002",
        name: "Mechanical Keyboard",
        category: "Electronics",
        sales: 950,
    },
    {
        id: "PROD-003",
        name: "Gaming Monitor",
        category: "Electronics",
        sales: 850,
    },
    {
        id: "PROD-004",
        name: "Office Chair",
        category: "Furniture",
        sales: 700,
    },
    {
        id: "PROD-005",
        name: "Desk Lamp",
        category: "Furniture",
        sales: 600,
    },
];

const topCustomers = [
    {
        name: "Alice Smith",
        phone: "+1 555-0101",
    },
    {
        name: "Bob Johnson",
        phone: "+1 555-0102",
    },
    {
        name: "Charlie Brown",
        phone: "+1 555-0103",
    },
    {
        name: "Diana Prince",
        phone: "+1 555-0104",
    },
    {
        name: "Evan Wright",
        phone: "+1 555-0105",
    },
];

const recentOrders = [
    {
        id: "ORD-001",
        product: "Wireless Mouse",
        price: "$25.00",
        status: "Delivered",
    },
    {
        id: "ORD-002",
        product: "Mechanical Keyboard",
        price: "$120.00",
        status: "Processing",
    },
    {
        id: "ORD-003",
        product: "Gaming Monitor",
        price: "$300.00",
        status: "Shipped",
    },
    {
        id: "ORD-004",
        product: "Office Chair",
        price: "$150.00",
        status: "Delivered",
    },
    {
        id: "ORD-005",
        product: "Desk Lamp",
        price: "$40.00",
        status: "Pending",
    },
];

export function DashboardTables() {
    return (
        <div className="w-[94%] mx-auto grid gap-8 mt-4">
            <div className="grid gap-8 md:grid-cols-2">
                {/* Top Selling Products */}
                <div className="rounded-xl border bg-card text-card-foreground shadow">
                    <div className="p-3 pb-2">
                        <h3 className="tracking-tight text-xl font-medium">
                            Top 5 Selling Products
                        </h3>
                    </div>
                    <div className="p-3 pt-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Product Name</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Total Sales</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {topProducts.map((product) => (
                                    <TableRow key={product.id}>
                                        <TableCell>{product.id}</TableCell>
                                        <TableCell>{product.name}</TableCell>
                                        <TableCell>{product.category}</TableCell>
                                        <TableCell>{product.sales}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Top Customers */}
                <div className="rounded-xl border bg-card text-card-foreground shadow">
                    <div className="p-3 pb-2">
                        <h3 className="tracking-tight text-xl font-medium">
                            Top 5 Customers
                        </h3>
                    </div>
                    <div className="p-3 pt-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Phone</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {topCustomers.map((customer) => (
                                    <TableRow key={customer.name}>
                                        <TableCell>{customer.name}</TableCell>
                                        <TableCell>{customer.phone}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>

            {/* Recent Orders */}
            <div className="rounded-xl border bg-card text-card-foreground shadow w-[50%] ">
                <div className="p-3 pb-2">
                    <h3 className="tracking-tight text-xl font-medium">Recent Orders</h3>
                </div>
                <div className="p-3 pt-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Product Name</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentOrders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell>{order.id}</TableCell>
                                    <TableCell>{order.product}</TableCell>
                                    <TableCell>{order.price}</TableCell>
                                    <TableCell>{order.status}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
