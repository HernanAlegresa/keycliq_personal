import { createCookieSessionStorage, redirect } from "@remix-run/node";
import { prisma } from "./db.server.js";


const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) throw new Error("SESSION_SECRET must be set");


export const { getSession, commitSession, destroySession } =
createCookieSessionStorage({
cookie: {
name: "__session",
httpOnly: true,
path: "/",
sameSite: "lax",
secrets: [sessionSecret],
secure: process.env.NODE_ENV === "production",
maxAge: 60 * 60 * 24 * 30,
},
});


export async function createUserSession(userId, redirectTo) {
const session = await getSession();
const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
await prisma.session.create({ data: { userId, expiration: expires } });
session.set("userId", userId);
return redirect(redirectTo, { headers: { "Set-Cookie": await commitSession(session) } });
}


export async function requireUserId(request) {
const session = await getSession(request.headers.get("Cookie"));
const userId = session.get("userId");
if (!userId) throw redirect("/login");
return userId;
}


export async function logout(request) {
const session = await getSession(request.headers.get("Cookie"));
return redirect("/", { headers: { "Set-Cookie": await destroySession(session) } });
}