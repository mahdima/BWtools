import React from "react";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ArrowLeft,
  Box,
  Calendar,
  CreditCard,
  ShoppingBag,
  Truck,
  User,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { updateOrderStatus, getOrderTimeline, getOrderNotes } from "../actions";
import Image from "next/image";
import man from "../../../../img/man.png";
import { OrderTimeline } from "@/components/order-timeline";
import { OrderNotes } from "@/components/order-notes";

async function getOrder(id: string) {
  // First fetch the order
  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (orderError || !order) {
    console.error("Error fetching order:", orderError);
    return null;
  }

  // Fetch Profile and User Email (Auth)
  let profile: any = null;

  if (order.user_id) {
    // Run fetches in parallel for performance
    const [profileResult, authResult] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("id", order.user_id)
        .single(),
      supabaseAdmin.auth.admin.getUserById(order.user_id),
    ]);

    if (profileResult.data) {
      profile = profileResult.data;
    }

    // Attach email and phone from Auth User if available
    const authUser = authResult.data?.user;
    if (authUser) {
      if (!profile) profile = {}; // Init if mock/missing

      // Email
      if (!profile.email && authUser.email) {
        profile.email = authUser.email;
      }

      // Phone
      // Supabase Auth stores phone in 'phone' column
      if (!profile.phone && authUser.phone) {
        profile.phone = authUser.phone;
      }

      // Also check user_metadata for phone if main phone is e.g. placeholder
      if (!profile.phone && authUser.user_metadata?.phone) {
        profile.phone = authUser.user_metadata.phone;
      }

      // Also check user_metadata for phone_number (common variation)
      if (!profile.phone && authUser.user_metadata?.phone_number) {
        profile.phone = authUser.user_metadata.phone_number;
      }
    } else {
      console.warn(
        "Could not fetch auth user for order:",
        authResult.error?.message
      );
    }
  }

  return { ...order, profiles: profile };
}

async function getOrderItems(orderId: string) {
  const { data, error } = await supabaseAdmin
    .from("order_items")
    .select("*, products(product_name, product_link)")
    .eq("order_id", orderId);

  if (error) {
    console.error("Error fetching order items:", error);
    return [];
  }
  return data;
}

interface OrderDetailsPageProps {
  params: Promise<{ id: string }>;
}

const OrderDetailsPage = async ({ params }: OrderDetailsPageProps) => {
  const { id } = await params;
  const order = await getOrder(id);
  const items = await getOrderItems(id);
  const timeline = await getOrderTimeline(id);
  const notes = await getOrderNotes(id);

  if (!order) {
    return <div>Order not found</div>;
  }

  const customer = order.profiles;

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
          className="inline-flex items-center text-sm text-gray-500 hover:text-[#0B1DFF] mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Orders
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Order #{order.id}
            </h1>
            <div className="flex items-center text-gray-500 text-sm">
              <Calendar className="h-4 w-4 mr-2" />
              {new Date(order.created_at).toLocaleString()}
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
                <ShoppingBag className="h-5 w-5 mr-2 text-[#0B1DFF]" />
                Order Items
              </h2>
              <span className="text-sm text-gray-500">
                {items?.length || 0} items
              </span>
            </div>
            <div className="p-6">
              <ul className="space-y-4">
                {items?.map((item: any) => (
                  <li
                    key={item.id}
                    className="flex justify-between items-center py-4 border-b border-gray-50 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-4">
                      {item.products?.product_link && (
                        <Image
                          src={item.products.product_link}
                          alt={item.products?.product_name || "Product"}
                          width={64}
                          height={64}
                          className="h-16 w-16 object-cover rounded-md border border-gray-100"
                          unoptimized
                        />
                      )}

                      <div>
                        <p className="font-medium text-gray-900">
                          {item.products?.product_name || "Unknown Product"}
                        </p>
                        <p className="text-sm text-gray-500">
                          Qty: {item.quantity} × {item.unit_price} DZD
                        </p>
                      </div>
                    </div>
                    <div className="font-semibold text-gray-900">
                      {(item.quantity * item.unit_price).toLocaleString()} DZD
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-6 pt-6 border-t border-gray-100 flex justify-end">
                <div className="text-right">
                  <p className="text-sm text-gray-500 mb-1">Total Amount</p>
                  <p className="text-2xl font-bold text-[#0B1DFF]">
                    {order.total.toLocaleString()} DZD
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline & Notes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <OrderTimeline events={timeline} />
            <OrderNotes orderId={id} notes={notes} />
          </div>
        </div>

        {/* Sidebar - Status Actions & Customer Info */}
        <div className="space-y-6">
          {/* Customer Info Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="font-semibold text-gray-900 flex items-center">
                <User className="h-5 w-5 mr-2 text-[#0B1DFF]" />
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
                    {customer?.username || "Guest User"}
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

                {(customer?.address || customer?.city) && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 uppercase">
                        Shipping Address
                      </p>
                      <p className="text-sm text-gray-700">
                        {customer.address}
                        {customer.city && `, ${customer.city}`}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {customer?.phone && (
                <div className="pt-2">
                  <a
                    href={`tel:${customer.phone}`}
                    className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors"
                  >
                    <Phone className="h-4 w-4" /> Call Customer
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Truck className="h-5 w-5 mr-2 text-[#0B1DFF]" />
              Update Status
            </h2>
            <div className="space-y-3">
              <form action={updateOrderStatus.bind(null, order.id, "New")}>
                <Button
                  variant="outline"
                  className="w-full justify-start hover:bg-green-50 hover:text-green-700 hover:border-green-200"
                  disabled={order.status === "New"}
                >
                  <Box className="h-4 w-4 mr-2" /> Mark as New
                </Button>
              </form>
              <form
                action={updateOrderStatus.bind(null, order.id, "processing")}
              >
                <Button
                  variant="outline"
                  className="w-full justify-start hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
                  disabled={order.status === "processing"}
                >
                  <Box className="h-4 w-4 mr-2" /> Mark as Processing
                </Button>
              </form>
              <form
                action={updateOrderStatus.bind(null, order.id, "Delivering")}
              >
                <Button
                  variant="outline"
                  className="w-full justify-start hover:bg-yellow-50 hover:text-yellow-700 hover:border-yellow-200"
                  disabled={order.status === "Delivering"}
                >
                  <Truck className="h-4 w-4 mr-2" /> Mark as Delivering
                </Button>
              </form>
              <form
                action={updateOrderStatus.bind(null, order.id, "Delivered")}
              >
                <Button
                  variant="outline"
                  className="w-full justify-start hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200"
                  disabled={order.status === "Delivered"}
                >
                  <Truck className="h-4 w-4 mr-2" /> Mark as Delivered
                </Button>
              </form>
              <form
                action={updateOrderStatus.bind(null, order.id, "Cancelled")}
              >
                <Button
                  variant="outline"
                  className="w-full justify-start hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                  disabled={order.status === "Cancelled"}
                >
                  <Box className="h-4 w-4 mr-2" /> Mark as Cancelled
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;
