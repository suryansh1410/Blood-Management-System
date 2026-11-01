import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PatientBloodFinder from "@/components/blood/PatientBloodFinder";

export default async function PatientSearchBloodPage() {
  const session = await getServerSession(authOptions);
  let patientCity: string | null = null;

  if (session?.user) {
    const sessionUser = session.user as any;
    try {
      const user = await prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: { city: true },
      });
      patientCity = user?.city || null;
    } catch {
      // fallback: no city priority
    }
  }

  return <PatientBloodFinder patientCity={patientCity} />;
}