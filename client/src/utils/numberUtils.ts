/**
 * Parses user input string supporting:
 * - Negative signs ('-')
 * - Dollar signs ('$')
 * - Decimal numbers ('.')
 * - Plus signs ('+')
 * - Regular numbers
 *
 * Examples:
 *   "-$150.50" => -150.5
 *   "$-150"    => -150
 *   "$250.75"  => 250.75
 *   "-50.25"   => -50.25
 *   "+100"     => 100
 *   "0"        => 0
 */
export function parseLoggedAmount(val: string | number | undefined | null): number | null {
  if (val === undefined || val === null) return null;
  if (typeof val === 'number') {
    return isNaN(val) ? null : Math.round(val * 100) / 100;
  }
  const str = String(val).trim();
  if (!str) return null;

  // Check if negative
  const isNegative = str.includes('-');

  // Strip everything except digits and decimal point
  const clean = str.replace(/[^0-9.]/g, '');
  if (!clean || clean === '.') return null;

  const num = parseFloat(clean);
  if (isNaN(num)) return null;

  const result = isNegative ? -num : num;
  return Math.round(result * 100) / 100;
}

/**
 * Toggles positive/negative sign on an input string while preserving '$' or decimals
 */
export function toggleAmountSign(str: string): string {
  const trimmed = str.trim();
  if (!trimmed) return '-';
  if (trimmed === '-') return '';

  if (trimmed.includes('-')) {
    // Remove the minus sign
    return trimmed.replace(/-/g, '');
  } else {
    // Add minus sign: if starts with '$', insert '-' before '$' or after depending on convention
    if (trimmed.startsWith('$')) {
      return `-$${trimmed.slice(1)}`;
    }
    return `-${trimmed}`;
  }
}

/**
 * Formats a logged amount for display with clean sign prefix
 */
export function formatLoggedAmount(amount: number): string {
  if (amount > 0) return `+${amount}`;
  if (amount < 0) return `${amount}`;
  return '0';
}
