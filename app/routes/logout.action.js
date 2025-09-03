import { logout } from "../utils/session.server.js";
export async function action({ request }) {
return logout(request);
}