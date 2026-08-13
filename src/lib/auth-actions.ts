"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession, destroySession, hashPassword, requireAdmin, verifyPassword } from "@/lib/auth";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function register(formData: FormData) {
  const name = value(formData, "name");
  const email = value(formData, "email").toLowerCase();
  const password = value(formData, "password");
  if (name.length < 2) fail("/register", "Укажите имя не короче 2 символов");
  if (!/^\S+@\S+\.\S+$/.test(email)) fail("/register", "Введите корректный email");
  if (password.length < 8 || !/[A-Za-zА-Яа-я]/.test(password) || !/\d/.test(password)) {
    fail("/register", "Пароль: минимум 8 символов, буквы и цифры");
  }
  if (await prisma.user.findUnique({ where: { email } })) fail("/register", "Этот email уже зарегистрирован");

  const isFirstUser = (await prisma.user.count()) === 0;
  const user = await prisma.user.create({
    data: { name, email, passwordHash: await hashPassword(password), role: isFirstUser ? "ADMIN" : "MANAGER" },
  });
  await createSession(user.id);
  redirect("/");
}

export async function login(formData: FormData) {
  const email = value(formData, "email").toLowerCase();
  const password = value(formData, "password");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) fail("/login", "Неверный email или пароль");
  if (!user.isActive) fail("/login", "Аккаунт заблокирован администратором");
  await createSession(user.id);
  redirect("/");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

export async function updateUserAccess(userId: string, formData: FormData) {
  const admin = await requireAdmin();
  if (userId === admin.id) return;
  const role = value(formData, "role") === "ADMIN" ? "ADMIN" : "MANAGER";
  const isActive = formData.get("isActive") === "on";
  await prisma.user.update({ where: { id: userId }, data: { role, isActive } });
  if (!isActive) await prisma.session.deleteMany({ where: { userId } });
}
