export const decodeJwt = (token) => {
  if (!token) return null;
  try {
    const [, base64Payload] = token.split(".");
    let base64 = base64Payload.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) base64 += "=";
    const decoded = atob(base64);
    return JSON.parse(decoded);
  } catch (err) {
    console.error("Failed to decode JWT:", err);
    return null;
  }
};
