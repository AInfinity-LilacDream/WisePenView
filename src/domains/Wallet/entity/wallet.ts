/**
 * 钱包流水领域类型；由 /user/wallet/listTransactions 的 list 项映射。
 */
import type { EnumValue } from '@/utils/enum';
import { createEnum } from '@/utils/enum';

/** 展示用分类（含小组划拨流水） */
export const WALLET_TRANSACTION_KIND = createEnum([
  { value: 'RECHARGE', key: 'RECHARGE', label: '充值' },
  { value: 'SPEND', key: 'SPEND', label: '消费' },
  { value: 'TRANSFER_IN', key: 'TRANSFER_IN', label: '划入' },
  { value: 'TRANSFER_OUT', key: 'TRANSFER_OUT', label: '划出' },
] as const);

export type WalletTransactionKind = EnumValue<typeof WALLET_TRANSACTION_KIND>;

/**
 * 接口：traceId、tokenTransactionType、tokenCount（可为字符串）、meta、operatorName、createTime。
 */
export interface WalletTransactionRecord {
  traceId: string;
  time: string;
  type: WalletTransactionKind;
  amount: number;
  title: string;
  subTitle: string;
  operatorName?: string;
}
