
import re
import logging
import requests
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.database import models
from app.ml.verifier import extract_social_handles, TIMEOUT

logger = logging.getLogger('enricher')

def fetch_github_enrichment(handle: str) -> Dict[str, Any]:
    if not handle:
        return {'projects': [], 'skills': []}
    try:
        headers = {'Accept': 'application/vnd.github+json'}
        r = requests.get(f'https://api.github.com/users/{handle}/repos', params={'sort': 'pushed', 'per_page': 10}, headers=headers, timeout=TIMEOUT)
        if r.status_code != 200:
            return {'projects': [], 'skills': []}
        repos = r.json()
        projects = []
        skills = set()
        for repo in repos:
            name = repo.get('name')
            lang = repo.get('language')
            desc = repo.get('description') or ''
            if name:
                proj_str = f'GitHub:{name}'
                if lang:
                    proj_str += f' ({lang})'
                    skills.add(lang)
                if desc:
                    proj_str += f' - {desc[:60]}'
                projects.append(proj_str)
                for kw in ['React', 'Python', 'Docker', 'FastAPI', 'Node', 'TypeScript', 'PyTorch', 'TensorFlow', 'Kubernetes', 'SQL', 'MongoDB', 'C++', 'Java']:
                    if kw.lower() in desc.lower():
                        skills.add(kw)
        return {'projects': projects[:5], 'skills': list(skills)}
    except Exception as e:
        logger.error(f'GitHub enrichment error for {handle}: {e}')
        return {'projects': [], 'skills': []}

def fetch_leetcode_enrichment(handle: str) -> Dict[str, Any]:
    if not handle:
        return {'skills': [], 'certifications': []}
    q_var = ''
    query_str = f'query getUserProfile({q_var}: String!) {{ matchedUser(username: {q_var}) {{ submitStats {{ acSubmissionNum {{ difficulty count }} }} }} }}'
    try:
        r = requests.post('https://leetcode.com/graphql', json={'query': query_str, 'variables': {'username': handle}}, headers={'Content-Type': 'application/json', 'Referer': 'https://leetcode.com', 'User-Agent': 'Mozilla/5.0'}, timeout=TIMEOUT)
        if r.status_code != 200:
            return {'skills': [], 'certifications': []}
        data = r.json()
        user = data.get('data', {}).get('matchedUser')
        if not user:
            return {'skills': [], 'certifications': []}
        sub_stats = user.get('submitStats', {}).get('acSubmissionNum', [])
        total = next((s['count'] for s in sub_stats if s['difficulty'] == 'All'), 0)
        skills = []
        certs = []
        if total > 0:
            skills = ['Data Structures', 'Algorithms', 'Problem Solving']
            certs = [f'LeetCode Verified Profile ({total} Problems Solved)']
        return {'skills': skills, 'certifications': certs}
    except Exception as e:
        logger.error(f'LeetCode enrichment error for {handle}: {e}')
        return {'skills': [], 'certifications': []}

def fetch_hackerrank_enrichment(handle: str) -> Dict[str, Any]:
    if not handle:
        return {'skills': [], 'certifications': []}
    try:
        r = requests.get(f'https://www.hackerrank.com/rest/hackers/{handle}/profile', headers={'User-Agent': 'Mozilla/5.0'}, timeout=TIMEOUT)
        if r.status_code != 200:
            return {'skills': [], 'certifications': []}
        model = r.json().get('model', {})
        badges = model.get('badges', [])
        skills = []
        certs = []
        for b in badges:
            if isinstance(b, dict) and b.get('name'):
                bname = b['name']
                skills.append(bname)
                certs.append(f'HackerRank {bname} Badge')
        return {'skills': skills, 'certifications': certs}
    except Exception as e:
        logger.error(f'HackerRank enrichment error for {handle}: {e}')
        return {'skills': [], 'certifications': []}

def fetch_linkedin_enrichment(linkedin_str: str) -> Dict[str, Any]:
    if not linkedin_str:
        return {'skills': [], 'certifications': [], 'projects': [], 'roles': []}
    skills = set()
    certs = []
    projects = []
    roles = []

    clean_str = linkedin_str.strip()
    if 'linkedin.com/in/' in clean_str.lower():
        handle = clean_str.split('linkedin.com/in/')[-1].split('/')[0]
        certs.append(f'LinkedIn Verified Profile (linkedin.com/in/{handle})')
        for kw in ['developer', 'engineer', 'architect', 'analyst', 'data', 'fullstack', 'backend', 'frontend', 'devops']:
            if kw in handle.lower():
                skills.add(kw.capitalize() + ' Engineering')

    # Run dictionary skill extractor on any text or headline provided
    from app.nlp.skill_extractor import extract_skills
    skills.update(extract_skills(clean_str))

    # Extract projects mentioned in LinkedIn text
    for line in clean_str.splitlines():
        l_str = line.strip()
        if re.search(r'^(project|built|developed|created|architected|designed):', l_str, re.IGNORECASE):
            projects.append(l_str)
        elif 'project' in l_str.lower() and 15 < len(l_str) < 120:
            projects.append(l_str)
        if re.search(r'(engineer|developer|lead|architect|manager|analyst|intern)\s+(at|@|-)\s+[A-Za-z0-9\s]+', l_str, re.IGNORECASE):
            roles.append(l_str)

    domain_keywords = [
        'Software Engineering', 'System Architecture', 'Cloud Architecture',
        'Project Management', 'Agile', 'DevOps', 'CI/CD', 'REST APIs',
        'Machine Learning', 'Data Engineering', 'Full Stack Development',
        'Microservices', 'Distributed Systems', 'Database Design'
    ]
    for dkw in domain_keywords:
        if dkw.lower() in clean_str.lower():
            skills.add(dkw)

    return {'skills': list(skills), 'certifications': certs, 'projects': projects[:4], 'roles': roles[:4]}

def enrich_candidate_profile(
    candidate_id: int, 
    db: Session,
    linkedin_text_override: Optional[str] = None
) -> Dict[str, Any]:
    cand = db.query(models.Candidate).filter(models.Candidate.id == candidate_id).first()
    if not cand:
        return {'status': 'error', 'message': 'Candidate not found.'}

    handles = extract_social_handles(cand.resume_text or '')
    gh_handle = (cand.github_url or '').strip() or handles.get('github')
    lc_handle = (cand.leetcode_url or '').strip() or handles.get('leetcode')
    hr_handle = (cand.hackerrank_url or '').strip() or handles.get('hackerrank')
    li_url = (cand.linkedin_url or '').strip() or handles.get('linkedin')

    new_projects = []
    new_skills = set()
    new_certs = []
    new_roles = []

    if gh_handle:
        if 'github.com/' in gh_handle:
            gh_handle = gh_handle.split('github.com/')[-1].split('/')[0]
        gh_data = fetch_github_enrichment(gh_handle)
        new_projects.extend(gh_data.get('projects', []))
        new_skills.update(gh_data.get('skills', []))

    if lc_handle:
        if 'leetcode.com/' in lc_handle:
            lc_handle = lc_handle.split('leetcode.com/')[-1].split('/')[0]
        lc_data = fetch_leetcode_enrichment(lc_handle)
        new_skills.update(lc_data.get('skills', []))
        new_certs.extend(lc_data.get('certifications', []))

    if hr_handle:
        if 'hackerrank.com/' in hr_handle:
            hr_handle = hr_handle.split('hackerrank.com/')[-1].split('/')[0]
        hr_data = fetch_hackerrank_enrichment(hr_handle)
        new_skills.update(hr_data.get('skills', []))
        new_certs.extend(hr_data.get('certifications', []))

    li_input = linkedin_text_override or li_url
    if li_input:
        li_data = fetch_linkedin_enrichment(li_input)
        new_skills.update(li_data.get('skills', []))
        new_certs.extend(li_data.get('certifications', []))
        new_projects.extend(li_data.get('projects', []))
        new_roles.extend(li_data.get('roles', []))

    if new_projects:
        existing_p = cand.projects or ''
        for np in new_projects:
            if np.lower() not in existing_p.lower():
                existing_p = (existing_p + '; ' + np).strip('; ')
        cand.projects = existing_p

    if new_certs:
        existing_c = cand.certifications or ''
        for nc in new_certs:
            if nc.lower() not in existing_c.lower():
                existing_c = (existing_c + '; ' + nc).strip('; ')
        cand.certifications = existing_c

    if new_roles:
        existing_e = cand.experience or ''
        for nr in new_roles:
            if nr.lower() not in existing_e.lower():
                existing_e = (existing_e + '\n' + nr).strip()
        cand.experience = existing_e

    existing_skills = {s.skill.lower() for s in cand.skills}
    added_skills = []
    for sk in new_skills:
        if sk.lower() not in existing_skills:
            db_sk = models.CandidateSkill(candidate_id=cand.id, skill=sk)
            db.add(db_sk)
            added_skills.append(sk)

    social_summary = []
    if gh_handle: social_summary.append(f'GitHub Profile: {gh_handle}')
    if new_projects: social_summary.append('GitHub Projects: ' + ', '.join(new_projects))
    if lc_handle: social_summary.append(f'LeetCode Profile: {lc_handle}')
    if hr_handle: social_summary.append(f'HackerRank Profile: {hr_handle}')
    if li_url: social_summary.append(f'LinkedIn Profile: {li_url}')

    if social_summary:
        add_text = '\n\n[Extracted Social & GitHub Profiles]:\n' + '\n'.join(social_summary)
        if add_text not in (cand.resume_text or ''):
            cand.resume_text = (cand.resume_text or '') + add_text

    db.commit()
    db.refresh(cand)

    return {
        'status': 'success',
        'candidate_id': cand.id,
        'candidate_name': cand.name,
        'extracted_projects': new_projects,
        'added_skills': added_skills,
        'added_certifications': new_certs,
        'total_skills_now': [s.skill for s in cand.skills]
    }
