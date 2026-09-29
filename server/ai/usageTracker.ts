import { AI_CONFIG } from './config';

interface UserUsageRecord {
  requestsToday: number;
  totalTokensToday: number;
  lastRequestTime: number;
  dayString: string;
}

class AIUsageTracker {
  private userUsageMap: Map<string, UserUsageRecord> = new Map();

  private getTodayString(): string {
    return new Date().toISOString().slice(0, 10);
  }

  checkQuota(clientId: string, inputLength: number, isPro: boolean = false): {
    allowed: boolean;
    reason?: string;
    remainingRequests: number;
  } {
    const today = this.getTodayString();
    const maxLen = isPro ? AI_CONFIG.proMaxInputLength : AI_CONFIG.freeMaxInputLength;
    const dailyLimit = isPro ? AI_CONFIG.proDailyLimit : AI_CONFIG.freeDailyLimit;

    if (inputLength > maxLen) {
      return {
        allowed: false,
        reason: `Input text exceeds the maximum allowed length of ${maxLen.toLocaleString()} characters.`,
        remainingRequests: 0,
      };
    }

    let record = this.userUsageMap.get(clientId);
    if (!record || record.dayString !== today) {
      record = {
        requestsToday: 0,
        totalTokensToday: 0,
        lastRequestTime: Date.now(),
        dayString: today,
      };
      this.userUsageMap.set(clientId, record);
    }

    if (record.requestsToday >= dailyLimit) {
      return {
        allowed: false,
        reason: `Daily free limit of ${dailyLimit} AI requests reached. Resets at midnight UTC.`,
        remainingRequests: 0,
      };
    }

    return {
      allowed: true,
      remainingRequests: dailyLimit - record.requestsToday,
    };
  }

  recordUsage(clientId: string, tokens: number = 0): void {
    const today = this.getTodayString();
    let record = this.userUsageMap.get(clientId);
    if (!record || record.dayString !== today) {
      record = {
        requestsToday: 0,
        totalTokensToday: 0,
        lastRequestTime: Date.now(),
        dayString: today,
      };
      this.userUsageMap.set(clientId, record);
    }
    record.requestsToday += 1;
    record.totalTokensToday += tokens;
    record.lastRequestTime = Date.now();
  }

  getStatsForClient(clientId: string, isPro: boolean = false): {
    requestsToday: number;
    dailyLimit: number;
    remainingRequests: number;
  } {
    const today = this.getTodayString();
    const dailyLimit = isPro ? AI_CONFIG.proDailyLimit : AI_CONFIG.freeDailyLimit;
    const record = this.userUsageMap.get(clientId);
    if (!record || record.dayString !== today) {
      return {
        requestsToday: 0,
        dailyLimit,
        remainingRequests: dailyLimit,
      };
    }
    return {
      requestsToday: record.requestsToday,
      dailyLimit,
      remainingRequests: Math.max(0, dailyLimit - record.requestsToday),
    };
  }
}

export const aiUsageTracker = new AIUsageTracker();
