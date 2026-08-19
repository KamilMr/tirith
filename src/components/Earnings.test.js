import {describe, expect, it} from 'vitest';
import Earnings from './Earnings.js';

const pricing = {
  hourlyRate: 115,
  earnings: 345,
  currency: 'PLN',
  dateRangeDays: 1,
  projectCount: 1,
  taskCount: 1,
  expectedEarnings: 920,
};

describe('Earnings', () => {
  it('labels expected period earnings as Should Earn', () => {
    const view = Earnings({pricing, loading: false});

    expect(view.props.items.map(item => item.key)).toEqual([
      'Projects',
      'Tasks',
      'Earned',
      'Should Earn',
    ]);
  });

  it('shows earning participant counts and the earned amount without the rate', () => {
    const view = Earnings({
      pricing,
      loading: false,
      showExpectedEarnings: false,
    });

    expect(view.props.items.map(item => item.key)).toEqual([
      'Projects',
      'Tasks',
      'Earned',
    ]);
  });
});
