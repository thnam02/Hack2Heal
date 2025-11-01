# pose_tracker.py
import sys
import json
import cv2
import mediapipe as mp
from analyzer import analyze_pose

exercise_type = sys.argv[1] if len(sys.argv) > 1 else "shoulder_rotation"
camera_source = sys.argv[2] if len(sys.argv) > 2 else "0"

try:
    source_value = int(camera_source)
except ValueError:
    source_value = camera_source

print(json.dumps({"status": "starting", "camera_source": camera_source}))
sys.stdout.flush()

cap = cv2.VideoCapture(source_value)
if not cap.isOpened():
    print(json.dumps({"error": "Unable to open camera", "source": camera_source}))
    sys.stdout.flush()
    sys.exit(1)

print(json.dumps({"status": "camera_opened", "camera_source": camera_source}))
sys.stdout.flush()

mp_pose = mp.solutions.pose
pose = mp_pose.Pose(
    min_detection_confidence=0.6,
    min_tracking_confidence=0.6
)

frame_count = 0

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = pose.process(image_rgb)
    metrics = analyze_pose(results.pose_landmarks, exercise_type)

    print(json.dumps({"type": "metrics", **metrics}))
    sys.stdout.flush()

    frame_count += 1
    if frame_count % 100 == 0:
        print(json.dumps({"status": "progress", "frames_processed": frame_count}))
        sys.stdout.flush()

cap.release()
pose.close()

print(json.dumps({"status": "finished", "frames_processed": frame_count}))
sys.stdout.flush()
