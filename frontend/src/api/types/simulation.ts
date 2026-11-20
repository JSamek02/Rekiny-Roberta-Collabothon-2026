export type AssetKey = 'stocks' | 'bonds' | 'gold' | 'cash';

export type AssetAllocations = {
  stocks: number;
  bonds: number;
  gold: number;
  cash: number;
};

export type SimulationEventSummary = {
  id: string;
  order_index: number;
  title: string;
  period: string;
  total_quarters: number;
  starting_capital: number;
  initial_context: {
    headline: string;
    description: string;
    key_learning_question: string;
  };
};

export type SimulationEventsResponse = {
  events: SimulationEventSummary[];
  data_sources: Record<string, string>;
};

export type QuarterHistoryEntry = {
  quarter: string;
  portfolio_value: number;
  real_value: number;
  quarter_return_pct: number;
  total_nominal_return_pct: number;
  total_real_return_pct: number;
  drawdown_pct: number;
  headline: string;
  context: string;
  lesson: string;
  benchmark_returns: Record<AssetKey, number>;
  quarter_cpi_pct: number;
  allocations: AssetAllocations;
};

export type RobertVerdict = {
  mood: 'sunglasses_and_suit' | 'happy' | 'supportive_with_lifejacket';
  message: string;
};

export type SimulationDebrief = {
  initial_capital: number;
  final_capital: number;
  nominal_return_pct: number;
  real_capital: number;
  real_return_pct: number;
  max_drawdown_pct: number;
  rebalances_count: number;
  robert_verdict: RobertVerdict;
  educational_takeaways: string[];
  badges_earned: string[];
  xp_awarded: number;
  sharcoins_awarded: number;
};

export type SimulationSession = {
  event_id: string;
  event_title: string;
  status: 'awaiting_initial_investment' | 'in_progress' | 'completed';
  current_quarter_index: number;
  total_quarters: number;
  initial_capital: number;
  current_capital: number;
  peak_capital: number;
  max_drawdown_pct: number;
  cumulative_inflation_factor: number;
  allocations: AssetAllocations;
  rebalances_count: number;
  history: QuarterHistoryEntry[];
  debrief?: SimulationDebrief;
};

export type SimulationEventDetailResponse = {
  event: SimulationEventSummary & {
    data_sources: Record<string, string>;
  };
  active_session: SimulationSession | null;
};

export type StepQuarterResponse = {
  status: 'ok' | 'completed';
  result?: {
    quarter_data: QuarterHistoryEntry;
    is_finished: boolean;
    current_capital: number;
    allocations: AssetAllocations;
    quarters_completed: number;
    total_quarters: number;
    debrief?: SimulationDebrief;
  };
  full_session: SimulationSession;
};
