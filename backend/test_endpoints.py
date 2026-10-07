import requests, json

BASE = "http://127.0.0.1:8000"

def test_endpoint(name, method, url, payload=None):
    try:
        if method == "GET":
            r = requests.get(f"{BASE}{url}", timeout=15)
        elif method == "POST":
            r = requests.post(f"{BASE}{url}", json=payload, timeout=15)
        if r.status_code in [200, 201]:
            print(f" [PASS] {name} ({r.status_code})")
            return r.json()
        else:
            print(f" [FAIL] {name} (HTTP {r.status_code}): {r.text[:200]}")
            return None
    except Exception as e:
        print(f" [ERROR] {name}: {e}")
        return None

print("--- Testing RecruitIQ Backend Endpoints ---")
test_endpoint("Root Health", "GET", "/")
test_endpoint("API Health", "GET", "/api/health")
jobs = test_endpoint("List Jobs", "GET", "/api/jobs")
candidates = test_endpoint("List Candidates", "GET", "/api/candidates")

if jobs and len(jobs) > 0:
    job_id = jobs[0]["id"]
    test_endpoint("Match Candidates for Job", "POST", "/api/matching/rank", {"job_id": job_id, "top_k": 5})

if candidates and len(candidates) > 0:
    cid = candidates[0]["id"]
    test_endpoint("Candidate Handles", "GET", f"/api/verification/handles/{cid}")

test_endpoint("Fairness Audit", "GET", "/api/fairness/audit")
