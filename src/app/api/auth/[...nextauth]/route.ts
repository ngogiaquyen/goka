import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import FacebookProvider from "next-auth/providers/facebook";
import GoogleProvider from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isPrismaConnectionError } from "@/lib/prisma-error";

// Cấu hình NextAuth, tập trung vào:
// - Đăng nhập Email + Password (đã verify OTP trước đó)
// - Đăng nhập Facebook / Google và bắt buộc có số điện thoại

export const authConfig = {
  // Required by Auth.js / NextAuth in production and often in dev
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Email & Mật khẩu",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mật khẩu", type: "password" },
      },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string"
            ? credentials.email.trim().toLowerCase()
            : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";

        if (!email || !password) {
          throw new Error("Thiếu email hoặc mật khẩu");
        }

        let user: any;
        try {
          user = await prisma.user.findUnique({
            where: { email },
          });
        } catch (err) {
          if (isPrismaConnectionError(err)) {
            throw new Error(
              "Không thể kết nối cơ sở dữ liệu. Vui lòng kiểm tra DATABASE_URL trong file .env.",
            );
          }
          throw err;
        }

        if (!user || !user.passwordHash) {
          throw new Error("Tài khoản không tồn tại");
        }

        if (!user.emailVerified) {
          throw new Error("Email chưa được xác thực");
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);

        if (!isValid) {
          throw new Error("Sai mật khẩu");
        }

        // Bảo đảm user có số điện thoại trước khi cho đăng nhập
        if (!user.phone) {
          throw new Error("Tài khoản chưa có số điện thoại");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
        role: user.role,
        };
      },
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID ?? "",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET ?? "",
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // Lần đăng nhập đầu tiên
      if (user) {
        token.id = (user as any).id;
        token.phone = (user as any).phone ?? null;
        token.role = (user as any).role ?? "USER";
      }

      // Nếu là đăng nhập qua OAuth, đảm bảo user trong DB có phone
      if (account && (account.provider === "facebook" || account.provider === "google")) {
        let dbUser: any = null;
        try {
          dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
          });
        } catch (err) {
          if (isPrismaConnectionError(err)) return token;
          throw err;
        }

        if (dbUser) {
          token.phone = dbUser.phone ?? null;
          token.role = dbUser.role ?? "USER";
        }
      }

      // Làm mới phone nếu token chưa có (ví dụ vừa cập nhật phone)
      if ((!token.phone || !token.role) && token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
          });
          token.phone = dbUser?.phone ?? null;
          token.role = dbUser?.role ?? token.role ?? "USER";
        } catch (err) {
          if (isPrismaConnectionError(err)) return token;
          throw err;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token?.id) {
        (session as any).user.id = token.id;
      }
      if (token?.phone) {
        (session as any).user.phone = token.phone;
      }
      if (token?.role) {
        (session as any).user.role = token.role;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth(authConfig);

