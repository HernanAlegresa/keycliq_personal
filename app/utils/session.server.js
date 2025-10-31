import { createCookieSessionStorage, redirect } from "@remix-run/node";
import { prisma } from "./db.server.js";


const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) throw new Error("SESSION_SECRET must be set");


// Helper to detect if request is HTTPS (works behind Heroku proxy)
function isSecure(request) {
  if (!request) {
    // If no request object, assume secure in production (defensive)
    return process.env.NODE_ENV === "production";
  }
  
  if (process.env.NODE_ENV !== "production") {
    return false; // Allow non-secure cookies in development
  }
  
  // In production on Heroku, check X-Forwarded-Proto header first
  // This is set by Heroku's SSL termination layer
  const forwardedProto = request.headers.get("X-Forwarded-Proto");
  if (forwardedProto === "https") {
    return true;
  }
  
  // Fallback: check the URL protocol directly
  try {
    const url = new URL(request.url);
    return url.protocol === "https:";
  } catch (e) {
    // If URL parsing fails, default to secure in production (defensive)
    console.warn("Failed to parse request URL for HTTPS detection:", e);
    return true;
  }
}

export function createSessionStorage(request) {
  return createCookieSessionStorage({
    cookie: {
      name: "__session",
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secrets: [sessionSecret],
      secure: isSecure(request),
      maxAge: 60 * 60 * 24 * 30,
    },
  });
}

// Legacy export for backward compatibility (updates secure flag based on request)
export function getSession(cookieHeader, request = null) {
  // If request is provided, use dynamic session storage
  if (request) {
    const { getSession } = createSessionStorage(request);
    return getSession(cookieHeader);
  }
  
  // Fallback: create default session storage (for cases without request)
  const { getSession } = createCookieSessionStorage({
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
  return getSession(cookieHeader);
}

export function commitSession(session, request = null) {
  if (request) {
    const { commitSession } = createSessionStorage(request);
    return commitSession(session);
  }
  
  const { commitSession } = createCookieSessionStorage({
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
  return commitSession(session);
}

export function destroySession(session, request = null) {
  if (request) {
    const { destroySession } = createSessionStorage(request);
    return destroySession(session);
  }
  
  const { destroySession } = createCookieSessionStorage({
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
  return destroySession(session);
}


export async function createUserSession(userId, redirectTo, request = null) {
  try {
    const cookieHeader = request ? request.headers.get("Cookie") : null;
    const session = await getSession(cookieHeader, request);
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    
    // Create database session record
    await prisma.session.create({ data: { userId, expiration: expires } });
    
    session.set("userId", userId);
    const cookieString = await commitSession(session, request);
    
    return redirect(redirectTo, { headers: { "Set-Cookie": cookieString } });
  } catch (error) {
    // Log detailed error for debugging
    console.error("Error in createUserSession:", {
      error: error.message,
      stack: error.stack,
      userId,
      hasRequest: !!request,
      protocol: request ? (request.headers.get("X-Forwarded-Proto") || new URL(request.url).protocol) : "unknown"
    });
    throw error; // Re-throw to let Remix handle it properly
  }
}


export async function requireUserId(request) {
const session = await getSession(request.headers.get("Cookie"), request);
const userId = session.get("userId");
if (!userId) throw redirect("/welcome");
return userId;
}


export async function logout(request) {
  const session = await getSession(request.headers.get("Cookie"), request);
  const userId = session.get("userId");
  
  // Clean up database session if userId exists
  if (userId) {
    try {
      await prisma.session.deleteMany({
        where: { userId }
      });
    } catch (error) {
      console.error("Error cleaning up database sessions:", error);
    }
  }
  
  return redirect("/welcome", { 
    headers: { "Set-Cookie": await destroySession(session, request) } 
  });
}