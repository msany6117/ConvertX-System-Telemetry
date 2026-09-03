import path from 'path';
import crypto from 'crypto';
import dns from 'dns/promises';
import net from 'net';
import { Request, Response, NextFunction } from 'express';
import { CONFIG } from './config';

/**
 * Sanitize filename to prevent path traversal and shell injection
 */
export function sanitizeFilename(rawName: string): string {
  if (!rawName || typeof rawName !== 'string') {
    return 'file_' + crypto.randomBytes(4).toString('hex');
  }
  // Extract basename to strip any path components
  const base = path.basename(rawName).trim();
  // Remove control characters, null bytes, quotes, semicolons, backticks, dollar signs, pipes
  const sanitized = base.replace(/[\0\x00-\x1f\x7f<>:"/\\|?*`$;!&]/g, '_');
  // Prevent leading dot or double dot
  const clean = sanitized.replace(/^(\.\.?)+/, '');
  return clean.length > 0 ? clean.substring(0, 120) : 'file_' + crypto.randomBytes(4).toString('hex');
}

/**
 * Generate a safe unique ID
 */
export function generateUniqueId(): string {
  return crypto.randomBytes(12).toString('hex');
}

/**
 * Check if an IP address is private/internal (SSRF protection)
 */
export function isPrivateIP(ip: string): boolean {
  if (!net.isIP(ip)) return true;

  // IPv4 checks
  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number);
    if (parts[0] === 10) return true; // 10.0.0.0/8
    if (parts[0] === 127) return true; // Loopback
    if (parts[0] === 0) return true; // 0.0.0.0/8
    if (parts[0] === 169 && parts[1] === 254) return true; // Link-local
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true; // 172.16.0.0/12
    if (parts[0] === 192 && parts[1] === 168) return true; // 192.168.0.0/16
    if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) return true; // CGNAT
    if (parts[0] >= 224) return true; // Multicast / Reserved
    return false;
  }

  // IPv6 checks
  if (net.isIPv6(ip)) {
    const norm = ip.toLowerCase();
    if (norm === '::1' || norm === '::' || norm.startsWith('fe80:') || norm.startsWith('fc00:') || norm.startsWith('fd00:')) {
      return true;
    }
    return false;
  }

  return true;
}

/**
 * Validate URL for safe downloading (prevent SSRF)
 */
export async function validateSafeUrl(rawUrl: string): Promise<{ valid: boolean; url?: URL; error?: string }> {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { valid: false, error: 'Only HTTP and HTTPS protocols are allowed.' };
    }

    const hostname = parsed.hostname;
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal') ||
      hostname === '169.254.169.254'
    ) {
      return { valid: false, error: 'Access to private or local hostnames is forbidden.' };
    }

    // Resolve DNS
    const addresses = await dns.lookup(hostname, { all: true });
    if (!addresses || addresses.length === 0) {
      return { valid: false, error: 'Could not resolve domain name.' };
    }

    for (const addr of addresses) {
      if (isPrivateIP(addr.address)) {
        return { valid: false, error: 'Resolved IP belongs to private/internal network.' };
      }
    }

    return { valid: true, url: parsed };
  } catch (err: any) {
    return { valid: false, error: err.message || 'Invalid URL.' };
  }
}

/**
 * In-memory rate limiter per client IP
 */
interface RateRecord {
  count: number;
  resetAt: number;
  jobsCount: number;
}
const ipRateMap = new Map<string, RateRecord>();

export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress || '127.0.0.1';
  const now = Date.now();

  let record = ipRateMap.get(ip);
  if (!record || now > record.resetAt) {
    record = { count: 1, resetAt: now + CONFIG.RATE_LIMIT_WINDOW_MS, jobsCount: 0 };
    ipRateMap.set(ip, record);
  } else {
    record.count++;
  }

  // Cleanup old records if map gets too large
  if (ipRateMap.size > 5000) {
    for (const [k, v] of ipRateMap.entries()) {
      if (now > v.resetAt) ipRateMap.delete(k);
    }
  }

  if (record.count > CONFIG.RATE_LIMIT_MAX_REQUESTS) {
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again in a minute.',
      retryAfter: Math.ceil((record.resetAt - now) / 1000)
    });
    return;
  }

  res.setHeader('X-RateLimit-Limit', CONFIG.RATE_LIMIT_MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, CONFIG.RATE_LIMIT_MAX_REQUESTS - record.count));
  res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetAt / 1000));
  next();
}
