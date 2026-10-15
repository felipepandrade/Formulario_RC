import { describe, it, expect } from 'vitest';
import { formatBRL, formatQuantity, parseDecimal, sanitizeDecimalInput, toFileNameFragment } from './format';

describe('parseDecimal', () => {
  it.each([
    ['10', 10],
    ['10,5', 10.5],
    ['10.5', 10.5],
    ['1.500', 1500],
    ['1.500,50', 1500.5],
    ['2.000.000', 2000000],
    [' 3 ', 3],
  ])('parses "%s" as %d', (input, expected) => {
    expect(parseDecimal(input)).toBe(expected);
  });

  it.each(['', 'abc', '1,2,3', '-5', '1.2.3,4.5'])('returns NaN for "%s"', (input) => {
    expect(parseDecimal(input)).toBeNaN();
  });
});

describe('formatters', () => {
  it('formats currency and quantities in pt-BR with regular spaces', () => {
    expect(formatBRL(1500.5)).toBe('R$ 1.500,50');
    expect(formatBRL(NaN)).toBe('R$ 0,00');
    expect(formatQuantity(2.5)).toBe('2,5');
  });

  it('keeps only number characters while typing', () => {
    expect(sanitizeDecimalInput('R$ -1.500,50x')).toBe('1.500,50');
  });

  it('builds safe file names without losing accented letters', () => {
    expect(toFileNameFragment('João da Conceição')).toBe('Joao_da_Conceicao');
    expect(toFileNameFragment('***')).toBe('');
  });
});
