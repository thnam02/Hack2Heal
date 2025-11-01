const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');

const PYTHON_EXECUTABLE = process.env.PYTHON_EXECUTABLE || 'python3';
const SCRIPT_PATH = path.join(__dirname, '../../../ai_engine/pose_tracker.py');

const startSession = (req, res) => {
  const exercise = req.query.exercise || 'shoulder_rotation';
  const cameraSource = req.query.camera || process.env.CAMERA_SOURCE || '0';

  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.flushHeaders();

  const sendEvent = (event, payload) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  // Check if Python script exists
  if (!fs.existsSync(SCRIPT_PATH)) {
    logger.error(`Python script not found at ${SCRIPT_PATH}`);
    sendEvent('status', {
      message: `Python pose tracker script not found at ${SCRIPT_PATH}. Please check backend setup.`,
      level: 'error',
    });
    res.end();
    return;
  }

  const child = spawn(PYTHON_EXECUTABLE, [SCRIPT_PATH, exercise, cameraSource], {
    cwd: path.join(__dirname, '../../../'),
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  logger.info(`pose tracker spawned (exercise=${exercise}, camera=${cameraSource}) pid=${child.pid}`);

  child.stdout.on('data', (chunk) => {
    const lines = chunk.toString().split('\n').filter(Boolean);
    lines.forEach((line) => {
      try {
        const payload = JSON.parse(line);
        if (payload.error) {
          sendEvent('status', { message: payload.error, level: 'error', source: payload.source });
          return;
        }
        if (payload.type === 'metrics' || Object.prototype.hasOwnProperty.call(payload, 'posture_score')) {
          logger.debug(`pose tracker metrics: ${line}`);
          sendEvent('metrics', payload);
        } else {
          sendEvent('status', payload);
        }
      } catch (error) {
        logger.warn('Failed to parse pose tracker output', { line, error });
      }
    });
  });

  child.stderr.on('data', (chunk) => {
    logger.warn(`pose_tracker stderr: ${chunk.toString()}`);
  });

  child.on('close', (code) => {
    logger.info(`pose tracker exited with code ${code}`);
    sendEvent('status', { message: 'Session ended', code });
    res.end();
  });

  child.on('error', (error) => {
    logger.error('pose tracker process error', error);
    let errorMsg = 'Pose tracker failed to start';
    if (error.code === 'ENOENT') {
      errorMsg = `Python executable not found (${PYTHON_EXECUTABLE}). Please install Python 3.`;
    } else if (error.message) {
      errorMsg = `Error: ${error.message}`;
    }
    sendEvent('status', { message: errorMsg, level: 'error' });
    res.end();
  });

  req.on('close', () => {
    if (child.exitCode === null) {
      child.kill('SIGTERM');
      logger.info('pose tracker terminated due to client disconnect');
    }
  });

  sendEvent('status', { message: `Session started using camera source ${cameraSource}` });
};

module.exports = {
  startSession,
};
