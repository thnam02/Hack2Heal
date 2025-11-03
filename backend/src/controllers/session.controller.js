const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');
const { getIO } = require('../socket/socket');

const PYTHON_EXECUTABLE = process.env.PYTHON_EXECUTABLE || 'python3';
const SCRIPT_PATH = path.join(__dirname, '../../../ai_engine/pose_tracker.py');

// Store active sessions with their child processes for cleanup
const activeSessions = new Map();

const startSession = (req, res) => {
  const exercise = req.query.exercise || 'shoulder_rotation';
  const cameraSource = req.query.camera || process.env.CAMERA_SOURCE || '0';

  // Generate unique session ID
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const io = getIO();

  // Check if Python script exists
  if (!fs.existsSync(SCRIPT_PATH)) {
    logger.error(`Python script not found at ${SCRIPT_PATH}`);
    return res.status(500).json({
      success: false,
      message: `Python pose tracker script not found at ${SCRIPT_PATH}. Please check backend setup.`,
    });
  }

  const child = spawn(PYTHON_EXECUTABLE, [SCRIPT_PATH, exercise, cameraSource], {
    cwd: path.join(__dirname, '../../../'),
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  
  logger.info(`pose tracker spawned (session=${sessionId}, exercise=${exercise}, camera=${cameraSource}) pid=${child.pid}`);

  // Store session for cleanup
  activeSessions.set(sessionId, child);

  // Send initial status
  io.to(`session_${sessionId}`).emit('session:status', {
    message: `Session started using camera source ${cameraSource}`,
  });

  child.stdout.on('data', (chunk) => {
    const lines = chunk.toString().split('\n').filter(Boolean);
    lines.forEach((line) => {
      try {
        const payload = JSON.parse(line);
        if (payload.error) {
          io.to(`session_${sessionId}`).emit('session:status', {
            message: payload.error,
            level: 'error',
            source: payload.source,
          });
          return;
        }
        if (payload.type === 'metrics' || Object.prototype.hasOwnProperty.call(payload, 'posture_score')) {
          logger.debug(`pose tracker metrics: ${line}`);
          io.to(`session_${sessionId}`).emit('session:metrics', payload);
        } else {
          io.to(`session_${sessionId}`).emit('session:status', payload);
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
    logger.info(`pose tracker exited with code ${code} for session ${sessionId}`);
    io.to(`session_${sessionId}`).emit('session:status', {
      message: 'Session ended',
      code,
    });
    // Clean up session
    activeSessions.delete(sessionId);
    // Clean up room
    io.socketsLeave(`session_${sessionId}`);
  });

  child.on('error', (error) => {
    logger.error('pose tracker process error', error);
    let errorMsg = 'Pose tracker failed to start';
    if (error.code === 'ENOENT') {
      errorMsg = `Python executable not found (${PYTHON_EXECUTABLE}). Please install Python 3.`;
    } else if (error.message) {
      errorMsg = `Error: ${error.message}`;
    }
    io.to(`session_${sessionId}`).emit('session:status', {
      message: errorMsg,
      level: 'error',
    });
    activeSessions.delete(sessionId);
    io.socketsLeave(`session_${sessionId}`);
  });

  // Send response with session ID
  res.json({
    success: true,
    sessionId,
    message: `Session started using camera source ${cameraSource}`,
  });
};

const endSession = (req, res) => {
  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({
      success: false,
      message: 'Session ID is required',
    });
  }

  const child = activeSessions.get(sessionId);
  if (child && child.exitCode === null) {
    child.kill('SIGTERM');
    activeSessions.delete(sessionId);
    logger.info(`Session ${sessionId} terminated manually`);
  }

  const io = getIO();
  io.socketsLeave(`session_${sessionId}`);

  res.json({
    success: true,
    message: 'Session ended',
  });
};

module.exports = {
  startSession,
  endSession,
};
