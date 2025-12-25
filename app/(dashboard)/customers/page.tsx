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
        <div className="p-4 w-[98%] mx-auto">
            <div className="mb-1 mt-5">
                <h1 className="text-3xl font-bold mb-2 text-[#0B1DFF]">Customers</h1>
            </div>
            <DataTable
                columns={columns}
                data={data}
                searchKey="username"
                headerActions={
                    <Link href="/addcustomer">
                        <Button className="bg-[#0B1DFF] text-white hover:bg-blue-700 w-[180px] h-[40px]">
                            <Plus className="mr-2 h-4 w-4" /> Add Customer
                        </Button>
                    </Link>
                }
            />
        </div>
    );
};

export default CustomersPage;
