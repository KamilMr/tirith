import React from 'react';
import {PassThrough} from 'node:stream';
import {render, renderToString} from 'ink';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {LiveClockProvider} from '../contexts/LiveClockContext.js';
import TaskTimeEntries from './TaskTimeEntries.js';

const overlapHarness = vi.hoisted(() => ({
  find: vi.fn(() => []),
}));

vi.mock('../services/timeEntryOverlap.js', () => ({
  findTimeEntryOverlaps: overlapHarness.find,
}));

const flushReact = () => new Promise(resolve => setImmediate(resolve));

const entry = ({id, start, end = null}) => ({
  id,
  task_id: 3,
  title: `Task ${id}`,
  start: new Date(start),
  end: end ? new Date(end) : null,
});

describe('TaskTimeEntries live rendering', () => {
  it('leaves the session heading to its parent while checking overlaps against all entries', () => {
    const selectedTaskEntries = [
      entry({
        id: 1,
        start: '2026-08-18T09:00:00.000Z',
        end: '2026-08-18T09:30:00.000Z',
      }),
    ];
    const overlapEntries = [
      ...selectedTaskEntries,
      entry({
        id: 2,
        start: '2026-08-18T10:00:00.000Z',
        end: '2026-08-18T10:30:00.000Z',
      }),
    ];
    const output = renderToString(
      <TaskTimeEntries
        height={40}
        timeEntries={selectedTaskEntries}
        overlapEntries={overlapEntries}
        selectedEntryIndex={0}
        isViewFocused
        selectedTaskId={3}
        draftEntry={null}
        compact
      />,
      {columns: 50},
    );

    expect(output).not.toContain('Task Sessions');
    expect(output).toContain('Duration');
    expect(output).not.toContain('Task 1');
    expect(overlapHarness.find).toHaveBeenCalledWith(
      expect.objectContaining({id: 1}),
      overlapEntries,
    );
  });

  beforeEach(() => {
    vi.useFakeTimers({toFake: ['Date', 'setInterval', 'clearInterval']});
    vi.setSystemTime(new Date('2026-08-18T10:00:00.000Z'));
    overlapHarness.find.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('updates an active duration without recalculating static entry rows', async () => {
    const stdout = new PassThrough();
    stdout.columns = 120;
    stdout.rows = 40;
    const onRender = vi.fn();
    const timeEntries = [
      entry({id: 1, start: '2026-08-18T09:59:55.000Z'}),
      entry({
        id: 2,
        start: '2026-08-18T09:00:00.000Z',
        end: '2026-08-18T09:30:00.000Z',
      }),
    ];
    const app = render(
      <LiveClockProvider>
        <TaskTimeEntries
          height={40}
          timeEntries={timeEntries}
          selectedEntryIndex={0}
          isViewFocused
          selectedTaskId={3}
          draftEntry={null}
        />
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
    expect(overlapHarness.find).toHaveBeenCalled();
    overlapHarness.find.mockClear();
    onRender.mockClear();

    vi.advanceTimersByTime(1000);
    await flushReact();
    await app.waitUntilRenderFlush();

    expect(onRender).toHaveBeenCalledOnce();
    expect(overlapHarness.find).not.toHaveBeenCalled();

    app.unmount();
    await app.waitUntilExit();
  });
});
