"""
backend/app/ml/verifier.py
Professional Profile & Credential Verification Engine (Section 5.9)

Four platform connectors:
  - GitHub   : REST API (public, no auth)
  - LeetCode : GraphQL public API  
  - HackerRank: Public profile API
  - LinkedIn  : URL reachability check only

All connectors degrade gracefully on timeout/error.
"""

import re
import logging
from typing import Dict, Any, Optional, List

logger = logging.getLogger("verifier")
TIMEOUT = 6


def extract_social_handles(resume_text: str) -> Dict[str, Optional[str]]:
    text = resume_text or ""
    github = None
    gh = re.search(r'(?:github\.com/|github:\s*)([A-Za-z0-9_.-]+)', text, re.IGNORECASE)
    if gh:
        github = gh.group(1).strip("/").strip()

    leetcode = None
    lc = re.search(r'(?:leetcode\.com/|leetcode:\s*)([A-Za-z0-9_.-]+)', text, re.IGNORECASE)
    if lc:
        leetcode = lc.group(1).strip("/").strip()

    hackerrank = None
    hr = re.search(r'(?:hackerrank\.com/|hackerrank:\s*)([A-Za-z0-9_.-]+)', text, re.IGNORECASE)
    if hr:
        hackerrank = hr.group(1).strip("/").strip()

    linkedin = None
    li = re.search(r'(?:linkedin\.com/in/)([A-Za-z0-9_.-]+)', text, re.IGNORECASE)
    if li:
        linkedin = li.group(1).strip("/").strip()

    return {"github": github, "leetcode": leetcode, "hackerrank": hackerrank, "linkedin": linkedin}


def verify_github(handle: Optional[str], claimed_projects: List[str] = []) -> Dict[str, Any]:
    if not handle:
        return {"platform": "GitHub", "handle": None, "verified": False, "repos_count": 0,
                "matched_projects": [], "followers": 0,
                "remark": "No GitHub handle detected in resume text.", "status": "not_found_in_resume"}
    try:
        import requests
        headers = {"Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"}
        r = requests.get(f"https://api.github.com/users/{handle}", headers=headers, timeout=TIMEOUT)
        if r.status_code == 404:
            return {"platform": "GitHub", "handle": handle, "verified": False, "repos_count": 0,
                    "matched_projects": [], "followers": 0,
                    "remark": f"GitHub profile not found for handle '{handle}'. The link may be broken or fabricated.",
                    "status": "not_found"}
        if r.status_code != 200:
            raise Exception(f"GitHub API returned HTTP {r.status_code}")
        profile = r.json()
        public_repos = profile.get("public_repos", 0)
        followers = profile.get("followers", 0)
        bio = (profile.get("bio") or "")[:200]
        name = profile.get("name") or handle
        rr = requests.get(f"https://api.github.com/users/{handle}/repos",
                          params={"per_page": 30, "sort": "pushed"}, headers=headers, timeout=TIMEOUT)
        repo_names = []
        if rr.status_code == 200:
            repo_names = [repo["name"].lower() for repo in rr.json()]
        matched = []
        for proj in claimed_projects:
            proj_clean = proj.lower().replace(" ", "-")
            for rname in repo_names:
                if proj_clean in rname or rname in proj_clean or proj.lower() in rname:
                    matched.append(proj)
                    break
        if public_repos == 0:
            activity = f"The account exists but has no public repositories."
        elif public_repos < 5:
            activity = f"The account has {public_repos} public repositories — limited public activity."
        else:
            activity = f"The account shows active public contribution history with {public_repos} public repositories."
        matched_note = ""
        if claimed_projects:
            if matched:
                matched_note = f" Resume-named project(s) {matched} correspond to public repositories on this account."
            else:
                matched_note = f" No resume-named projects were found as public repositories."
        remark = f"GitHub profile '{handle}' is confirmed active ({name}). {activity}{matched_note} Account has {followers} followers."
        return {"platform": "GitHub", "handle": handle, "verified": True, "repos_count": public_repos,
                "matched_projects": matched, "followers": followers, "bio": bio, "remark": remark, "status": "verified"}
    except Exception as e:
        err = str(e)
        msg = f"Unable to verify GitHub profile '{handle}' — {err[:120]}"
        return {"platform": "GitHub", "handle": handle, "verified": False, "repos_count": 0,
                "matched_projects": [], "followers": 0, "remark": msg, "status": "error"}


def verify_leetcode(handle: Optional[str]) -> Dict[str, Any]:
    if not handle:
        return {"platform": "LeetCode", "handle": None, "verified": False, "problems_solved": 0,
                "contest_rating": None, "remark": "No LeetCode handle detected in resume text.",
                "status": "not_found_in_resume"}
    query = '{"query": "query getUserProfile($username: String!) { matchedUser(username: $username) { username submitStats { acSubmissionNum { difficulty count } } userContestRanking { rating globalRanking } } }", "variables": {"username": "' + handle + '"}}'
    try:
        import requests
        r = requests.post("https://leetcode.com/graphql", data=query,
                          headers={"Content-Type": "application/json", "Referer": "https://leetcode.com",
                                   "User-Agent": "Mozilla/5.0"}, timeout=TIMEOUT)
        if r.status_code != 200:
            raise Exception(f"LeetCode GraphQL returned HTTP {r.status_code}")
        data = r.json()
        user = data.get("data", {}).get("matchedUser")
        if not user:
            return {"platform": "LeetCode", "handle": handle, "verified": False, "problems_solved": 0,
                    "contest_rating": None,
                    "remark": f"LeetCode profile not found for username '{handle}'.", "status": "not_found"}
        sub_stats = user.get("submitStats", {}).get("acSubmissionNum", [])
        total = next((s["count"] for s in sub_stats if s["difficulty"] == "All"), 0)
        easy = next((s["count"] for s in sub_stats if s["difficulty"] == "Easy"), 0)
        medium = next((s["count"] for s in sub_stats if s["difficulty"] == "Medium"), 0)
        hard = next((s["count"] for s in sub_stats if s["difficulty"] == "Hard"), 0)
        contest = user.get("userContestRanking")
        rating = round(contest["rating"], 1) if contest and contest.get("rating") else None
        remark = f"LeetCode profile '{handle}' confirmed. Solved {total} problems (E:{easy} M:{medium} H:{hard})."
        if rating:
            remark += f" Contest rating: {rating}."
        return {"platform": "LeetCode", "handle": handle, "verified": True, "problems_solved": total,
                "easy_solved": easy, "medium_solved": medium, "hard_solved": hard,
                "contest_rating": rating, "remark": remark, "status": "verified"}
    except Exception as e:
        return {"platform": "LeetCode", "handle": handle, "verified": False, "problems_solved": 0,
                "contest_rating": None, "remark": f"Unable to verify LeetCode '{handle}' — {str(e)[:120]}",
                "status": "error"}


def verify_hackerrank(handle: Optional[str], claimed_certs: List[str] = []) -> Dict[str, Any]:
    if not handle:
        return {"platform": "HackerRank", "handle": None, "verified": False, "badges": [],
                "matched_certs": [], "remark": "No HackerRank handle detected in resume text.",
                "status": "not_found_in_resume"}
    try:
        import requests
        r = requests.get(f"https://www.hackerrank.com/rest/hackers/{handle}/profile",
                         headers={"User-Agent": "Mozilla/5.0", "Accept": "application/json"}, timeout=TIMEOUT)
        if r.status_code == 404:
            return {"platform": "HackerRank", "handle": handle, "verified": False, "badges": [],
                    "matched_certs": [],
                    "remark": f"HackerRank profile not found for handle '{handle}'.", "status": "not_found"}
        if r.status_code != 200:
            raise Exception(f"HackerRank API returned HTTP {r.status_code}")
        model = r.json().get("model", {})
        name = model.get("name") or handle
        badges = model.get("badges", [])
        badge_names = [b.get("name", "") for b in badges if isinstance(b, dict)]
        matched_certs = []
        for cert in claimed_certs:
            for bname in badge_names:
                if cert.lower() in bname.lower() or bname.lower() in cert.lower():
                    matched_certs.append(cert)
                    break
        remark = f"HackerRank profile '{handle}' confirmed ({name})."
        if badge_names:
            remark += f" Badges: {', '.join(badge_names[:5])}."
        else:
            remark += " No public badges on this profile."
        if claimed_certs:
            if matched_certs:
                remark += f" Claimed cert(s) {matched_certs} confirmed by HackerRank badge data."
            else:
                remark += f" Claimed cert(s) {claimed_certs[:3]} NOT found in public badge list."
        return {"platform": "HackerRank", "handle": handle, "verified": True, "badges": badge_names,
                "matched_certs": matched_certs, "remark": remark, "status": "verified"}
    except Exception as e:
        return {"platform": "HackerRank", "handle": handle, "verified": False, "badges": [],
                "matched_certs": [], "remark": f"Unable to verify HackerRank '{handle}' — {str(e)[:120]}",
                "status": "error"}


def verify_linkedin(handle: Optional[str]) -> Dict[str, Any]:
    if not handle:
        return {"platform": "LinkedIn", "handle": None, "verified": False, "url_reachable": False,
                "remark": "No LinkedIn URL or handle detected in resume text.", "status": "not_found_in_resume"}
    url = f"https://www.linkedin.com/in/{handle}"
    try:
        import requests
        r = requests.head(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=TIMEOUT, allow_redirects=True)
        status = r.status_code
        final_url = r.url if hasattr(r, 'url') else url
        if status in (200, 302, 301) and "/404" not in final_url and "/authwall" not in final_url:
            remark = (f"LinkedIn URL linkedin.com/in/{handle} is reachable without a 404 error. "
                      f"Note: LinkedIn blocks automated content verification — profile details cannot be "
                      f"cross-checked programmatically. A manual review is recommended.")
            verified = True
        else:
            remark = (f"LinkedIn URL linkedin.com/in/{handle} returned HTTP {status}. "
                      f"The profile may not exist or the handle may be incorrect.")
            verified = False
        return {"platform": "LinkedIn", "handle": handle, "url": url, "verified": verified,
                "url_reachable": verified, "remark": remark, "status": "verified" if verified else "not_found"}
    except Exception as e:
        return {"platform": "LinkedIn", "handle": handle, "url": url, "verified": False, "url_reachable": False,
                "remark": f"Unable to verify LinkedIn URL for '{handle}' — {str(e)[:120]}. This should not be treated as a negative signal.",
                "status": "error"}


def run_full_verification(
    resume_text: str, 
    projects_text: str = "", 
    certifications_text: str = "",
    override_handles: Optional[Dict[str, Optional[str]]] = None
) -> Dict[str, Any]:
    handles = extract_social_handles(resume_text)
    if override_handles:
        for k, v in override_handles.items():
            if v and v.strip():
                # Clean full URLs down to handle if needed
                val = v.strip()
                if "github.com/" in val.lower():
                    val = val.split("github.com/")[-1].split("/")[0]
                elif "linkedin.com/in/" in val.lower():
                    val = val.split("linkedin.com/in/")[-1].split("/")[0]
                elif "leetcode.com/" in val.lower():
                    val = val.split("leetcode.com/")[-1].split("/")[0]
                elif "hackerrank.com/" in val.lower():
                    val = val.split("hackerrank.com/")[-1].split("/")[0]
                handles[k] = val

    claimed_projects = [p.strip() for p in re.split(r'[,\n|]', projects_text or "") if 3 < len(p.strip()) < 80]
    claimed_certs = [c.strip() for c in re.split(r'[,\n|]', certifications_text or "") if 3 < len(c.strip()) < 100]
    github_r = verify_github(handles.get("github"), claimed_projects)
    leetcode_r = verify_leetcode(handles.get("leetcode"))
    hackerrank_r = verify_hackerrank(handles.get("hackerrank"), claimed_certs)
    linkedin_r = verify_linkedin(handles.get("linkedin"))
    all_r = [github_r, leetcode_r, hackerrank_r, linkedin_r]
    verified_count = sum(1 for r in all_r if r.get("verified"))
    status = ("Strong" if verified_count >= 3 else "Moderate" if verified_count >= 2
              else "Limited" if verified_count == 1 else "Unverifiable")
    return {"handles_found": handles, "github": github_r, "leetcode": leetcode_r,
            "hackerrank": hackerrank_r, "linkedin": linkedin_r,
            "summary": {"platforms_checked": 4, "platforms_verified": verified_count,
                        "platforms_failed": 4 - verified_count, "overall_status": status}}

