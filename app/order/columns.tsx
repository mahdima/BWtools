"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type Order = {
    id: string
    product: string
    qty: number
    date: string
    price: number
    status: "Pending" | "Processing" | "Completed" | "Cancelled"
}

export const columns: ColumnDef<Order>[] = [
    {
        accessorKey: "id",
        header: "ID",
    },
    {
        accessorKey: "product",
        header: "Product",
    },
    {
        accessorKey: "qty",
        header: "Qty",
    },
    {
        accessorKey: "date",
        header: "Date",
    },
    {
        accessorKey: "price",
        header: "Price",
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("price"))
            const formatted = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
            }).format(amount)

            return <div className="font-medium">{formatted}</div>
        },
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as string
            let colorClass = "text-gray-500"
            if (status === "Completed") colorClass = "text-green-500"
            else if (status === "Processing") colorClass = "text-blue-500"
            else if (status === "Cancelled") colorClass = "text-red-500"
            else if (status === "Pending") colorClass = "text-yellow-500"

            return <div className={`font-medium ${colorClass}`}>{status}</div>
        },
    },
    {
        id: "actions",
        header: "Action",
        cell: ({ row }) => {
            const order = row.original

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                            onClick={() => navigator.clipboard.writeText(order.id)}
                        >
                            Copy order ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>View details</DropdownMenuItem>
                        <DropdownMenuItem>Update status</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]
