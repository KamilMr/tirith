#!/usr/bin/env node

import {program} from 'commander';
import db from './db/db.js';
import {toggle, active, list, stop} from './commands/task.js';
import {list as listProjects} from './commands/project.js';

const run = fn => async (...args) => {
  try {
    await fn(...args);
  } catch (err) {
    console.log(JSON.stringify({error: err.message}));
    process.exitCode = 1;
  } finally {
    await db.destroy();
  }
};

const task = program.command('task');

task
  .command('toggle <taskId>')
  .description('Toggle a task on/off by ID')
  .action(run(toggle));

task
  .command('active')
  .description('Get the currently active task')
  .action(run(active));

task
  .command('list')
  .description('List tasks for a date')
  .option('-p, --project <id>', 'Filter by project ID')
  .option('-d, --date <YYYY-MM-DD>', 'Date to list tasks for (default: today)')
  .action(run(list));

task
  .command('stop')
  .description('Stop the currently active task')
  .action(run(stop));

const project = program.command('project');

project
  .command('list')
  .description('List all projects')
  .action(run(listProjects));

program.parse();
