import React from "react";
import { DataTable } from "@/components/data-table";
import { columns, Customer } from "./columns";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

async function getData(): Promise<Customer[]> {
    return [
        { id: "CUST-001", name: "Alice Smith", email: "alice@example.com", phone: "+1 555-0101" },
        { id: "CUST-002", name: "Bob Johnson", email: "bob@example.com", phone: "+1 555-0102" },
        { id: "CUST-003", name: "Charlie Brown", email: "charlie@example.com", phone: "+1 555-0103" },
        { id: "CUST-004", name: "Diana Prince", email: "diana@example.com", phone: "+1 555-0104" },
        { id: "CUST-005", name: "Evan Wright", email: "evan@example.com", phone: "+1 555-0105" },
        { id: "CUST-006", name: "Fiona Gallagher", email: "fiona@example.com", phone: "+1 555-0106" },
        { id: "CUST-007", name: "George Martin", email: "george@example.com", phone: "+1 555-0107" },
        { id: "CUST-008", name: "Hannah Abbott", email: "hannah@example.com", phone: "+1 555-0108" },
        { id: "CUST-009", name: "Ian Malcolm", email: "ian@example.com", phone: "+1 555-0109" },
        { id: "CUST-010", name: "Julia Stiles", email: "julia@example.com", phone: "+1 555-0110" },
    ];
}

const CustomersPage = async () => {
    const data = await getData();

    return (
        <div className="p-10 w-[94%] mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold mb-2 text-[#0B1DFF]">Customers</h1>
                    <p>Here is a list of all CUSTOMERS</p>
                </div>
                <Link href="/addcustomer">
                    <Button className="bg-[#0B1DFF] w-[180px] h-[40px]">
                        <Plus className="mr-2 h-4 w-4" /> Add Customer
                    </Button>
                </Link>
            </div>
            <DataTable columns={columns} data={data} />
        </div>
    );
};

export default CustomersPage;
