import { requireAdminPage } from "@/lib/auth";
import { getOrderWithDetails } from "@/lib/data/orders";
import { getStoreSettings } from "@/lib/data/settings";
import { InvoicePrintable } from "@/components/invoice-printable";
import { notFound } from "next/navigation";

export const revalidate = 0;

interface InvoicePageProps {
  params: Promise<{ id: string }>;
}

export default async function InvoicePage({ params }: InvoicePageProps) {
  await requireAdminPage();
  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isInteger(orderId)) notFound();

  // Same loader as the order page, so the two always agree
  const [order, store] = await Promise.all([getOrderWithDetails(orderId), getStoreSettings()]);
  if (!order) notFound();

  return <InvoicePrintable order={order} store={store} />;
}
