export type Strategy = 'snowball' | 'avalanche';

export type Debt = {
  id: string;
  name: string;
  /** Balance when the debt was first added, used to compute "paid off" progress. */
  originalBalance: number;
  /** Current outstanding balance, updated as the user logs payments. */
  currentBalance: number;
  /** Annual percentage rate, e.g. 24.99 for 24.99%. */
  apr: number;
  minPayment: number;
};

export type Snowflake = {
  id: string;
  amount: number;
  note?: string;
  dateISO: string;
  /** Days the payoff date moved up by, snapshotted when this snowflake was logged. */
  daysSaved: number;
};

export type Settings = {
  strategy: Strategy;
  extraMonthly: number;
};
