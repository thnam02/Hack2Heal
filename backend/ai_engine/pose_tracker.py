import sys
import json
import cv2
import numpy as np
import mediapipe as mp
from collections import deque

mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils

class PoseAnalyzer:
    def __init__(self, exercise_type="shoulder_rotation", smooth_window=5):
        self.exercise_type = exercise_type
        self.prev_angles = deque(maxlen=smooth_window)
        self.baseline_angle = None
        self.direction = None
        self.reps = 0

    def calculate_angle(self, a, b, c):
        a, b, c = np.array(a), np.array(b), np.array(c)
        radians = np.arccos(
            np.clip(np.dot(a - b, c - b)
                    / (np.linalg.norm(a - b) * np.linalg.norm(c - b)), -1.0, 1.0)
        )
        return np.degrees(radians)

    def analyze(self, landmarks):
        if landmarks is None or not hasattr(landmarks, "landmark"):
            return self._empty_metrics()

        lm = landmarks.landmark

        if self.exercise_type == "shoulder_rotation":
            angle = self._shoulder_angle(lm)
        elif self.exercise_type == "squat":
            angle = self._squat_angle(lm)
        else:
            return self._empty_metrics()

        # --- Baseline calibration (first frames) ---
        if self.baseline_angle is None:
            self.baseline_angle = angle

        # --- Temporal smoothing ---
        self.prev_angles.append(angle)
        smooth_angle = np.mean(self.prev_angles)

        # --- Rep counting ---
        self._update_reps(smooth_angle)

        # --- Scoring relative to baseline ---
        ideal_angle = self.baseline_angle - 45  # e.g. rotate/squat 45° from rest
        deviation = abs(smooth_angle - ideal_angle)
        posture_score = max(0, 100 - deviation * 2)
        alignment = "Correct" if deviation < 10 else "Off"
        form_quality = self._evaluate_form(stability=np.std(self.prev_angles),
                                           score=posture_score)

        return {
            "posture_score": round(posture_score, 1),
            "alignment": alignment,
            "range_of_motion": int(smooth_angle),
            "form_quality": form_quality,
            "reps": self.reps,
        }

    def _shoulder_angle(self, lm):
        sh = lm[mp_pose.PoseLandmark.LEFT_SHOULDER.value]
        el = lm[mp_pose.PoseLandmark.LEFT_ELBOW.value]
        wr = lm[mp_pose.PoseLandmark.LEFT_WRIST.value]
        return self.calculate_angle([sh.x, sh.y], [el.x, el.y], [wr.x, wr.y])

    def _squat_angle(self, lm):
        hip = lm[mp_pose.PoseLandmark.LEFT_HIP.value]
        knee = lm[mp_pose.PoseLandmark.LEFT_KNEE.value]
        ankle = lm[mp_pose.PoseLandmark.LEFT_ANKLE.value]
        return self.calculate_angle([hip.x, hip.y], [knee.x, knee.y], [ankle.x, ankle.y])

    def _update_reps(self, angle):
        if self.direction is None:
            self.direction = "down" if angle < self.baseline_angle else "up"
        elif self.direction == "down" and angle > self.baseline_angle:
            self.reps += 1
            self.direction = "up"
        elif self.direction == "up" and angle < self.baseline_angle:
            self.direction = "down"

    def _evaluate_form(self, stability, score):
        if stability > 5:
            return "Shaky"
        elif score > 85:
            return "Excellent"
        elif score > 70:
            return "Good"
        else:
            return "Needs Work"

    def _empty_metrics(self):
        return {"posture_score": 0, "alignment": "-", "range_of_motion": 0,
                "form_quality": "-", "reps": self.reps}


# Main execution
if __name__ == "__main__":
    exercise_type = sys.argv[1] if len(sys.argv) > 1 else "shoulder_rotation"
    camera_source = sys.argv[2] if len(sys.argv) > 2 else "0"
    
    try:
        camera_index = int(camera_source)
    except ValueError:
        camera_index = 0

    # Initialize MediaPipe Pose
    pose = mp_pose.Pose(
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )
    
    # Initialize analyzer
    analyzer = PoseAnalyzer(exercise_type=exercise_type)
    
    # Open camera
    cap = cv2.VideoCapture(camera_index)
    
    if not cap.isOpened():
        print(json.dumps({"error": f"Could not open camera {camera_index}"}), flush=True)
        sys.exit(1)
    
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Convert BGR to RGB
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # Process frame with MediaPipe
            results = pose.process(rgb_frame)
            
            # Analyze pose
            metrics = analyzer.analyze(results.pose_landmarks)
            
            # Output JSON metrics to stdout
            print(json.dumps(metrics), flush=True)
            
    except KeyboardInterrupt:
        pass
    except Exception as e:
        print(json.dumps({"error": str(e)}), flush=True)
        sys.exit(1)
    finally:
        cap.release()
        pose.close()
