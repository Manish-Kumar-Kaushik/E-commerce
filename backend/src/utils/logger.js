const normalizeMeta = (meta) => {
  if (!meta) {
    return undefined;
  }

  if (meta instanceof Error) {
    return {
      name: meta.name,
      message: meta.message,
      stack: meta.stack,
    };
  }

  return meta;
};

const formatMessage = (level, message, meta) => {
  const payload = {
    app: 'shopzy-backend',
    env: process.env.NODE_ENV || 'development',
    level,
    message,
    ...(meta ? { meta: normalizeMeta(meta) } : {}),
    timestamp: new Date().toISOString(),
  };

  return JSON.stringify(payload);
};

const logger = {
  info(message, meta) {
    console.log(formatMessage('info', message, meta));
  },
  warn(message, meta) {
    console.warn(formatMessage('warn', message, meta));
  },
  error(message, meta) {
    console.error(formatMessage('error', message, meta));
  },
};

export const morganStream = {
  write: (message) => logger.info(message.trim()),
};

export default logger;
