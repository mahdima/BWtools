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
import { deleteCategory } from "@/app/(dashboard)/addcategory/actions"
import Link from "next/link"

export type Category = {
    id: string
    category: string
}

export const columns: ColumnDef<Category>[] = [
    {
        accessorKey: "id",
        header: "ID",
    },
    {
        accessorKey: "category",
        header: "Category",
    },
    {
        id: "actions",
        header: "Action",
        cell: ({ row }) => {
            const category = row.original

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
                            onClick={() => navigator.clipboard.writeText(category.id)}
                        >
                            Copy category ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <Link href={`/editcategory/${category.id}`}>
                            <DropdownMenuItem className="cursor-pointer">
                                Edit
                            </DropdownMenuItem>
                        </Link>
                        <DropdownMenuItem
                            onClick={() => deleteCategory(category.id)}
                            className="text-red-600 focus:text-red-600 cursor-pointer"
                        >
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]
