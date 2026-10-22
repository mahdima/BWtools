import React from "react";
import { getOrderNotes, getOrderTimeline, getOrderWithDetails } from "@/lib/data/orders";
import { formatAddressLines } from "@/lib/address";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  ShoppingBag,
  Truck,
  User,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import man from "../../../../img/man.png";
import { OrderTimeline } from "@/components/order-timeline";
import { OrderNotes } from "@/components/order-notes";
import { OrderStatusActions } from "@/components/order-status-actions";
import { Can } from "@/components/admin-provider";

interface OrderDetailsPageProps {
  params: Promise<{ id: string }>;
}

const OrderDetailsPage = async ({ params }: OrderDetailsPageProps) => {
  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isInteger(orderId)) notFound();

  const [order, timeline, notes] = await Promise.all([
    getOrderWithDetails(orderId),
    getOrderTimeline(orderId),
    getOrderNotes(orderId),
  ]);

  if (!order) notFound();

  const { customer, items, shippingAddress } = order;
  const callPhone = customer?.phone || shippingAddress?.phone;

  const statusColors = {
    New: "bg-green-100 text-green-700 border-green-200",
    processing: "bg-blue-100 text-blue-700 border-blue-200",
    Delivering: "bg-yellow-100 text-yellow-700 border-yellow-200",
    Delivered: "bg-orange-100 text-orange-700 border-orange-200",
    Cancelled: "bg-red-100 text-red-700 border-red-200",
  };

  const currentStatusColor =
    statusColors[order.status as keyof typeof statusColors] ||
    "bg-gray-100 text-gray-700 border-gray-200";

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/order"
          className="inline-flex items-center text-sm text-gray-500 hover:text-primary mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 me-1 rtl:rotate-180" /> Back to Orders
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Order #{order.id}
            </h1>
            <div className="flex items-center text-gray-500 text-sm">
              <Calendar className="h-4 w-4 me-2" />
              {new Date(order.createdAt).toLocaleString()}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href={`/invoice/${order.id}`}
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
            >
              <CreditCard className="h-4 w-4" />
              Print Invoice
            </Link>
            <span
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${currentStatusColor}`}
            >
              {order.status}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Content - Items */}
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h2 className="font-semibold text-gray-900 flex items-center">
                <ShoppingBag className="h-5 w-5 me-2 text-primary" />
                Order Items
              </h2>
              <span className="text-sm text-gray-500">
                {items.length} items
              </span>
            </div>
            <div className="p-6">
              <ul className="space-y-4">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex justify-between items-center py-4 border-b border-gray-50 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-4">
                      {item.productImage && (
                        <Image
                          src={item.productImage}
                          alt={item.productName}
                          width={64}
                          height={64}
                          className="h-16 w-16 object-cover rounded-md border border-gray-100"
                          unoptimized
                        />
                      )}

                      <div>
                        <p className="font-medium text-gray-900">
                          {item.productName}
                        </p>
                        <p className="text-sm text-gray-500">
                          Qty: {item.quantity} × {item.unitPrice.toLocaleString()} DZD
                        </p>
                      </div>
                    </div>
                    <div className="font-semibold text-gray-900">
                      {item.lineTotal.toLocaleString()} DZD
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-6 pt-6 border-t border-gray-100 flex justify-end">
                <div className="text-end">
                  {order.itemsTotal !== order.total && (
                    <p className="text-sm text-gray-500 mb-1">
                      Items {order.itemsTotal.toLocaleString()} DZD + other
                      charges {(order.total - order.itemsTotal).toLocaleString()} DZD
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mb-1">Total Amount</p>
                  <p className="text-2xl font-bold text-primary">
                    {order.total.toLocaleString()} DZD
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline & Notes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <OrderTimeline events={timeline} />
            <OrderNotes orderId={orderId} notes={notes} />
          </div>
        </div>

        {/* Sidebar - Status Actions & Customer Info */}
        <div className="space-y-6">
          {/* Customer Info Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="font-semibold text-gray-900 flex items-center">
                <User className="h-5 w-5 me-2 text-primary" />
                Customer Details
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden">
                  <Image
                    src={man}
                    alt="User"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-bold text-gray-900">
                    {customer?.name || "Guest User"}
                  </p>
                  <p className="text-xs text-gray-500">Customer</p>
                </div>
              </div>

              <div className="pt-2 space-y-3">
                {customer?.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 text-gray-400 mt-1" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 uppercase">
                        Phone Number
                      </p>
                      <a
                        href={`tel:${customer.phone}`}
                        className="text-blue-600 font-medium hover:underline block"
                      >
                        {customer.phone}
                      </a>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 text-gray-400 mt-1" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 uppercase">Email</p>
                    <p className="text-sm text-gray-700 break-all">
                      {customer?.email || "No email provided"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 uppercase">
                      Shipping Address
                    </p>
                    {shippingAddress ? (
                      <>
                        <p className="text-sm text-gray-700">
                          {formatAddressLines(shippingAddress).map((line) => (
                            <span key={line} className="block">
                              {line}
                            </span>
                          ))}
                        </p>
                        {shippingAddress.phone && (
                          <a
                            href={`tel:${shippingAddress.phone}`}
                            className="text-sm text-blue-600 font-medium hover:underline block mt-1"
                          >
                            Delivery phone: {shippingAddress.phone}
                          </a>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-gray-500">No address on this order</p>
                    )}
                  </div>
                </div>
              </div>

              {callPhone && (
                <div className="pt-2">
                  <a
                    href={`tel:${callPhone}`}
                    className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors"
                  >
                    <Phone className="h-4 w-4" /> Call Customer
                  </a>
                </div>
              )}
            </div>
          </div>

          <Can minRole="admin">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Truck className="h-5 w-5 me-2 text-primary" />
                Update Status
              </h2>
              <OrderStatusActions orderId={orderId} currentStatus={order.status} />
            </div>
          </Can>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;
