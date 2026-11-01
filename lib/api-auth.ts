import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { NextResponse } from "next/server";

export type AuthResult =
  | {
      authorized: true;
      user: { id: string; role: string; name?: string; email?: string; centerId?: number };
      errorResponse?: never;
    }
  | {
      authorized: false;
      user?: never;
      errorResponse: NextResponse;
    };

export async function requireAuth(allowedRoles?: string[]): Promise<AuthResult> {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return {
      authorized: false,
      errorResponse: NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 }),
    };
  }

  const user = session.user as { id: string; role: string; name?: string; email?: string; centerId?: number };

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        { error: "Forbidden. You do not have permission for this resource." },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    user,
  };
}
