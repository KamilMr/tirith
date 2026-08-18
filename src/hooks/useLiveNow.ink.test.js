import React from 'react';
import {PassThrough} from 'node:stream';
import {Text, render} from 'ink';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {LiveClockProvider} from '../contexts/LiveClockContext.js';
import useLiveNow from './useLiveNow.js';

const Consumer = ({label, isRunning}) => {
  const now = useLiveNow(isRunning);
  return <Text>{`${label}: ${now.toISOString()}`}</Text>;
};

const flushReact = () => new Promise(resolve => setImmediate(resolve));

describe('shared live clock Ink rendering', () => {
  beforeEach(() => {
    vi.useFakeTimers({toFake: ['Date', 'setInterval', 'clearInterval']});
    vi.setSystemTime(new Date('2026-08-18T10:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('commits one Ink render per tick for multiple running consumers', async () => {
    const stdout = new PassThrough();
    stdout.columns = 80;
    stdout.rows = 24;
    const onRender = vi.fn();
    const app = render(
      <LiveClockProvider>
        <Consumer label="first" isRunning />
        <Consumer label="second" isRunning />
        <Consumer label="idle" isRunning={false} />
      </LiveClockProvider>,
      {
        stdout,
        interactive: false,
        patchConsole: false,
        exitOnCtrlC: false,
        onRender,
      },
    );

    await flushReact();
    await app.waitUntilRenderFlush();
    expect(vi.getTimerCount()).toBe(1);
    onRender.mockClear();

    vi.advanceTimersByTime(1000);
    await flushReact();
    await app.waitUntilRenderFlush();

    expect(onRender).toHaveBeenCalledOnce();

    app.unmount();
    await app.waitUntilExit();
    expect(vi.getTimerCount()).toBe(0);
  });
});
