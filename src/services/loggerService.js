import fs from 'node:fs';
import path from 'node:path';
import util from 'node:util';

const originalConsoleError = console.error.bind(console);
let consoleErrorPatched = false;
let processHandlersRegistered = false;

const getLogFile = () =>
  process.env.ERROR_LOG_FILE ||
  process.env.LOG_FILE ||
  path.join(process.cwd(), 'logs', 'tirith-error.log');

const normalizeError = value => {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  if (typeof value === 'string') return {message: value};

  return {
    message: util.inspect(value, {depth: 6, breakLength: Infinity}),
  };
};

const writeEntry = entry => {
  try {
    const file = getLogFile();
    fs.mkdirSync(path.dirname(file), {recursive: true});
    fs.appendFileSync(file, `${JSON.stringify(entry)}\n`);
  } catch (error) {
    originalConsoleError('Failed to write error log:', error.message);
  }
};

const logger = {
  error: (scope, error, meta = {}) => {
    writeEntry({
      timestamp: new Date().toISOString(),
      level: 'error',
      scope,
      ...normalizeError(error),
      meta,
    });
  },

  warn: (scope, warning, meta = {}) => {
    writeEntry({
      timestamp: new Date().toISOString(),
      level: 'warn',
      scope,
      ...normalizeError(warning),
      meta,
    });
  },

  setupErrorLogging: () => {
    if (!consoleErrorPatched) {
      console.error = (...args) => {
        logger.error('console.error', args.map(normalizeError));
        originalConsoleError(...args);
      };
      consoleErrorPatched = true;
    }

    if (processHandlersRegistered) return;

    process.on('unhandledRejection', reason => {
      logger.error('process.unhandledRejection', reason);
    });

    process.on('uncaughtException', error => {
      logger.error('process.uncaughtException', error);
      originalConsoleError(error);
      process.exit(1);
    });

    process.on('warning', warning => {
      logger.warn('process.warning', warning);
    });

    processHandlersRegistered = true;
  },
};

export default logger;
