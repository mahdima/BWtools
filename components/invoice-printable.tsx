"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import React from "react";

interface InvoiceProps {
  order: any;
  items?: any[];
}

export function InvoicePrintable({ order, items = [] }: InvoiceProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white text-black min-h-screen">
      {/* Header / Actions (Hidden on Print) */}
      <div className="flex justify-end mb-8 print:hidden">
        <Button onClick={handlePrint} className="flex gap-2">
          <Printer className="h-4 w-4" /> Print Invoice
        </Button>
      </div>

      {/* Invoice Header */}
      <div className="flex justify-between items-start mb-12 border-b pb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">INVOICE</h1>
          <p className="text-gray-500 mt-2">#{order.id}</p>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold">BW Tools</h2>
          <p className="text-gray-600">Algeria</p>
          <p className="text-gray-600">contact@bwtools.com</p>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-8 mb-12">
        <div>
          <h3 className="text-gray-500 font-semibold uppercase text-xs tracking-wider mb-2">
            Bill To
          </h3>
          <p className="font-bold text-lg">
            {order.customer_name || "Guest Customer"}
          </p>
          <p className="text-gray-600">{order.customer_email}</p>
          <p className="text-gray-600">{order.shipping_address}</p>
        </div>
        <div className="text-right">
          <div className="mb-4">
            <h3 className="text-gray-500 font-semibold uppercase text-xs tracking-wider mb-2">
              Invoice Date
            </h3>
            <p className="font-bold text-lg">
              {new Date(order.created_at).toLocaleDateString()}
            </p>
          </div>
          <div>
            <h3 className="text-gray-500 font-semibold uppercase text-xs tracking-wider mb-2">
              Status
            </h3>
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-bold border ${
                order.status === "Delivered"
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-gray-200 bg-gray-50 text-gray-700"
              }`}
            >
              {order.status}
            </span>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-12">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="py-3 font-bold text-gray-500 uppercase text-xs tracking-wider">
                Item Description
              </th>
              <th className="py-3 font-bold text-gray-500 uppercase text-xs tracking-wider text-right">
                Qty
              </th>
              <th className="py-3 font-bold text-gray-500 uppercase text-xs tracking-wider text-right">
                Price
              </th>
              <th className="py-3 font-bold text-gray-500 uppercase text-xs tracking-wider text-right">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? (
              items.map((item, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-4 font-medium">{item.product_name}</td>
                  <td className="py-4 text-right">{item.quantity}</td>
                  <td className="py-4 text-right">
                    {new Intl.NumberFormat("fr-DZ", {
                      style: "currency",
                      currency: "DZD",
                    }).format(item.price)}
                  </td>
                  <td className="py-4 text-right font-bold">
                    {new Intl.NumberFormat("fr-DZ", {
                      style: "currency",
                      currency: "DZD",
                    }).format(item.price * item.quantity)}
                  </td>
                </tr>
              ))
            ) : (
              <tr className="border-b border-gray-100">
                <td className="py-4 italic text-gray-500" colSpan={4}>
                  No items found or detailed data unavailable.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Total */}
      <div className="flex justify-end">
        <div className="w-64">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">
              {new Intl.NumberFormat("fr-DZ", {
                style: "currency",
                currency: "DZD",
              }).format(order.total)}
            </span>
          </div>
          <div className="flex justify-between py-4 text-xl font-bold text-gray-900">
            <span>Total</span>
            <span>
              {new Intl.NumberFormat("fr-DZ", {
                style: "currency",
                currency: "DZD",
              }).format(order.total)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-16 text-center text-gray-500 text-sm">
        <p>Thank you for your business!</p>
      </div>
    </div>
  );
}
