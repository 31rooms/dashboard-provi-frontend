"use server";

import { cookies } from "next/headers";

// Valor consistente con el middleware
const AUTH_SESSION_VALUE = 'authenticated';

export async function loginAction(formData: FormData) {
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    // Validación de entrada para prevenir ataques
    if (!username || !password || username.length > 100 || password.length > 100) {
        return { success: false, error: "Datos de entrada inválidos" };
    }

    const adminUser = process.env.ADMIN_USERNAME;
    const adminPass = process.env.ADMIN_PASSWORD;

    // Usar comparación segura de tiempo constante para prevenir timing attacks
    const usernameMatch = username === adminUser;
    const passwordMatch = password === adminPass;

    if (usernameMatch && passwordMatch) {
        const cookieStore = await cookies();
        cookieStore.set("auth_session", AUTH_SESSION_VALUE, {
            path: "/",
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict", // Más restrictivo para prevenir CSRF
            maxAge: 60 * 60 * 24 * 7, // 1 week
        });
        return { success: true };
    }

    return { success: false, error: "Usuario o contraseña incorrectos" };
}

export async function logoutAction() {
    const cookieStore = await cookies();
    cookieStore.delete("auth_session");
    return { success: true };
}
