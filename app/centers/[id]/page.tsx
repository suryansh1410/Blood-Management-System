import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import CenterDetailClient from "@/components/blood/CenterDetailClient";
import { ALL_BLOOD_GROUPS, BLOOD_GROUP_DISPLAY, getStockStatus, getStockStatusLabel } from "@/lib/constants";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const centerId = parseInt(id);
  if (isNaN(centerId)) return { title: "Center Not Found | LifePulse" };
  const center = await prisma.bloodCenter.findFirst({ where: { id: centerId, isActive: true } });
  if (!center) return { title: "Center Not Found | LifePulse" };
  return {
    title: `${center.name} | LifePulse Blood Finder`,
    description: `Blood availability at ${center.name}, ${center.city}. Check current stock by blood group.`,
  };
}

export default async function CenterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const centerId = parseInt(id);
  if (isNaN(centerId)) notFound();

  const center = await prisma.bloodCenter.findFirst({
    where: { id: centerId, isActive: true },
    include: { stocks: true },
  });

  if (!center) notFound();

  const session = await getServerSession(authOptions);
  const isAuthenticated = !!session?.user;

  const stockMap = new Map(center.stocks.map((s) => [s.bloodGroup, s.units]));
  const allStocks = ALL_BLOOD_GROUPS.map((bg) => {
    const units = stockMap.get(bg) ?? 0;
    const status = getStockStatus(units);
    return {
      bloodGroup: bg,
      displayGroup: BLOOD_GROUP_DISPLAY[bg],
      units,
      status,
      statusLabel: getStockStatusLabel(status),
    };
  });

  return (
    <CenterDetailClient
      center={{
        id: center.id,
        name: center.name,
        type: center.type,
        city: center.city,
        address: center.address,
        phone: center.phone,
        isMain: center.isMain,
      }}
      stocks={allStocks}
      isAuthenticated={isAuthenticated}
    />
  );
}