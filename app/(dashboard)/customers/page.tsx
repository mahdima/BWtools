import React from "react";
import { DataTable } from "@/components/data-table";
import { columns, Customer } from "./columns";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

async function getData(): Promise<Customer[]> {
    const { data, error } = await supabase
        .from('profiles_with_email')
        .select('*')


    if (error) {
        console.error('Error fetching CUSTOMERS:', error);
        return [];
    }

    // Map the database columns to the Product interface
    // Assuming the DB has a 'name' column for the product name to match the 'product' field in the table
    return (data || []).map((item: any) => ({
        id: item.id,
        username: item.username || 'Null',
        email: item.email || 'Null',
        phone: item.phone || 'Null',
    }));
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
