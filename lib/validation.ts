/**
 * Input validation utilities for monitors and other entities.
 */

/**
 * Validates that a URL is valid and uses HTTP or HTTPS protocol.
 */
export function validateUrl(url: string): { valid: boolean; error?: string } {
  if (!url || typeof url !== "string") {
    return { valid: false, error: "URL is required" };
  }

  try {
    const parsed = new URL(url);
    const protocol = parsed.protocol.toLowerCase();

    if (protocol !== "http:" && protocol !== "https:") {
      return {
        valid: false,
        error: "URL must use HTTP or HTTPS protocol",
      };
    }

    if (!parsed.hostname) {
      return { valid: false, error: "URL must have a valid hostname" };
    }

    // Prevent SSRF attacks by blocking private/internal IPs
    // This is a basic check - consider using a library like 'ipaddr.js' for production
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      hostname.startsWith("172.16.") ||
      hostname.startsWith("172.17.") ||
      hostname.startsWith("172.18.") ||
      hostname.startsWith("172.19.") ||
      hostname.startsWith("172.20.") ||
      hostname.startsWith("172.21.") ||
      hostname.startsWith("172.22.") ||
      hostname.startsWith("172.23.") ||
      hostname.startsWith("172.24.") ||
      hostname.startsWith("172.25.") ||
      hostname.startsWith("172.26.") ||
      hostname.startsWith("172.27.") ||
      hostname.startsWith("172.28.") ||
      hostname.startsWith("172.29.") ||
      hostname.startsWith("172.30.") ||
      hostname.startsWith("172.31.")
    ) {
      return {
        valid: false,
        error: "Cannot monitor private/internal IP addresses",
      };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }
}

/**
 * Validates HTTP method.
 */
export function validateMethod(method: string): { valid: boolean; error?: string } {
  const validMethods = ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];
  const upperMethod = method.toUpperCase();

  if (!validMethods.includes(upperMethod)) {
    return {
      valid: false,
      error: `Method must be one of: ${validMethods.join(", ")}`,
    };
  }

  return { valid: true };
}

/**
 * Validates check interval (in seconds).
 */
export function validateCheckInterval(
  seconds: number
): { valid: boolean; error?: string } {
  if (typeof seconds !== "number" || seconds < 300) {
    return {
      valid: false,
      error: "Check interval must be at least 300 seconds (5 minutes)",
    };
  }

  if (seconds > 86400) {
    return {
      valid: false,
      error: "Check interval cannot exceed 86400 seconds (24 hours)",
    };
  }

  return { valid: true };
}

/**
 * Validates timeout (in seconds).
 */
export function validateTimeout(seconds: number): { valid: boolean; error?: string } {
  if (typeof seconds !== "number" || seconds < 1) {
    return {
      valid: false,
      error: "Timeout must be at least 1 second",
    };
  }

  if (seconds > 300) {
    return {
      valid: false,
      error: "Timeout cannot exceed 300 seconds (5 minutes)",
    };
  }

  return { valid: true };
}

/**
 * Validates HTTP status code.
 */
export function validateStatusCode(code: number): { valid: boolean; error?: string } {
  if (typeof code !== "number" || code < 100 || code > 599) {
    return {
      valid: false,
      error: "Status code must be between 100 and 599",
    };
  }

  return { valid: true };
}

/**
 * Validates monitor name.
 */
export function validateMonitorName(name: string): { valid: boolean; error?: string } {
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return { valid: false, error: "Monitor name is required" };
  }

  if (name.length > 255) {
    return { valid: false, error: "Monitor name cannot exceed 255 characters" };
  }

  return { valid: true };
}
