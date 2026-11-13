/**
 * Agentic Robinhood account for Nemesis trade wiring (MCP nickname).
 * Hosted UI cannot call RH MCP; agents resolve the agentic account via
 * get_accounts (agentic_allowed) — never embed the full account number in
 * the browser bundle (TD-17).
 */
export const RH_AGENTIC_ACCOUNT = {
  /** Agents: resolve with get_accounts where agentic_allowed is true. */
  resolveHint: 'agentic_allowed' as const,
  nickname: 'MCP',
  masked: '••••0788',
} as const
