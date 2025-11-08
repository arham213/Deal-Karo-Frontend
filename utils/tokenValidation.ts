import { getToken } from "./secureStore";

/**
 * Decode JWT token without verification (for client-side expiration check)
 * Note: This only checks expiration, not signature. Backend should always verify signature.
 * Uses base64 decoding compatible with both web and React Native
 */
function decodeJWT(token: string): { exp?: number; iat?: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    
    const base64Url = parts[1];
    if (!base64Url) return null;
    
    // Replace URL-safe base64 characters with standard base64
    let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    
    // Add padding if needed
    while (base64.length % 4) {
      base64 += "=";
    }
    
    // Decode base64 - try different methods for compatibility
    let jsonPayload: string;
    
    try {
      // Try web atob first
      if (typeof atob !== "undefined") {
        jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        );
      } else if (typeof Buffer !== "undefined") {
        // Try Node.js Buffer (available in some React Native environments)
        jsonPayload = Buffer.from(base64, "base64").toString("utf-8");
      } else {
        // Manual base64 decoding for React Native
        const chars = base64.split("");
        const lookup = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        let bytes: number[] = [];
        let i = 0;
        
        while (i < chars.length) {
          const encoded1 = lookup.indexOf(chars[i++]);
          const encoded2 = lookup.indexOf(chars[i++]);
          const encoded3 = lookup.indexOf(chars[i++]);
          const encoded4 = lookup.indexOf(chars[i++]);
          
          if (encoded1 === -1 || encoded2 === -1) break;
          
          const bitmap = (encoded1 << 18) | (encoded2 << 12) | ((encoded3 !== -1 ? encoded3 : 64) << 6) | (encoded4 !== -1 ? encoded4 : 64);
          
          bytes.push((bitmap >> 16) & 255);
          if (encoded3 !== -1 && encoded3 !== 64) bytes.push((bitmap >> 8) & 255);
          if (encoded4 !== -1 && encoded4 !== 64) bytes.push(bitmap & 255);
        }
        
        jsonPayload = String.fromCharCode.apply(null, bytes);
      }
      
      return JSON.parse(jsonPayload);
    } catch (decodeError) {
      console.error("Error decoding base64:", decodeError);
      return null;
    }
  } catch (error) {
    console.error("Error decoding JWT:", error);
    return null;
  }
}

/**
 * Check if token is expired
 * Returns true if token is expired or invalid
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = decodeJWT(token);
    if (!decoded || !decoded.exp) {
      return true; // Invalid token format
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    console.error("Error checking token expiration:", error);
    return true; // Assume expired on error
  }
}

/**
 * Check if user has valid authentication
 * Returns { isValid: boolean, token: string | null }
 */
export async function validateAuth(): Promise<{ isValid: boolean; token: string | null }> {
  try {
    const token = await getToken();
    
    if (!token) {
      return { isValid: false, token: null };
    }
    
    if (isTokenExpired(token)) {
      return { isValid: false, token: null };
    }
    
    return { isValid: true, token };
  } catch (error) {
    console.error("Error validating auth:", error);
    return { isValid: false, token: null };
  }
}

