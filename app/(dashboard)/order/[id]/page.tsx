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
import { getLocale, getTranslations } from "next-intl/server";
import { formatDate } from "@/lib/i18n";
import { formatPrice } from "@/lib/money";
import { isOrderStatus } from "@/lib/orders";

interface OrderDetailsPageProps {
  params: Promise<{ id: string }>;
}

const OrderDetailsPage = async ({ params }: OrderDetailsPageProps) => {
  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isInteger(orderId)) notFound();

  const [order, timeline, notes, t, tOrders, statuses, locale] = await Promise.all([
    getOrderWithDetails(orderId),
    getOrderTimeline(orderId),
    getOrderNotes(orderId),
    getTranslations("orders.detail"),
    getTranslations("orders"),
    getTranslations("orderStatus"),
    getLocale(),
  ]);

  if (!order) notFound();

  const { customer, items, shippingAddress } = order;
  const callPhone = customer?.phone || shippingAddress?.phone;

  const statusColors = {
    New: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/20",
    processing: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20",
    Delivering: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
    Delivered: "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/20",
    Cancelled: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/20",
  };

  const currentStatusColor =
    statusColors[order.status as keyof typeof statusColors] ||
    "bg-muted text-foreground/80 border-border";

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/order"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 me-1 rtl:rotate-180" /> {t("back")}
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {t("title", { id: order.id })}
            </h1>
            <div className="flex items-center text-muted-foreground text-sm">
              <Calendar className="h-4 w-4 me-2" />
              {formatDate(order.createdAt, locale, true)}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href={`/invoice/${order.id}`}
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium bg-muted hover:bg-accent text-foreground/80 transition-colors"
            >
              <CreditCard className="h-4 w-4" />
              {tOrders("printInvoice")}
            </Link>
            <span
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${currentStatusColor}`}
            >
              {isOrderStatus(order.status) ? statuses(order.status) : order.status}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Content - Items */}
        <div className="col-span-2 space-y-6">
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/40 flex justify-between items-center">
              <h2 className="font-semibold text-foreground flex items-center">
                <ShoppingBag className="h-5 w-5 me-2 text-primary" />
                {t("items")}
              </h2>
              <span className="text-sm text-muted-foreground">
                {t("itemsCount", { count: items.length })}
              </span>
            </div>
            <div className="p-6">
              <ul className="space-y-4">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex justify-between items-center py-4 border-b border-border last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-4">
                      {item.productImage && (
                        <Image
                          src={item.productImage}
                          alt={item.productName}
                          width={64}
                          height={64}
                          className="h-16 w-16 object-cover rounded-md border border-border"
                          unoptimized
                        />
                      )}

                      <div>
                        <p className="font-medium text-foreground">
                          {item.productName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {t("qty", { quantity: item.quantity, price: formatPrice(item.unitPrice) })}
                        </p>
                      </div>
                    </div>
                    <div className="font-semibold text-foreground">
                      {formatPrice(item.lineTotal)}
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-6 pt-6 border-t border-border flex justify-end">
                <div className="text-end">
                  {order.itemsTotal !== order.total && (
                    <p className="text-sm text-muted-foreground mb-1">
                      {t("itemsAndCharges", {
                        items: formatPrice(order.itemsTotal),
                        charges: formatPrice(order.total - order.itemsTotal),
                      })}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground mb-1">{t("totalAmount")}</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatPrice(order.total)}
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
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/40">
              <h2 className="font-semibold text-foreground flex items-center">
                <User className="h-5 w-5 me-2 text-primary" />
                {t("customerDetails")}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-muted overflow-hidden">
                  <Image
                    src={man}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-bold text-foreground">
                    {customer?.name || t("guest")}
                  </p>
                  <p className="text-xs text-muted-foreground">{t("customer")}</p>
                </div>
              </div>

              <div className="pt-2 space-y-3">
                {customer?.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground/70 mt-1" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground uppercase">
                        {t("phoneNumber")}
                      </p>
                      <a
                        href={`tel:${customer.phone}`}
                        className="text-primary font-medium hover:underline block"
                      >
                        {customer.phone}
                      </a>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground/70 mt-1" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground uppercase">{t("email")}</p>
                    <p className="text-sm text-foreground/80 break-all">
                      {customer?.email || t("noEmail")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground/70 mt-1" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground uppercase">
                      {t("shippingAddress")}
                    </p>
                    {shippingAddress ? (
                      <>
                        <p className="text-sm text-foreground/80">
                          {formatAddressLines(shippingAddress).map((line) => (
                            <span key={line} className="block">
                              {line}
                            </span>
                          ))}
                        </p>
                        {shippingAddress.phone && (
                          <a
                            href={`tel:${shippingAddress.phone}`}
                            className="text-sm text-primary font-medium hover:underline block mt-1"
                          >
                            {t("deliveryPhone", { phone: shippingAddress.phone })}
                          </a>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">{t("noAddress")}</p>
                    )}
                  </div>
                </div>
              </div>

              {callPhone && (
                <div className="pt-2">
                  <a
                    href={`tel:${callPhone}`}
                    className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary-strong text-white font-medium py-2 rounded-lg transition-colors"
                  >
                    <Phone className="h-4 w-4" /> {t("callCustomer")}
                  </a>
                </div>
              )}
            </div>
          </div>

          <Can minRole="admin">
            <div className="bg-card rounded-xl border border-border shadow-sm p-6">
              <h2 className="font-semibold text-foreground mb-4 flex items-center">
                <Truck className="h-5 w-5 me-2 text-primary" />
                {t("updateStatus")}
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
