const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');
const { getIO } = require('../socket/socket');

const PYTHON_EXECUTABLE = process.env.PYTHON_EXECUTABLE || 'python3';

// Resolve Python script path - must be called at runtime, not module load time
// Returns { scriptPath: string, triedPaths: string[] }
function resolveScriptPath() {
  const possiblePaths = [];

  // 1. Environment variable (highest priority - for custom deployments)
  if (process.env.POSE_TRACKER_SCRIPT_PATH) {
    possiblePaths.push(process.env.POSE_TRACKER_SCRIPT_PATH);
    possiblePaths.push(path.resolve(process.env.POSE_TRACKER_SCRIPT_PATH));
  }

  // 2. In backend/ai_engine (from process.cwd - Render deployment: /app/ai_engine/pose_tracker.py)
  const cwdPath = path.join(process.cwd(), 'ai_engine', 'pose_tracker.py');
  possiblePaths.push(cwdPath);
  possiblePaths.push(path.resolve(cwdPath));

  // 3. In backend/ai_engine (relative to controllers: backend/src/controllers -> backend/ai_engine)
  const relativePath = path.join(__dirname, '..', '..', 'ai_engine', 'pose_tracker.py');
  possiblePaths.push(relativePath);
  possiblePaths.push(path.resolve(relativePath));

  // 4. Relative to repo root (for local development)
  const rootPath = path.join(__dirname, '..', '..', '..', 'ai_engine', 'pose_tracker.py');
  possiblePaths.push(rootPath);
  possiblePaths.push(path.resolve(rootPath));

  const triedPaths = possiblePaths.filter(Boolean);

  // Try each path
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const foundPath = triedPaths.find((tryPath) => tryPath && fs.existsSync(tryPath));

  if (foundPath) {
    logger.info(`Found Python script at: ${foundPath}`);
    return {
      scriptPath: path.resolve(foundPath),
      triedPaths,
    };
  }

  // Return the most likely path (absolute from cwd for Render)
  return {
    scriptPath: path.resolve(process.cwd(), 'ai_engine', 'pose_tracker.py'),
    triedPaths,
  };
}

// Store active sessions with their child processes for cleanup
const activeSessions = new Map();

const startSession = (req, res) => {
  const exercise = req.query.exercise || 'shoulder_rotation';
  const cameraSource = req.query.camera || process.env.CAMERA_SOURCE || '0';

  // Generate unique session ID
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const io = getIO();

  // Resolve script path at runtime (not module load time)
  const { scriptPath: SCRIPT_PATH, triedPaths } = resolveScriptPath();

  // Check if Python script exists
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  if (!fs.existsSync(SCRIPT_PATH)) {
    logger.error(`Python script not found at ${SCRIPT_PATH}`);
    logger.error(`Tried paths: ${triedPaths.join(', ')}`);
    logger.error(`Current working directory: ${process.cwd()}`);
    logger.error(`__dirname: ${__dirname}`);

    return res.status(500).json({
      success: false,
      message: `Python pose tracker script not found at ${SCRIPT_PATH}. Tried paths: ${triedPaths.join(
        ', '
      )}. Current directory: ${process.cwd()}`,
    });
  }

  // Determine working directory - use process.cwd() (should be /app on Render or backend/ locally)
  // The script path is already absolute, so we use process.cwd() as the working directory
  const cwd = process.cwd();

  // Set environment variables to force CPU mode and reduce MediaPipe GPU warnings
  const env = {
    ...process.env,
    GLOG_minloglevel: '2', // Reduce MediaPipe logging
    MP_CPU: '1', // Force CPU mode (disable GPU)
  };

  const child = spawn(PYTHON_EXECUTABLE, [SCRIPT_PATH, exercise, cameraSource], {
    cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
    env,
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
    logger.info(`[Session ${sessionId}] Python stdout received: ${lines.length} line(s)`);

    lines.forEach((line) => {
      try {
        const payload = JSON.parse(line);
        logger.info(`[Session ${sessionId}] Parsed payload:`, JSON.stringify(payload));

        if (payload.error) {
          logger.error(`[Session ${sessionId}] Python error:`, payload.error);
          io.to(`session_${sessionId}`).emit('session:status', {
            message: payload.error,
            level: 'error',
            source: payload.source,
          });
          return;
        }

        // Check if it's metrics payload
        if (payload.type === 'metrics' || Object.prototype.hasOwnProperty.call(payload, 'posture_score')) {
          logger.info(`[Session ${sessionId}] Emitting metrics:`, JSON.stringify(payload));
          io.to(`session_${sessionId}`).emit('session:metrics', payload);
        } else {
          logger.debug(`[Session ${sessionId}] Emitting status:`, JSON.stringify(payload));
          io.to(`session_${sessionId}`).emit('session:status', payload);
        }
      } catch (error) {
        logger.warn(`[Session ${sessionId}] Failed to parse pose tracker output:`, {
          line,
          error: error.message,
        });
        // Log raw line for debugging
        logger.debug(`[Session ${sessionId}] Raw Python output: ${line}`);
      }
    });
  });

  child.stderr.on('data', (chunk) => {
    const errorOutput = chunk.toString();
    // Filter out MediaPipe GPU warnings and verbose logs - only log actual errors
    const isActualError =
      errorOutput.includes('ERROR') ||
      errorOutput.includes('error') ||
      errorOutput.includes('Failed') ||
      errorOutput.includes('Could not') ||
      errorOutput.includes('FATAL');

    if (isActualError) {
      logger.error(`[Session ${sessionId}] Python stderr:`, errorOutput);
      // Emit error to frontend only for actual errors
      io.to(`session_${sessionId}`).emit('session:status', {
        message: `Python script error: ${errorOutput}`,
        level: 'error',
      });
    } else {
      // Log warnings/debug messages but don't send to frontend
      logger.debug(`[Session ${sessionId}] Python stderr (warn):`, errorOutput);
    }
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

const checkPythonScript = (req, res) => {
  const possiblePaths = [
    process.env.POSE_TRACKER_SCRIPT_PATH,
    path.join(process.cwd(), 'ai_engine', 'pose_tracker.py'),
    path.resolve(process.cwd(), 'ai_engine', 'pose_tracker.py'),
    path.join(__dirname, '..', '..', 'ai_engine', 'pose_tracker.py'),
    path.resolve(__dirname, '..', '..', 'ai_engine', 'pose_tracker.py'),
    path.join(__dirname, '..', '..', '..', 'ai_engine', 'pose_tracker.py'),
    path.resolve(__dirname, '..', '..', '..', 'ai_engine', 'pose_tracker.py'),
  ].filter(Boolean);

  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const results = possiblePaths.map((p) => ({
    path: p,
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    exists: fs.existsSync(p),
  }));

  const found = results.find((r) => r.exists);

  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const aiEnginePath = path.join(process.cwd(), 'ai_engine');
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const aiEngineExists = fs.existsSync(aiEnginePath);

  res.json({
    cwd: process.cwd(),
    __dirname,
    possiblePaths: results,
    found: found || null,
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    aiEngineDirExists: aiEngineExists,
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    aiEngineFiles: aiEngineExists ? fs.readdirSync(aiEnginePath) : 'ai_engine directory does not exist',
  });
};

module.exports = {
  startSession,
  endSession,
  checkPythonScript,
};
