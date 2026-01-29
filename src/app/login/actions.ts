"use server";

import { cookies } from "next/headers";
import crypto from "crypto";
import { supabase } from "@/lib/supabase";

const AUTH_SESSION_VALUE = 'authenticated';
const SESSION_MAX_AGE = 60 * 60 * 24 * 3; // 3 dias

function verifyPassword(password: string, storedHash: string, salt: string): boolean {
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    try {
        return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'));
    } catch {
        return false;
    }
}

export async function loginAction(formData: FormData) {
    const email = formData.get("username") as string;
    const password = formData.get("password") as string;

    if (!email || !password || email.length > 100 || password.length > 100) {
        return { success: false, error: "Datos de entrada invalidos" };
    }

    try {
        // Buscar usuario en la tabla dashboard_users
        const { data: user, error } = await supabase
            .from("dashboard_users")
            .select("id, email, name, password_hash, salt, is_active")
            .eq("email", email.toLowerCase().trim())
            .eq("is_active", true)
            .single();

        if (error || !user) {
            return { success: false, error: "Usuario o contrasena incorrectos" };
        }

        if (!verifyPassword(password, user.password_hash, user.salt)) {
            return { success: false, error: "Usuario o contrasena incorrectos" };
        }

        const cookieStore = await cookies();
        cookieStore.set("auth_session", AUTH_SESSION_VALUE, {
            path: "/",
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: SESSION_MAX_AGE,
        });

        // Cookie de ultima actividad para timeout por inactividad
        cookieStore.set("last_activity", Date.now().toString(), {
            path: "/",
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: SESSION_MAX_AGE,
        });

        return { success: true };
    } catch (err) {
        console.error("Login error:", err);
        return { success: false, error: "Error al iniciar sesion" };
    }
}

export async function logoutAction() {
    const cookieStore = await cookies();
    cookieStore.delete("auth_session");
    cookieStore.delete("last_activity");
    return { success: true };
}
