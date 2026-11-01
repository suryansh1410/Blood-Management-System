import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { BLOOD_GROUP_DISPLAY, getStockStatus } from "@/lib/constants";

export async function GET() {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.authorized) return auth.errorResponse;

  try {
    const [
      totalDonors,
      totalPatients,
      stocks,
      pendingRequests,
      approvedRequests,
      allRequests,
      pendingDonations,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "DONOR" } }),
      prisma.user.count({ where: { role: "PATIENT" } }),
      prisma.bloodStock.findMany({ orderBy: { bloodGroup: "asc" } }),
      prisma.bloodRequest.count({ where: { status: "PENDING" } }),
      prisma.bloodRequest.count({ where: { status: "APPROVED" } }),
      prisma.bloodRequest.findMany(),
      prisma.donation.count({ where: { status: "PENDING" } }),
    ]);

    // Total units across all blood groups
    const totalUnits = stocks.reduce((sum, s) => sum + s.units, 0);

    // Fulfilled requests this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const fulfilledThisMonth = allRequests.filter(
      (r) => r.status === "FULFILLED" && r.fulfilledAt && new Date(r.fulfilledAt) >= startOfMonth
    ).length;

    // Groups at low, critical, or out of stock
    const attentionGroups = stocks
      .filter((s) => getStockStatus(s.units) !== "AVAILABLE")
      .map((s) => ({
        bloodGroup: s.bloodGroup,
        display: BLOOD_GROUP_DISPLAY[s.bloodGroup],
        units: s.units,
        status: getStockStatus(s.units),
      }));

    // Stock distribution chart data
    const stockDistribution = stocks.map((s) => ({
      group: BLOOD_GROUP_DISPLAY[s.bloodGroup],
      rawGroup: s.bloodGroup,
      units: s.units,
      status: getStockStatus(s.units),
    }));

    // Request volume by status chart data
    const statusCounts: Record<string, number> = {
      PENDING: 0,
      APPROVED: 0,
      FULFILLED: 0,
      REJECTED: 0,
      CANCELLED: 0,
    };

    allRequests.forEach((r) => {
      statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
    });

    const requestsByStatus = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
    }));

    // Requests by Urgency
    const urgencyCounts: Record<string, number> = {
      NORMAL: 0,
      URGENT: 0,
      EMERGENCY: 0,
    };
    allRequests.forEach((r) => {
      urgencyCounts[r.urgency] = (urgencyCounts[r.urgency] || 0) + 1;
    });

    const requestsByUrgency = Object.entries(urgencyCounts).map(([urgency, count]) => ({
      urgency,
      count,
    }));

    return NextResponse.json({
      data: {
        totalDonors,
        totalPatients,
        totalUnits,
        pendingRequests,
        approvedRequests,
        fulfilledThisMonth,
        pendingDonations,
        attentionGroups,
        stockDistribution,
        requestsByStatus,
        requestsByUrgency,
      },
    });
  } catch (error: any) {
    console.error("Fetch admin stats error:", error);
    return NextResponse.json({ error: "Failed to load dashboard statistics" }, { status: 500 });
  }
}
