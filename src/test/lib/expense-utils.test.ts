import { describe, it, expect } from 'vitest';
import { computeSettlements } from '../../lib/expense-utils';

describe('computeSettlements', () => {
  const members = [
    { id: 'user-1', email: 'alice@test.com' },
    { id: 'user-2', email: 'bob@test.com' },
    { id: 'user-3', email: 'charlie@test.com' },
  ];

  it('returns zero for empty events', () => {
    const result = computeSettlements([], members);
    expect(result.totalExpenses).toBe(0);
    expect(result.settlements).toHaveLength(0);
    expect(result.memberBalances).toHaveLength(3);
  });

  it('handles single payer, single participant (no settlement needed)', () => {
    const events = [{ id: 'e1', name: 'Lunch', cost_amount: 30, payer_id: 'user-1', participants: ['user-1'] }];
    const result = computeSettlements(events, members);
    expect(result.totalExpenses).toBe(30);
    expect(result.settlements).toHaveLength(0);
  });

  it('splits equally when no participants specified', () => {
    const events = [{ id: 'e1', name: 'Dinner', cost_amount: 90, payer_id: 'user-1' }];
    const result = computeSettlements(events, members);
    expect(result.totalExpenses).toBe(90);
    // Alice paid 90, Bob and Charlie owe 30 each
    const bobBalance = result.memberBalances.find((b) => b.memberId === 'user-2');
    const charlieBalance = result.memberBalances.find((b) => b.memberId === 'user-3');
    expect(bobBalance?.owes).toBeCloseTo(30, 1);
    expect(charlieBalance?.owes).toBeCloseTo(30, 1);
  });

  it('computes correct settlements for multi-person expenses', () => {
    const events = [
      { id: 'e1', name: 'Hotel', cost_amount: 300, payer_id: 'user-1' },
      { id: 'e2', name: 'Uber', cost_amount: 30, payer_id: 'user-2', participants: ['user-1', 'user-2'] },
    ];
    const result = computeSettlements(events, members);

    expect(result.totalExpenses).toBe(330);

    // Hotel: $300 split 3 ways = $100 each. Alice paid, Bob owes $100, Charlie owes $100.
    // Uber: $30 split 2 ways (user-1, user-2) = $15 each. Bob paid, Alice owes $15.
    // Bob net: paid $30, owes $100 → balance -$70
    // Bob settlement: owes Alice $100 - $15 (Alice's Uber share) = $85 net to Alice
    // Charlie owes Alice $100
    const settlements = result.settlements;
    expect(settlements.length).toBe(2);

    const bobToAlice = settlements.find((s) => s.fromId === 'user-2' && s.toId === 'user-1');
    expect(bobToAlice?.amount).toBeCloseTo(85, 0);

    const charlieToAlice = settlements.find((s) => s.fromId === 'user-3' && s.toId === 'user-1');
    expect(charlieToAlice?.amount).toBeCloseTo(100, 0);
  });

  it('handles zero-cost events gracefully', () => {
    const events = [{ id: 'e1', name: 'Free', cost_amount: 0, payer_id: 'user-1' }];
    const result = computeSettlements(events, members);
    expect(result.totalExpenses).toBe(0);
  });

  it('handles null amounts', () => {
    const events = [{ id: 'e1', name: 'Null cost', cost_amount: null, payer_id: 'user-1' }];
    const result = computeSettlements(events, members);
    expect(result.totalExpenses).toBe(0);
  });

  it('handles events with payment but unknown payer gracefully', () => {
    const events = [{ id: 'e1', name: 'Mystery', cost_amount: 50, payer_id: 'unknown-id' }];
    const result = computeSettlements(events, members);
    expect(result.totalExpenses).toBe(50);
    // All 3 members are in memberBalances (since we track all members now)
    expect(result.memberBalances).toHaveLength(3);
  });

  it('handles negative amounts (rebates/refunds) by ignoring', () => {
    const events = [{ id: 'e1', name: 'Refund', cost_amount: -50, payer_id: 'user-1' }];
    const result = computeSettlements(events, members);
    expect(result.totalExpenses).toBe(0);
  });
});
