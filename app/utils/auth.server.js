import { prisma } from "./db.server.js";
import bcrypt from "bcryptjs";


export async function register(email, password) {
  const hash = await bcrypt.hash(password, 12);
  return prisma.user.create({ data: { email, password: hash } });
}


export async function verifyLogin(email, password) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return null;
  return user;
}