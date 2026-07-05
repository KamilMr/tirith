#!/usr/bin/env node

import React from 'react';
import {program} from 'commander';
import logger from './services/loggerService.js';

logger.setupErrorLogging();

program.version('1.0.0');

import {render} from 'ink';
import App from './app.js';

render(<App />, {fullscreen: true});
