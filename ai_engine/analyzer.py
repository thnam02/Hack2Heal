import numpy as np
import mediapipe as mp

mp_pose = mp.solutions.pose

# ---------- small helper ----------
def calculate_angle(a, b, c):
    """Return the angle (in degrees) formed by points a-b-c."""
    a, b, c = np.array(a), np.array(b), np.array(c)
    radians = np.arccos(
        np.clip(
            np.dot(a - b, c - b)
            / (np.linalg.norm(a - b) * np.linalg.norm(c - b)),
            -1.0,
            1.0,
        )
    )
    return np.degrees(radians)


# ---------- main dispatcher ----------
def _landmark_sequence(landmarks):
    if landmarks is None:
        return []
    if hasattr(landmarks, "landmark"):
        return landmarks.landmark
    return landmarks


def _landmark_xy(landmark):
    return [landmark.x, landmark.y]


def analyze_pose(landmarks, exercise_type="shoulder_rotation"):
    lm = _landmark_sequence(landmarks)
    if not lm:
        return _empty_metrics()

    if exercise_type == "shoulder_rotation":
        return _shoulder_rotation(lm)
    elif exercise_type == "squat":
        return _squat(lm)
    else:
        # fallback for unimplemented exercises
        return _empty_metrics()


# ---------- individual exercise logic ----------
def _shoulder_rotation(landmarks):
    # key joint coordinates
    l_sh = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value]
    l_el = landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value]
    l_wr = landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value]

    shoulder, elbow, wrist = _landmark_xy(l_sh), _landmark_xy(l_el), _landmark_xy(l_wr)
    angle = calculate_angle(shoulder, elbow, wrist)

    # simple scoring logic
    ideal_angle = 90
    posture_score = max(0, 100 - abs(angle - ideal_angle))
    alignment = "Correct" if 80 <= angle <= 100 else "Off"
    form_quality = "Good" if posture_score > 80 else "Needs Work"

    return {
        "posture_score": round(posture_score, 2),
        "alignment": alignment,
        "range_of_motion": int(angle),
        "form_quality": form_quality,
    }


def _squat(landmarks):
    l_hip = landmarks[mp_pose.PoseLandmark.LEFT_HIP.value]
    l_knee = landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value]
    l_ankle = landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value]

    hip, knee, ankle = _landmark_xy(l_hip), _landmark_xy(l_knee), _landmark_xy(l_ankle)
    angle = calculate_angle(hip, knee, ankle)

    # ideal knee angle for squat depth: ~90°
    ideal_angle = 90
    posture_score = max(0, 100 - abs(angle - ideal_angle))
    alignment = "Correct" if 80 <= angle <= 100 else "Off"
    form_quality = "Stable" if posture_score > 80 else "Unstable"

    return {
        "posture_score": round(posture_score, 2),
        "alignment": alignment,
        "range_of_motion": int(angle),
        "form_quality": form_quality,
    }


# ---------- fallback ----------
def _empty_metrics():
    return {
        "posture_score": 0,
        "alignment": "-",
        "range_of_motion": 0,
        "form_quality": "-",
    }
