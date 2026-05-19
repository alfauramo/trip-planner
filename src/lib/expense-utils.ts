interface ExpenseEvent {
  id: string;
  name: string;
  cost_amount?: number | null;
  cost_currency?: string | null;
  cost_paid?: boolean;
  day_id?: string;
  payer_id?: string | null;
  participants?: string[] | null;
  category?: string | null;
}

interface MemberInfo {
  id: string;
  email?: string;
}

export interface MemberBalance {
  memberId: string;
  email: string;
  paid: number;
  owes: number;
  balance: number;
}

export interface Settlement {
  fromId: string;
  toId: string;
  fromEmail: string;
  toEmail: string;
  amount: number;
}

export function computeSettlements(
  events: ExpenseEvent[],
  members: MemberInfo[],
): { totalExpenses: number; memberBalances: MemberBalance[]; settlements: Settlement[] } {
  const memberBalances: MemberBalance[] = members.map((m) => ({
    memberId: m.id,
    email: m.email || '?',
    paid: 0,
    owes: 0,
    balance: 0,
  }));
  const allMemberIds = members.map((m) => m.id);
  let totalExpenses = 0;
  for (const event of events) {
    const amount = event.cost_amount ?? 0;
    if (amount <= 0) continue;
    totalExpenses += amount;
    const payerIdx = memberBalances.findIndex((b) => b.memberId === event.payer_id);
    if (payerIdx !== -1) memberBalances[payerIdx].paid += amount;
    const participants = event.participants && event.participants.length > 0 ? event.participants : allMemberIds;
    const share = amount / participants.length;
    for (const pid of participants) {
      const idx = memberBalances.findIndex((b) => b.memberId === pid);
      if (idx !== -1) memberBalances[idx].owes += share;
    }
  }
  for (const mb of memberBalances) mb.balance = mb.paid - mb.owes;
  const sorted = [...memberBalances].sort((a, b) => b.balance - a.balance);
  const settlements: Settlement[] = [];
  let i = 0;
  let j = sorted.length - 1;
  while (i < j) {
    const debtor = sorted[j];
    const creditor = sorted[i];
    const amount = Math.min(Math.abs(debtor.balance), creditor.balance);
    if (amount < 0.01) {
      i++;
      j--;
      continue;
    }
    settlements.push({
      fromId: debtor.memberId,
      toId: creditor.memberId,
      fromEmail: debtor.email,
      toEmail: creditor.email,
      amount: Math.round(amount * 100) / 100,
    });
    debtor.balance += amount;
    creditor.balance -= amount;
    if (Math.abs(debtor.balance) < 0.01) j--;
    if (creditor.balance < 0.01) i++;
  }
  return { totalExpenses, memberBalances, settlements };
}
