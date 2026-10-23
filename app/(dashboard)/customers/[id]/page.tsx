import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MapPin, Phone, ShoppingBag } from "lucide-react";
import { getCustomerDetails } from "@/lib/data/customers";
import { formatAddressLines } from "@/lib/address";
import { getLocale, getTranslations } from "next-intl/server";
import { formatDate } from "@/lib/i18n";
import { formatPrice } from "@/lib/money";
import { isOrderStatus } from "@/lib/orders";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface CustomerPageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerPage({ params }: CustomerPageProps) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const [customer, t, statuses, locale] = await Promise.all([
    getCustomerDetails(id),
    getTranslations("customers.detail"),
    getTranslations("orderStatus"),
    getLocale(),
  ]);
  if (!customer) notFound();

  const title = customer.name || customer.username || customer.email || t("fallbackTitle");

  return (
    <div className="p-4 ps-16 lg:ps-6 max-w-5xl mx-auto w-full overflow-auto">
      <Link
        href="/customers"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 me-1 rtl:rotate-180" /> {t("back")}
      </Link>
      <h1 className="text-3xl font-bold text-foreground mb-1">{title}</h1>
      {customer.username && customer.username !== title && (
        <p className="text-sm text-muted-foreground mb-6">@{customer.username}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
        {[
          [t("orders"), String(customer.orderCount)],
          [t("totalSpent"), formatPrice(customer.totalSpent)],
          [t("lastOrder"), customer.lastOrderAt ? formatDate(customer.lastOrderAt, locale) : "—"],
        ].map(([label, value]) => (
          <div key={label} className="bg-card rounded-xl border border-border shadow-sm p-5">
            <p className="text-xs text-muted-foreground uppercase">{label}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <h2 className="px-6 py-4 border-b border-border bg-muted/40 font-semibold text-foreground flex items-center">
            <ShoppingBag className="h-5 w-5 me-2 text-primary" aria-hidden /> {t("orders")}
          </h2>
          {customer.orders.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">{t("noOrders")}</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-start text-xs uppercase text-muted-foreground">
                  <th className="px-6 py-3 font-medium">{t("order")}</th>
                  <th className="px-6 py-3 font-medium">{t("date")}</th>
                  <th className="px-6 py-3 font-medium">{t("status")}</th>
                  <th className="px-6 py-3 font-medium text-end">{t("total")}</th>
                </tr>
              </thead>
              <tbody>
                {customer.orders.map((order) => (
                  <tr key={order.id} className="border-t border-border">
                    <td className="px-6 py-3">
                      <Link href={`/order/${order.id}`} className="font-medium text-primary hover:underline">
                        #{order.id}
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">{formatDate(order.createdAt, locale)}</td>
                    <td className="px-6 py-3 text-muted-foreground">{isOrderStatus(order.status) ? statuses(order.status) : (order.status ?? "—")}</td>
                    <td className="px-6 py-3 text-end font-medium">{formatPrice(order.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-3">
            <h2 className="font-semibold text-foreground">{t("contact")}</h2>
            <p className="flex items-center gap-2 text-sm text-foreground/80 break-all">
              <Mail className="h-4 w-4 text-muted-foreground/70 shrink-0" aria-hidden /> {customer.email ?? t("noEmail")}
            </p>
            {customer.phone && (
              <a href={`tel:${customer.phone}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
                <Phone className="h-4 w-4 text-muted-foreground/70 shrink-0" aria-hidden /> <span dir="ltr">{customer.phone}</span>
              </a>
            )}
          </div>

          <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-foreground flex items-center">
              <MapPin className="h-4 w-4 me-2 text-muted-foreground/70" aria-hidden /> {t("addresses")}
            </h2>
            {customer.addresses.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("noAddresses")}</p>
            ) : (
              customer.addresses.map((address) => (
                <div key={address.id} className="text-sm text-foreground/80">
                  {address.isDefault && <p className="text-xs font-semibold text-primary mb-1">{t("default")}</p>}
                  {formatAddressLines(address).map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                  {address.phone && <span className="block text-muted-foreground">{address.phone}</span>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
