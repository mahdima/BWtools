import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MapPin, Phone, ShoppingBag } from "lucide-react";
import { getCustomerDetails } from "@/lib/data/customers";
import { formatAddressLines } from "@/lib/address";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const dzd = new Intl.NumberFormat("fr-DZ", { style: "currency", currency: "DZD" });

interface CustomerPageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerPage({ params }: CustomerPageProps) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const customer = await getCustomerDetails(id);
  if (!customer) notFound();

  const title = customer.name || customer.username || customer.email || "Customer";

  return (
    <div className="p-4 pl-16 lg:pl-6 max-w-5xl mx-auto w-full overflow-auto">
      <Link
        href="/customers"
        className="inline-flex items-center text-sm text-gray-500 hover:text-primary mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Customers
      </Link>
      <h1 className="text-3xl font-bold text-gray-900 mb-1">{title}</h1>
      {customer.username && customer.username !== title && (
        <p className="text-sm text-gray-500 mb-6">@{customer.username}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
        {[
          ["Orders", String(customer.orderCount)],
          ["Total spent", dzd.format(customer.totalSpent)],
          ["Last order", customer.lastOrderAt ? new Date(customer.lastOrderAt).toLocaleDateString() : "—"],
        ].map(([label, value]) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <p className="text-xs text-gray-500 uppercase">{label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <h2 className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 font-semibold text-gray-900 flex items-center">
            <ShoppingBag className="h-5 w-5 mr-2 text-primary" aria-hidden /> Orders
          </h2>
          {customer.orders.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">No orders yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-gray-500">
                  <th className="px-6 py-3 font-medium">Order</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {customer.orders.map((order) => (
                  <tr key={order.id} className="border-t border-gray-50">
                    <td className="px-6 py-3">
                      <Link href={`/order/${order.id}`} className="font-medium text-primary hover:underline">
                        #{order.id}
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-3 text-gray-600">{order.status ?? "—"}</td>
                    <td className="px-6 py-3 text-right font-medium">{dzd.format(order.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-3">
            <h2 className="font-semibold text-gray-900">Contact</h2>
            <p className="flex items-center gap-2 text-sm text-gray-700 break-all">
              <Mail className="h-4 w-4 text-gray-400 shrink-0" aria-hidden /> {customer.email ?? "No email"}
            </p>
            {customer.phone && (
              <a href={`tel:${customer.phone}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
                <Phone className="h-4 w-4 text-gray-400 shrink-0" aria-hidden /> {customer.phone}
              </a>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-gray-400" aria-hidden /> Addresses
            </h2>
            {customer.addresses.length === 0 ? (
              <p className="text-sm text-gray-500">No saved addresses.</p>
            ) : (
              customer.addresses.map((address) => (
                <div key={address.id} className="text-sm text-gray-700">
                  {address.isDefault && <p className="text-xs font-semibold text-primary mb-1">Default</p>}
                  {formatAddressLines(address).map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                  {address.phone && <span className="block text-gray-500">{address.phone}</span>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
