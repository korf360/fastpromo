import { hash, compare } from "bcryptjs";
import {
  calculateCashbackEarned,
  calculateMaxCashbackRedeem,
  formatCents,
  getCashbackPercent,
  getCashbackWalletCoverPercent,
  STRIPE_MIN_CHARGE_CENTS,
} from "@/lib/cashback-config";

export async function hashPassword(password: string) {
  return hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return compare(password, passwordHash);
}

export {
  calculateCashbackEarned,
  calculateMaxCashbackRedeem,
  formatCents,
  getCashbackPercent,
  getCashbackWalletCoverPercent,
  STRIPE_MIN_CHARGE_CENTS,
};
