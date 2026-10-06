import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";

const kredensialSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Kata sandi wajib diisi"),
});

// Batas upaya login: 10x per menit per IP (hasil audit keamanan run-1).
const LOGIN_LIMIT = 10;
const LOGIN_WINDOW_MS = 60_000;

async function clientIp(): Promise<string> {
  try {
    const h = await headers();
    return h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  } catch {
    return "unknown";
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: 12 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "Email & Kata Sandi",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Kata Sandi", type: "password" },
      },
      authorize: async (credentials) => {
        // Rate limit dulu: jangan bakar DB lookup + bcrypt untuk penyerang.
        const ip = await clientIp();
        if (!checkRateLimit(`login:${ip}`, LOGIN_LIMIT, LOGIN_WINDOW_MS)) {
          return null;
        }
        const parsed = kredensialSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase().trim() },
        });
        if (!user || !user.isActive) return null;
        const cocok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!cocok) return null;
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          sessionVersion: user.sessionVersion,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.sv = (user as { sessionVersion?: number }).sessionVersion ?? 0;
        return token;
      }
      // Validasi sesi terhadap database setiap request (hasil audit run-1):
      // token lama langsung mati bila akun dinonaktifkan, role diturunkan,
      // atau password diganti (sessionVersion dinaikkan).
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { sessionVersion: true, role: true, isActive: true },
        });
        if (!dbUser || !dbUser.isActive || dbUser.sessionVersion !== token.sv) {
          return null; // paksa logout
        }
        token.role = dbUser.role; // segarkan role dari database
      }
      return token;
    },
    session({ session, token }) {
      const u = session.user as { id?: string; role?: string };
      if (u) {
        u.id = token.id as string;
        u.role = token.role as string;
      }
      return session;
    },
  },
});
