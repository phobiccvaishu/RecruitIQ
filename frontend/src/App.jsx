import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = "http://localhost:8000/api";

const themes = {
  emerald: {
    "--bg-main": "#06080c",
    "--bg-sidebar": "#090c13",
    "--bg-card": "rgba(16, 20, 31, 0.6)",
    "--border-color": "rgba(255, 255, 255, 0.05)",
    "--bg-input": "rgba(6, 8, 12, 0.6)",
    "--bg-th": "rgba(6, 8, 12, 0.4)",
    "--bg-mesh": "radial-gradient(at 0% 0%, rgba(16, 185, 129, 0.04) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(59, 130, 246, 0.04) 0px, transparent 50%), radial-gradient(at 50% 100%, rgba(16, 185, 129, 0.02) 0px, transparent 50%)",
    "--primary": "#10b981",
    "--primary-glow": "rgba(16, 185, 129, 0.06)",
    "--secondary": "#3b82f6",
    "--secondary-glow": "rgba(59, 130, 246, 0.06)",
    "--text-main": "#f8fafc",
    "--text-muted": "#64748b"
  },
  oceanic: {
    "--bg-main": "#050914",
    "--bg-sidebar": "#0b1120",
    "--bg-card": "rgba(15, 23, 42, 0.6)",
    "--border-color": "rgba(255, 255, 255, 0.05)",
    "--bg-input": "rgba(5, 9, 20, 0.6)",
    "--bg-th": "rgba(5, 9, 20, 0.4)",
    "--bg-mesh": "radial-gradient(at 0% 0%, rgba(6, 182, 212, 0.05) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(99, 102, 241, 0.05) 0px, transparent 50%), radial-gradient(at 50% 100%, rgba(6, 182, 212, 0.02) 0px, transparent 50%)",
    "--primary": "#06b6d4",
    "--primary-glow": "rgba(6, 182, 212, 0.08)",
    "--secondary": "#6366f1",
    "--secondary-glow": "rgba(99, 102, 241, 0.08)",
    "--text-main": "#f1f5f9",
    "--text-muted": "#94a3b8"
  },
  cyberpunk: {
    "--bg-main": "#030303",
    "--bg-sidebar": "#080808",
    "--bg-card": "rgba(24, 24, 27, 0.6)",
    "--border-color": "rgba(245, 158, 11, 0.15)",
    "--bg-input": "rgba(3, 3, 3, 0.6)",
    "--bg-th": "rgba(3, 3, 3, 0.4)",
    "--bg-mesh": "radial-gradient(at 0% 0%, rgba(245, 158, 11, 0.05) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(236, 72, 153, 0.05) 0px, transparent 50%), radial-gradient(at 50% 100%, rgba(245, 158, 11, 0.02) 0px, transparent 50%)",
    "--primary": "#f59e0b",
    "--primary-glow": "rgba(245, 158, 11, 0.08)",
    "--secondary": "#ec4899",
    "--secondary-glow": "rgba(236, 72, 153, 0.08)",
    "--text-main": "#fafafa",
    "--text-muted": "#71717a"
  },
  nordic: {
    "--bg-main": "#f8fafc",
    "--bg-sidebar": "#f1f5f9",
    "--bg-card": "rgba(255, 255, 255, 0.8)",
    "--border-color": "rgba(15, 23, 42, 0.08)",
    "--bg-input": "rgba(255, 255, 255, 0.9)",
    "--bg-th": "rgba(15, 23, 42, 0.04)",
    "--bg-mesh": "radial-gradient(at 0% 0%, rgba(37, 99, 235, 0.03) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(15, 23, 42, 0.03) 0px, transparent 50%)",
    "--primary": "#1e293b",
    "--primary-glow": "rgba(30, 41, 59, 0.06)",
    "--secondary": "#2563eb",
    "--secondary-glow": "rgba(37, 99, 235, 0.06)",
    "--text-main": "#0f172a",
    "--text-muted": "#64748b"
  }
};

function CircularProgress({ score, label, color = "var(--primary)" }) {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="score-ring" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
        <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)', width: '80px', height: '80px' }}>
          <circle cx="40" cy="40" r={radius} stroke="rgba(255,255,255,0.03)" strokeWidth="5" fill="transparent" />
          <circle 
            cx="40" 
            cy="40" 
            r={radius} 
            stroke={color} 
            strokeWidth="5" 
            fill="transparent" 
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
          />
        </svg>
        <span style={{ position: 'absolute', fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>
          {score}%
        </span>
      </div>
      <div className="score-label" style={{ fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.5px' }}>{label}</div>
    </div>
  );
}

function HighlightedResumeText({ text, matchingSkills = [], semanticKeywords = [] }) {
  if (!text) return <p style={{ color: 'var(--text-muted)' }}>No resume text available.</p>;
  
  const skillsToHighlight = [...matchingSkills].sort((a,b) => b.length - a.length);
  const semanticToHighlight = [...semanticKeywords].filter(s => !skillsToHighlight.includes(s)).sort((a,b) => b.length - a.length);
  
  let html = text;
  html = html.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  
  skillsToHighlight.forEach(skill => {
    if (skill.length > 1) {
      const regex = new RegExp(`\\b(${skill})\\b`, 'gi');
      html = html.replace(regex, `<mark class="hl-skill">$1</mark>`);
    }
  });
  
  semanticToHighlight.forEach(keyword => {
    if (keyword.length > 1) {
      const regex = new RegExp(`\\b(${keyword})\\b`, 'gi');
      html = html.replace(regex, `<mark class="hl-semantic">$1</mark>`);
    }
  });

  return (
    <pre 
      style={{ 
        whiteSpace: 'pre-wrap', 
        fontFamily: 'monospace', 
        fontSize: '0.85rem', 
        lineHeight: '1.6', 
        maxHeight: '300px', 
        overflowY: 'auto', 
        padding: '16px', 
        backgroundColor: 'rgba(0,0,0,0.3)', 
        borderRadius: '8px', 
        border: '1px solid var(--border-color)',
        color: '#d1d5db'
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default function App() {
  const [theme, setTheme] = useState(localStorage.getItem("recruit-theme") || "emerald");
  const [currentTab, setCurrentTab] = useState("dashboard");
  const [stats, setStats] = useState({ candidates: 0, jobs: 0, matches: 0 });
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);

  // Configurable Scoring Weight States (must be declared before the weight useEffect below)
  const [weightSemantic, setWeightSemantic] = useState(60);
  const [weightSkill, setWeightSkill] = useState(25);
  const [weightExperience, setWeightExperience] = useState(10);
  const [weightEducation, setWeightEducation] = useState(5);

  useEffect(() => {
    const selectedThemeVars = themes[theme];
    if (selectedThemeVars) {
      Object.keys(selectedThemeVars).forEach((key) => {
        document.documentElement.style.setProperty(key, selectedThemeVars[key]);
      });
      localStorage.setItem("recruit-theme", theme);
    }
  }, [theme]);

  // Recalculate all scores dynamically on weight slider change
  useEffect(() => {
    if (matchingResult) {
      const overall = Math.round(
        (matchingResult.semantic_score * (weightSemantic / 100)) +
        (matchingResult.skill_score * (weightSkill / 100)) +
        (matchingResult.experience_score * (weightExperience / 100)) +
        (matchingResult.education_score * (weightEducation / 100))
      );
      setMatchingResult(prev => prev ? { ...prev, overall_score: overall } : null);
    }

    if (comparisonResults && comparisonResults.length > 0) {
      const updatedComp = comparisonResults.map(item => {
        const overall = Math.round(
          (item.semantic_score * (weightSemantic / 100)) +
          (item.skill_score * (weightSkill / 100)) +
          (item.experience_score * (weightExperience / 100)) +
          (item.education_score * (weightEducation / 100))
        );
        return { ...item, overall_score: overall };
      });
      updatedComp.sort((a, b) => b.overall_score - a.overall_score);
      setComparisonResults(updatedComp);
    }

    if (batchResult && batchResult.rankings && batchResult.rankings.length > 0) {
      const updatedBatch = batchResult.rankings.map(item => {
        const overall = Math.round(
          (item.semantic_score * (weightSemantic / 100)) +
          (item.skill_score * (weightSkill / 100)) +
          (item.experience_score * (weightExperience / 100)) +
          (item.education_score * (weightEducation / 100))
        );
        return { ...item, overall_score: overall };
      });
      updatedBatch.sort((a, b) => b.overall_score - a.overall_score);
      const rankedBatch = updatedBatch.map((item, idx) => ({ ...item, rank: idx + 1 }));
      setBatchResult(prev => prev ? { ...prev, rankings: rankedBatch } : null);
    }
  }, [weightSemantic, weightSkill, weightExperience, weightEducation]);
  
  // Resume Analyzer States
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [parsedCandidate, setParsedCandidate] = useState(null);
  const [uploadLinkedin, setUploadLinkedin] = useState("");
  const [uploadLinkedinText, setUploadLinkedinText] = useState("");
  const [uploadGithub, setUploadGithub] = useState("");
  const [uploadLeetcode, setUploadLeetcode] = useState("");
  const [uploadHackerrank, setUploadHackerrank] = useState("");
  const [enriching, setEnriching] = useState(false);
  const [enrichMsg, setEnrichMsg] = useState("");

  // Direct Profile Importer States (LinkedIn + GitHub analysis)
  const [analyzerMode, setAnalyzerMode] = useState("upload"); // "upload" | "direct"
  const [directName, setDirectName] = useState("");
  const [directEmail, setDirectEmail] = useState("");
  const [directLinkedin, setDirectLinkedin] = useState("");
  const [directLinkedinText, setDirectLinkedinText] = useState("");
  const [directGithub, setDirectGithub] = useState("");
  const [directLeetcode, setDirectLeetcode] = useState("");
  const [directHackerrank, setDirectHackerrank] = useState("");
  const [directImporting, setDirectImporting] = useState(false);
  const [directError, setDirectError] = useState("");



  
  // Job Creator States
  const [jobTitle, setJobTitle] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [jobExp, setJobExp] = useState(0);
  const [jobSkillsText, setJobSkillsText] = useState("");
  const [jobCreating, setJobCreating] = useState(false);
  const [jobCreatedMsg, setJobCreatedMsg] = useState("");

  // Matching States
  const [selectedCandidate, setSelectedCandidate] = useState("");
  const [selectedJob, setSelectedJob] = useState("");
  const [matchingResult, setMatchingResult] = useState(null);
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [matchingError, setMatchingError] = useState("");

  // Synthetic Model Lab States
  const [labGenerating, setLabGenerating] = useState(false);
  const [labTraining, setLabTraining] = useState(false);
  const [labEvaluating, setLabEvaluating] = useState(false);
  const [labFairnessTesting, setLabFairnessTesting] = useState(false);
  const [labStatus, setLabStatus] = useState("Dataset not generated");
  const [labMetrics, setLabMetrics] = useState(null);
  const [labFairnessResult, setLabFairnessResult] = useState(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [expFilter, setExpFilter] = useState(0);

  // Candidate Comparer States
  const [comparerJob, setComparerJob] = useState("");
  const [selectedComparerCandidates, setSelectedComparerCandidates] = useState([]);
  const [comparisonResults, setComparisonResults] = useState([]);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [comparisonError, setComparisonError] = useState("");
  const [isCustomJob, setIsCustomJob] = useState(false);
  const [customJobTitle, setCustomJobTitle] = useState("");
  const [customJobDesc, setCustomJobDesc] = useState("");
  const [customJobExp, setCustomJobExp] = useState(0);
  const [customJobSkills, setCustomJobSkills] = useState("");

  // Batch Evaluation States
  const [batchJobId, setBatchJobId] = useState("");
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [batchResult, setBatchResult] = useState(null);
  const [batchError, setBatchError] = useState("");
  const [batchActiveDetails, setBatchActiveDetails] = useState(null);

  // Benchmarking States
  const [labBenchmark, setLabBenchmark] = useState(null);
  const [labBenchmarking, setLabBenchmarking] = useState(false);

  // Skill Taxonomy / Synonym Mapper States
  const [synonyms, setSynonyms] = useState([]);
  const [synonymLoading, setSynonymLoading] = useState(false);
  const [synSkill, setSynSkill] = useState("");
  const [synSynonym, setSynSynonym] = useState("");
  const [synRatio, setSynRatio] = useState(0.8);
  const [synSaving, setSynSaving] = useState(false);
  const [synMsg, setSynMsg] = useState("");

  // Profile Verifier States (Section 5.9)
  const [verificationResult, setVerificationResult] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [verifyCandidateId, setVerifyCandidateId] = useState("");

  // Load initial dashboard stats and list tables
  useEffect(() => {
    fetchStats();
    fetchCandidates();
    fetchJobs();
    checkLabStatus();
  }, []);

  const fetchStats = async () => {
    try {
      const resCand = await axios.get(`${API_BASE}/candidates`);
      const resJobs = await axios.get(`${API_BASE}/jobs`);
      // Simulating match stats from length
      setStats({
        candidates: resCand.data.length,
        jobs: resJobs.data.length,
        matches: resCand.data.length * 2 // Prototypical score
      });
    } catch (e) {
      console.error("Error fetching stats:", e);
    }
  };

  const fetchCandidates = async () => {
    try {
      const res = await axios.get(`${API_BASE}/candidates`);
      setCandidates(res.data);
    } catch (e) {
      console.error("Error fetching candidates:", e);
    }
  };

  const fetchJobs = async () => {
    try {
      const res = await axios.get(`${API_BASE}/jobs`);
      setJobs(res.data);
    } catch (e) {
      console.error("Error fetching jobs:", e);
    }
  };

  const checkLabStatus = async () => {
    try {
      const res = await axios.get(`${API_BASE}/training/metrics`);
      if (res.data && res.data.status !== "idle") {
        setLabStatus("Model Trained");
        setLabMetrics(res.data);
      }
    } catch (e) {
      console.error("Error checking model status:", e);
    }
  };

  // Upload handlers
  const handleUploadResume = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError("Please select a PDF or DOCX file.");
      return;
    }
    setUploading(true);
    setUploadError("");
    setParsedCandidate(null);

    const formData = new FormData();
    formData.append("file", uploadFile);
    if (uploadLinkedin) formData.append("linkedin_url", uploadLinkedin);
    if (uploadLinkedinText) formData.append("linkedin_text", uploadLinkedinText);
    if (uploadGithub) formData.append("github_url", uploadGithub);
    if (uploadLeetcode) formData.append("leetcode_url", uploadLeetcode);
    if (uploadHackerrank) formData.append("hackerrank_url", uploadHackerrank);

    try {
      const res = await axios.post(`${API_BASE}/resume/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setParsedCandidate(res.data);
      fetchStats();
      fetchCandidates();
    } catch (err) {
      setUploadError(err.response?.data?.detail || "Upload & parsing failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleDirectProfileImport = async (e) => {
    e.preventDefault();
    if (!directName && !directLinkedin && !directGithub) {
      setDirectError("Please provide at least a Name, LinkedIn profile, or GitHub username.");
      return;
    }
    setDirectImporting(true);
    setDirectError("");
    setParsedCandidate(null);

    try {
      const res = await axios.post(`${API_BASE}/resume/import-profiles`, {
        name: directName || "Candidate from Profiles",
        email: directEmail || "",
        linkedin_url: directLinkedin || "",
        linkedin_text: directLinkedinText || "",
        github_url: directGithub || "",
        leetcode_url: directLeetcode || "",
        hackerrank_url: directHackerrank || ""
      });
      setParsedCandidate(res.data);
      fetchStats();
      fetchCandidates();
    } catch (err) {
      setDirectError(err.response?.data?.detail || "Profile extraction and analysis failed.");
    } finally {
      setDirectImporting(false);
    }
  };

  const handleLoadSample = async (filename) => {
    setUploading(true);
    setUploadError("");
    setParsedCandidate(null);
    try {
      const res = await axios.post(`${API_BASE}/resume/load-sample?filename=${filename}`);
      setParsedCandidate(res.data);
      fetchStats();
      fetchCandidates();
    } catch (err) {
      setUploadError(err.response?.data?.detail || "Failed to load sample resume.");
    } finally {
      setUploading(false);
    }
  };

  // Create Job handler
  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!jobTitle || !jobDesc) {
      setJobCreatedMsg("Title and Description are required.");
      return;
    }
    setJobCreating(true);
    setJobCreatedMsg("");

    try {
      await axios.post(`${API_BASE}/jobs`, {
        job_title: jobTitle,
        description: jobDesc,
        experience_required: parseInt(jobExp),
        raw_skills_text: jobSkillsText
      });
      setJobCreatedMsg("Job Successfully Created ✓");
      setJobTitle("");
      setJobDesc("");
      setJobSkillsText("");
      setJobExp(0);
      fetchStats();
      fetchJobs();
    } catch (err) {
      setJobCreatedMsg("Failed to create job.");
    } finally {
      setJobCreating(false);
    }
  };

  // Matching handler
  const handleAnalyzeMatch = async (e) => {
    e.preventDefault();
    if (!selectedCandidate || !selectedJob) {
      setMatchingError("Select both candidate and job position.");
      return;
    }
    setMatchingLoading(true);
    setMatchingError("");
    setMatchingResult(null);

    try {
      const res = await axios.post(`${API_BASE}/matching/analyze`, {
        candidate_id: parseInt(selectedCandidate),
        job_id: parseInt(selectedJob),
        semantic_w: weightSemantic / 100,
        skill_w: weightSkill / 100,
        exp_w: weightExperience / 100,
        edu_w: weightEducation / 100
      });
      setMatchingResult(res.data);
    } catch (err) {
      setMatchingError("Error calculating similarity match.");
    } finally {
      setMatchingLoading(false);
    }
  };

  // Synthetic Data generation
  const handleGenerateSynthetic = async () => {
    setLabGenerating(true);
    try {
      const res = await axios.post(`${API_BASE}/training/generate-data`);
      setLabStatus("Data Generated");
      alert(res.data.message);
    } catch (e) {
      alert("Failed to generate dataset.");
    } finally {
      setLabGenerating(false);
    }
  };

  // Train model
  const handleTrainModel = async () => {
    setLabTraining(true);
    try {
      const res = await axios.post(`${API_BASE}/training/train`);
      setLabStatus("Model Trained");
      setLabMetrics(res.data.metrics);
      alert("Random Forest model trained successfully on synthetic candidate-job pairs!");
    } catch (e) {
      alert(e.response?.data?.detail || "Failed to train model.");
    } finally {
      setLabTraining(false);
    }
  };

  // Evaluate model
  const handleEvaluateModel = async () => {
    setLabEvaluating(true);
    try {
      const res = await axios.post(`${API_BASE}/training/evaluate`);
      setLabMetrics(res.data);
    } catch (e) {
      alert(e.response?.data?.detail || "Failed to evaluate model.");
    } finally {
      setLabEvaluating(false);
    }
  };

  // Fairness validation audit
  const handleRunFairness = async () => {
    setLabFairnessTesting(true);
    try {
      const res = await axios.get(`${API_BASE}/fairness/test`);
      setLabFairnessResult(res.data);
    } catch (e) {
      alert("Failed to execute fairness test audit.");
    } finally {
      setLabFairnessTesting(false);
    }
  };

  // Candidate comparison executor
  const handleCompareCandidates = async (e) => {
    e.preventDefault();
    
    let targetJobId = comparerJob;
    
    if (isCustomJob) {
      if (!customJobTitle || !customJobDesc) {
        setComparisonError("Please enter a custom Job Title and Job Description.");
        return;
      }
      setComparisonLoading(true);
      setComparisonError("");
      try {
        const skillsArray = customJobSkills.trim() ? customJobSkills.split(',').map(s => ({ skill: s.trim(), skill_type: 'required' })) : [];
        const resJob = await axios.post(`${API_BASE}/jobs`, {
          job_title: customJobTitle,
          description: customJobDesc,
          experience_required: parseInt(customJobExp || 0),
          skills: skillsArray
        });
        targetJobId = resJob.data.id.toString();
        // Refresh jobs list so it shows up in dropdowns
        fetchJobs();
      } catch (err) {
        setComparisonError("Failed to create custom target job description.");
        setComparisonLoading(false);
        return;
      }
    }

    if (!targetJobId || selectedComparerCandidates.length === 0) {
      setComparisonError("Please select a job position and at least one candidate.");
      setComparisonLoading(false);
      return;
    }
    
    setComparisonLoading(true);
    setComparisonError("");
    setComparisonResults([]);
    try {
      const results = [];
      for (const candId of selectedComparerCandidates) {
        const res = await axios.post(`${API_BASE}/matching/analyze`, {
          candidate_id: parseInt(candId),
          job_id: parseInt(targetJobId),
          semantic_w: weightSemantic / 100,
          skill_w: weightSkill / 100,
          exp_w: weightExperience / 100,
          edu_w: weightEducation / 100
        });
        results.push(res.data);
      }
      // Sort results by overall score descending to rank them
      results.sort((a, b) => b.overall_score - a.overall_score);
      setComparisonResults(results);
    } catch (err) {
      setComparisonError("Error executing side-by-side comparison analysis.");
    } finally {
      setComparisonLoading(false);
    }
  };

  // Run Batch Evaluation (100 resumes)
  const handleRunBatchEvaluation = async (e) => {
    e.preventDefault();
    if (!batchJobId) {
      setBatchError("Please select a target job position to match the batch against.");
      return;
    }
    setBatchLoading(true);
    setBatchProgress(0);
    setBatchError("");
    setBatchResult(null);

    // Simulate progress increments for visual feedback
    let currentProgress = 0;
    const progressInterval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 15) + 5;
      if (currentProgress >= 98) {
        currentProgress = 98;
        clearInterval(progressInterval);
      }
      setBatchProgress(currentProgress);
    }, 200);

    try {
      const res = await axios.post(`${API_BASE}/resume/process-local-batch?job_id=${batchJobId}&semantic_w=${weightSemantic/100}&skill_w=${weightSkill/100}&exp_w=${weightExperience/100}&edu_w=${weightEducation/100}`);
      clearInterval(progressInterval);
      setBatchProgress(100);
      setTimeout(() => {
        setBatchResult(res.data);
        setBatchLoading(false);
        fetchCandidates();
        fetchStats();
      }, 400);
    } catch (err) {
      clearInterval(progressInterval);
      setBatchLoading(false);
      setBatchError(err.response?.data?.detail || "Failed to execute batch processing evaluation.");
    }
  };

  // Run benchmark evaluation
  const handleRunBenchmark = async () => {
    setLabBenchmarking(true);
    try {
      const res = await axios.get(`${API_BASE}/training/benchmark`);
      setLabBenchmark(res.data);
    } catch (e) {
      alert("Failed to execute baseline benchmarking.");
    } finally {
      setLabBenchmarking(false);
    }
  };

  const renderWeightSliders = () => {
    const totalWeights = Number(weightSemantic) + Number(weightSkill) + Number(weightExperience) + Number(weightEducation);
    const weightsValid = Math.abs(totalWeights - 100) < 0.01;
    return (
      <div className="form-card" style={{ marginBottom: '24px', padding: '20px' }}>
        <h4 style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '16px', textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.5px' }}>
          Configurable Scoring Weights (Must equal 100%)
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '12px' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>Semantic Similarity: {weightSemantic}%</label>
            <input 
              type="range" min="0" max="100" value={weightSemantic} 
              onChange={(e) => setWeightSemantic(Number(e.target.value))} 
              style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>Skill Matching: {weightSkill}%</label>
            <input 
              type="range" min="0" max="100" value={weightSkill} 
              onChange={(e) => setWeightSkill(Number(e.target.value))} 
              style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>Experience Fit: {weightExperience}%</label>
            <input 
              type="range" min="0" max="100" value={weightExperience} 
              onChange={(e) => setWeightExperience(Number(e.target.value))} 
              style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>Education Fit: {weightEducation}%</label>
            <input 
              type="range" min="0" max="100" value={weightEducation} 
              onChange={(e) => setWeightEducation(Number(e.target.value))} 
              style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
          <span style={{ color: weightsValid ? 'var(--primary)' : 'var(--danger)', fontWeight: 'bold' }}>
            Total Allocation: {totalWeights}% {weightsValid ? "✓ Balanced" : "⚠ Sum must equal exactly 100%"}
          </span>
          <button 
            type="button" 
            onClick={() => { setWeightSemantic(60); setWeightSkill(25); setWeightExperience(10); setWeightEducation(5); }}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.75rem' }}
          >
            Reset to Defaults
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="logo-container">
          <div className="logo-icon">IQ</div>
          <div className="logo-text">
            <h1>RecruitIQ</h1>
            <p>Intelligence Hub</p>
          </div>
        </div>

        <ul className="nav-links">
          <li className={`nav-item ${currentTab === "dashboard" ? "active" : ""}`} onClick={() => setCurrentTab("dashboard")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
            Dashboard
          </li>
          <li className={`nav-item ${currentTab === "candidates" ? "active" : ""}`} onClick={() => setCurrentTab("candidates")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            Candidates
          </li>
          <li className={`nav-item ${currentTab === "jobs" ? "active" : ""}`} onClick={() => setCurrentTab("jobs")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
            Jobs
          </li>
          <li className={`nav-item ${currentTab === "analyzer" ? "active" : ""}`} onClick={() => setCurrentTab("analyzer")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            Resume Analyzer
          </li>
          <li className={`nav-item ${currentTab === "matching" ? "active" : ""}`} onClick={() => { setCurrentTab("matching"); setMatchingResult(null); }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            Matching Engine
          </li>
          <li className={`nav-item ${currentTab === "comparer" ? "active" : ""}`} onClick={() => { setCurrentTab("comparer"); setComparisonResults([]); }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
            Candidate Comparer
          </li>
          <li className={`nav-item ${currentTab === "batch" ? "active" : ""}`} onClick={() => { setCurrentTab("batch"); setBatchResult(null); }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><line x1="12" y1="11" x2="12" y2="17"></line><line x1="9" y1="14" x2="15" y2="14"></line></svg>
            Batch Evaluation
          </li>
          <li className={`nav-item ${currentTab === "lab" ? "active" : ""}`} onClick={() => setCurrentTab("lab")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="15" x2="23" y2="15"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="15" x2="4" y2="15"></line></svg>
            Synthetic Model Lab
          </li>
          <li className={`nav-item ${currentTab === "settings" ? "active" : ""}`} onClick={() => setCurrentTab("settings")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            Skill Taxonomy
          </li>
          <li className={`nav-item ${currentTab === "verifier" ? "active" : ""}`} onClick={() => { setCurrentTab("verifier"); setVerificationResult(null); }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            Profile Verifier
          </li>
        </ul>

        <div className="sidebar-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: 'auto' }}>
          <div style={{ marginBottom: '12px', textAlign: 'left' }}>
            <label style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Theme Selector</label>
            <select 
              value={theme} 
              onChange={(e) => setTheme(e.target.value)} 
              style={{ padding: '6px 10px', fontSize: '0.8rem', backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)', width: '100%', cursor: 'pointer' }}
            >
              <option value="emerald">Graphite Emerald</option>
              <option value="oceanic">Deep Oceanic</option>
              <option value="cyberpunk">Cyberpunk Amber</option>
              <option value="nordic">Nordic Light</option>
            </select>
          </div>
          <p style={{ fontWeight: '700', color: 'var(--text-main)', marginBottom: '2px' }}>Review 3 Build</p>
          <p>Local Environment</p>
        </div>
      </aside>

      {/* Main dashboard content area */}
      <main className="main-content">
        
        {/* TAB 1: DASHBOARD */}
        {currentTab === "dashboard" && (
          <div>
            <div className="page-header">
              <h2>Recruiter Dashboard</h2>
              <p>AI-Powered decisions for corporate HR screening and placement.</p>
            </div>

            <div className="dashboard-grid">
              <div className="card-stat">
                <div className="stat-icon">👤</div>
                <div className="stat-info">
                  <h3>Total Candidates</h3>
                  <p>{stats.candidates}</p>
                </div>
              </div>
              <div className="card-stat">
                <div className="stat-icon green">💼</div>
                <div className="stat-info">
                  <h3>Active Positions</h3>
                  <p>{stats.jobs}</p>
                </div>
              </div>
              <div className="card-stat">
                <div className="stat-icon">⚡</div>
                <div className="stat-info">
                  <h3>Matches Evaluated</h3>
                  <p>{stats.candidates > 0 && stats.jobs > 0 ? stats.candidates * stats.jobs : 0}</p>
                </div>
              </div>
            </div>

            <div className="table-container">
              <div className="table-header">
                <h3>Recently Processed Candidates</h3>
              </div>
              {candidates.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No candidates registered. Please go to the <strong>Resume Analyzer</strong> tab to upload resumes.
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Contact Number</th>
                      <th>Core Skills</th>
                      <th>Date Added</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidates.slice(-5).reverse().map((c) => (
                      <tr key={c.id}>
                        <td><strong>{c.name}</strong></td>
                        <td>{c.email || "N/A"}</td>
                        <td>{c.phone || "N/A"}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {c.skills.slice(0, 3).map((sk, idx) => (
                              <span key={idx} className="badge badge-primary">{sk.skill}</span>
                            ))}
                            {c.skills.length > 3 && <span className="badge badge-primary">+{c.skills.length - 3} more</span>}
                          </div>
                        </td>
                        <td>{new Date(c.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: CANDIDATES */}
        {currentTab === "candidates" && (() => {
          const filteredCandidates = candidates.filter(c => {
            const nameMatch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
            const skillMatch = c.skills.some(sk => sk.skill.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesSearch = nameMatch || skillMatch;
            
            let candYears = 0;
            if (c.experience) {
              const match = c.experience.match(/\b(\d+)\+?\s*(?:years?|yrs?)\b/i);
              if (match) {
                candYears = parseInt(match[1]);
              }
            }
            const matchesExp = candYears >= expFilter;
            
            return matchesSearch && matchesExp;
          });

          return (
            <div>
              <div className="page-header">
                <h2>Candidate Registry</h2>
                <p>Comprehensive list of parsed and stored candidate files.</p>
              </div>

              <div className="form-card" style={{ display: 'flex', gap: '20px', padding: '16px 24px', marginBottom: '20px' }}>
                <div className="form-group" style={{ margin: 0, flex: 2 }}>
                  <input 
                    type="text" 
                    placeholder="🔍 Search candidates by name or core skills..." 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                  />
                </div>
                <div className="form-group" style={{ margin: 0, flex: 1 }}>
                  <select 
                    value={expFilter} 
                    onChange={(e) => setExpFilter(parseInt(e.target.value))}
                  >
                    <option value="0">All Experience Levels</option>
                    <option value="1">1+ Year Experience</option>
                    <option value="3">3+ Years Experience</option>
                    <option value="5">5+ Years Experience</option>
                  </select>
                </div>
              </div>

              <div className="table-container">
                {filteredCandidates.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No candidates match the specified criteria.
                  </div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Candidate ID</th>
                        <th>Name</th>
                        <th>Contact Info</th>
                        <th>Professional Profiles</th>
                        <th>Education</th>
                        <th>Extracted Skill Inventory</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCandidates.map((c) => (
                        <tr key={c.id}>
                          <td>#{c.id}</td>
                          <td>
                            <strong>{c.name}</strong>
                            {c.resume_filename && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.resume_filename}</div>}
                          </td>
                          <td>
                            <div>{c.email || "No Email"}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.phone || "No Phone"}</div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              {c.linkedin_url && (
                                <a href={c.linkedin_url.startsWith('http') ? c.linkedin_url : `https://linkedin.com/in/${c.linkedin_url}`} target="_blank" rel="noreferrer" title={`LinkedIn: @${c.linkedin_url}`} style={{ padding: '2px 6px', background: '#0077b5', color: '#fff', borderRadius: '4px', textDecoration: 'none', fontSize: '0.7rem' }}>
                                  💼 LinkedIn
                                </a>
                              )}
                              {c.github_url && (
                                <a href={c.github_url.startsWith('http') ? c.github_url : `https://github.com/${c.github_url}`} target="_blank" rel="noreferrer" title={`GitHub: @${c.github_url}`} style={{ padding: '2px 6px', background: '#24292e', color: '#fff', border: '1px solid #555', borderRadius: '4px', textDecoration: 'none', fontSize: '0.7rem' }}>
                                  🐙 GitHub
                                </a>
                              )}
                              {c.leetcode_url && (
                                <a href={c.leetcode_url.startsWith('http') ? c.leetcode_url : `https://leetcode.com/${c.leetcode_url}`} target="_blank" rel="noreferrer" title={`LeetCode: @${c.leetcode_url}`} style={{ padding: '2px 6px', background: '#f59e0b', color: '#000', fontWeight: 'bold', borderRadius: '4px', textDecoration: 'none', fontSize: '0.7rem' }}>
                                  🧩 LeetCode
                                </a>
                              )}
                              {c.hackerrank_url && (
                                <a href={c.hackerrank_url.startsWith('http') ? c.hackerrank_url : `https://hackerrank.com/${c.hackerrank_url}`} target="_blank" rel="noreferrer" title={`HackerRank: @${c.hackerrank_url}`} style={{ padding: '2px 6px', background: '#10b981', color: '#fff', borderRadius: '4px', textDecoration: 'none', fontSize: '0.7rem' }}>
                                  🟢 HackerRank
                                </a>
                              )}
                              {!c.linkedin_url && !c.github_url && !c.leetcode_url && !c.hackerrank_url && (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>None linked</span>
                              )}
                            </div>
                          </td>
                          <td>{c.education ? c.education.substring(0, 50) + (c.education.length > 50 ? "..." : "") : "N/A"}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              {c.skills.map((sk, idx) => (
                                <span key={idx} className="badge badge-primary">{sk.skill}</span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          );
        })()}

        {/* TAB 3: JOBS */}
        {currentTab === "jobs" && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            <div>
              <div className="page-header">
                <h2>Create Job Listing</h2>
                <p>Register new openings. Our parser classifies skills automatically.</p>
              </div>

              <div className="form-card">
                <form onSubmit={handleCreateJob}>
                  <div className="form-group">
                    <label>Job Title</label>
                    <input type="text" placeholder="e.g. Machine Learning Engineer" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Job Description</label>
                    <textarea placeholder="Specify requirements, responsibilities, and expected tools..." value={jobDesc} onChange={(e) => setJobDesc(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Minimum Experience (Years)</label>
                    <input type="number" min="0" max="20" value={jobExp} onChange={(e) => setJobExp(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Additional Required Skills (Comma separated)</label>
                    <input type="text" placeholder="e.g. TensorFlow, FastAPI, Docker" value={jobSkillsText} onChange={(e) => setJobSkillsText(e.target.value)} />
                  </div>

                  <button className="btn btn-primary" type="submit" disabled={jobCreating}>
                    {jobCreating ? "Analyzing & Saving..." : "Analyze & Save Job"}
                  </button>
                </form>
                {jobCreatedMsg && (
                  <div style={{ marginTop: '16px', color: jobCreatedMsg.includes('✓') ? 'var(--success)' : 'var(--danger)', fontWeight: 'bold' }}>
                    {jobCreatedMsg}
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="page-header">
                <h2>Active Listings</h2>
                <p>List of saved positions with classified skill layers.</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {jobs.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'var(--text-muted)' }}>
                    No jobs created. Register your first position.
                  </div>
                ) : (
                  jobs.map((j) => (
                    <div key={j.id} style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '20px', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h4 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{j.job_title}</h4>
                        <span className="badge badge-success">{j.experience_required} Yrs Required</span>
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
                        {j.description.substring(0, 150)}...
                      </p>
                      <div>
                        <h5 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Extracted Skills</h5>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {j.skills.map((sk, idx) => (
                            <span key={idx} className={`badge ${sk.skill_type === 'required' ? 'badge-primary' : 'badge-success'}`}>
                              {sk.skill} ({sk.skill_type})
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: RESUME ANALYZER */}
        {currentTab === "analyzer" && (
          <div>
            <div className="page-header">
              <h2>Resume & Profile Analyzer</h2>
              <p>Upload PDF/DOCX or directly analyze LinkedIn & GitHub profiles to auto-extract skills, projects, and certifications.</p>
            </div>

            {/* Mode Switcher */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
              <button 
                type="button" 
                className={`btn ${analyzerMode === "upload" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setAnalyzerMode("upload")}
                style={{ padding: '8px 20px', borderRadius: '24px', fontSize: '0.85rem' }}
              >
                📄 Upload Resume File (.pdf / .docx)
              </button>
              <button 
                type="button" 
                className={`btn ${analyzerMode === "direct" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setAnalyzerMode("direct")}
                style={{ padding: '8px 20px', borderRadius: '24px', fontSize: '0.85rem' }}
              >
                🌐 Direct LinkedIn &amp; GitHub Analyzer
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px', margin: '0 auto 30px', maxWidth: '1000px' }}>
              
              {/* Option A: Upload Resume File */}
              {analyzerMode === "upload" && (
                <div className="form-card" style={{ margin: 0 }}>
                  <h3 style={{ marginBottom: '16px', fontSize: '1.2rem' }}>Upload Resume File</h3>
                  <form onSubmit={handleUploadResume}>
                    <div className="upload-zone" onClick={() => document.getElementById('file-input').click()}>
                      <div className="upload-icon">📤</div>
                      <p><strong>Click to choose candidate file</strong></p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Supports PDF, DOC, DOCX up to 5MB</p>
                      <input type="file" id="file-input" style={{ display: 'none' }} accept=".pdf,.docx,.doc" onChange={(e) => setUploadFile(e.target.files[0])} />
                    </div>
                    {uploadFile && (
                      <div style={{ marginTop: '12px', fontSize: '0.9rem', textAlign: 'center' }}>
                        Selected: <strong>{uploadFile.name}</strong>
                      </div>
                    )}

                    <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                        Optional: Profile Handles / URLs (Auto-detected if in resume)
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <input 
                          type="text" 
                          placeholder="LinkedIn Profile URL / Handle" 
                          value={uploadLinkedin} 
                          onChange={(e) => setUploadLinkedin(e.target.value)} 
                          style={{ padding: '8px 12px', fontSize: '0.8rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)' }}
                        />
                        <input 
                          type="text" 
                          placeholder="GitHub Username / URL" 
                          value={uploadGithub} 
                          onChange={(e) => setUploadGithub(e.target.value)} 
                          style={{ padding: '8px 12px', fontSize: '0.8rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)' }}
                        />
                        <input 
                          type="text" 
                          placeholder="LeetCode Username" 
                          value={uploadLeetcode} 
                          onChange={(e) => setUploadLeetcode(e.target.value)} 
                          style={{ padding: '8px 12px', fontSize: '0.8rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)' }}
                        />
                        <input 
                          type="text" 
                          placeholder="HackerRank Username" 
                          value={uploadHackerrank} 
                          onChange={(e) => setUploadHackerrank(e.target.value)} 
                          style={{ padding: '8px 12px', fontSize: '0.8rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)' }}
                        />
                      </div>
                      <div style={{ marginTop: '10px' }}>
                        <textarea
                          placeholder="Optional: Paste LinkedIn About / Headline / Experience text to extract extra skills & projects..."
                          value={uploadLinkedinText}
                          onChange={(e) => setUploadLinkedinText(e.target.value)}
                          rows={2}
                          style={{ width: '100%', padding: '8px 12px', fontSize: '0.8rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)', resize: 'vertical' }}
                        />
                      </div>
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '20px' }}>
                      <button className="btn btn-primary" type="submit" disabled={uploading}>
                        {uploading ? "Running NLP Extraction Pipeline..." : "Upload & Analyze Resume"}
                      </button>
                    </div>
                  </form>

                  {uploading && <div className="spinner"></div>}
                  {uploadError && <div style={{ color: 'var(--danger)', marginTop: '16px', textAlign: 'center' }}>{uploadError}</div>}
                </div>
              )}

              {/* Option B: Direct Profile Importer (LinkedIn + GitHub) */}
              {analyzerMode === "direct" && (
                <div className="form-card" style={{ margin: 0 }}>
                  <h3 style={{ marginBottom: '6px', fontSize: '1.2rem', color: 'var(--primary)' }}>⚡ Direct Profile Analyzer</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '16px' }}>
                    No PDF needed. Connect your LinkedIn &amp; GitHub to auto-pull public repositories, skills, and projects.
                  </p>
                  <form onSubmit={handleDirectProfileImport}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Candidate Name *</label>
                        <input 
                          type="text" 
                          placeholder="e.g. John Doe" 
                          value={directName} 
                          onChange={(e) => setDirectName(e.target.value)} 
                          required
                          style={{ width: '100%', padding: '8px 12px', fontSize: '0.8rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email Address</label>
                        <input 
                          type="email" 
                          placeholder="e.g. john@example.com" 
                          value={directEmail} 
                          onChange={(e) => setDirectEmail(e.target.value)} 
                          style={{ width: '100%', padding: '8px 12px', fontSize: '0.8rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>💼 LinkedIn Profile URL</label>
                        <input 
                          type="text" 
                          placeholder="https://linkedin.com/in/username" 
                          value={directLinkedin} 
                          onChange={(e) => setDirectLinkedin(e.target.value)} 
                          style={{ width: '100%', padding: '8px 12px', fontSize: '0.8rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>🐙 GitHub Username</label>
                        <input 
                          type="text" 
                          placeholder="e.g. torvalds" 
                          value={directGithub} 
                          onChange={(e) => setDirectGithub(e.target.value)} 
                          style={{ width: '100%', padding: '8px 12px', fontSize: '0.8rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>🧩 LeetCode Username</label>
                        <input 
                          type="text" 
                          placeholder="e.g. tourist" 
                          value={directLeetcode} 
                          onChange={(e) => setDirectLeetcode(e.target.value)} 
                          style={{ width: '100%', padding: '8px 12px', fontSize: '0.8rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>🟢 HackerRank Username</label>
                        <input 
                          type="text" 
                          placeholder="e.g. hackerrank_user" 
                          value={directHackerrank} 
                          onChange={(e) => setDirectHackerrank(e.target.value)} 
                          style={{ width: '100%', padding: '8px 12px', fontSize: '0.8rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)' }}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Paste LinkedIn About / Experience / Skills Text (Optional)
                      </label>
                      <textarea
                        placeholder="Paste your LinkedIn bio, headline, work experience summary, or project descriptions here. The NLP engine will automatically extract skills and roles."
                        value={directLinkedinText}
                        onChange={(e) => setDirectLinkedinText(e.target.value)}
                        rows={3}
                        style={{ width: '100%', padding: '8px 12px', fontSize: '0.8rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)', resize: 'vertical' }}
                      />
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <button className="btn btn-primary" type="submit" disabled={directImporting} style={{ width: '100%' }}>
                        {directImporting ? "Fetching Repos, Badges & Extracting Skills..." : "🚀 Analyze Profiles & Extract Skills & Projects"}
                      </button>
                    </div>
                  </form>

                  {directImporting && <div className="spinner" style={{ marginTop: '16px' }}></div>}
                  {directError && <div style={{ color: 'var(--danger)', marginTop: '16px', textAlign: 'center', fontSize: '0.85rem' }}>{directError}</div>}
                </div>
              )}

              <div className="form-card" style={{ margin: 0 }}>
                <h3 style={{ marginBottom: '16px', fontSize: '1.2rem' }}>Quick Seeding For Faculty Demo</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
                  Parse pre-seeded candidate resume files from disk without manual uploading.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '350px', overflowY: 'auto', paddingRight: '6px' }}>
                  <button className="btn btn-primary" style={{ background: '#1e1b4b', border: '1px solid #4338ca', justifyContent: 'flex-start' }} onClick={() => handleLoadSample("candidate1_ml.docx")}>
                    👤 Load Anirudh (ML Engineer)
                  </button>
                  <button className="btn btn-primary" style={{ background: '#1e1b4b', border: '1px solid #4338ca', justifyContent: 'flex-start' }} onClick={() => handleLoadSample("candidate2_java.docx")}>
                    👤 Load Rajesh (Java Developer)
                  </button>
                  <button className="btn btn-primary" style={{ background: '#1e1b4b', border: '1px solid #4338ca', justifyContent: 'flex-start' }} onClick={() => handleLoadSample("candidate3_fullstack.docx")}>
                    👤 Load Priya (Full Stack Developer)
                  </button>
                  <button className="btn btn-primary" style={{ background: '#1e1b4b', border: '1px solid #4338ca', justifyContent: 'flex-start' }} onClick={() => handleLoadSample("candidate4_datascience.docx")}>
                    👤 Load Sanjay (Data Analyst)
                  </button>
                  <button className="btn btn-primary" style={{ background: '#1e1b4b', border: '1px solid #4338ca', justifyContent: 'flex-start' }} onClick={() => handleLoadSample("candidate5_devops.docx")}>
                    👤 Load Neha (DevOps Systems)
                  </button>
                  <button className="btn btn-primary" style={{ background: '#1e1b4b', border: '1px solid #4338ca', justifyContent: 'flex-start' }} onClick={() => handleLoadSample("candidate6_frontend.docx")}>
                    👤 Load Vikram (Frontend Developer)
                  </button>
                  <button className="btn btn-primary" style={{ background: '#1e1b4b', border: '1px solid #4338ca', justifyContent: 'flex-start' }} onClick={() => handleLoadSample("candidate7_backend.docx")}>
                    👤 Load Aarav (Backend Engineer)
                  </button>
                  <button className="btn btn-primary" style={{ background: '#1e1b4b', border: '1px solid #4338ca', justifyContent: 'flex-start' }} onClick={() => handleLoadSample("candidate8_dba.docx")}>
                    👤 Load Meera (DBA Specialist)
                  </button>
                  <button className="btn btn-primary" style={{ background: '#1e1b4b', border: '1px solid #4338ca', justifyContent: 'flex-start' }} onClick={() => handleLoadSample("candidate9_cloud.docx")}>
                    👤 Load Rohit (Cloud Architect)
                  </button>
                  <button className="btn btn-primary" style={{ background: '#1e1b4b', border: '1px solid #4338ca', justifyContent: 'flex-start' }} onClick={() => handleLoadSample("candidate10_qa.docx")}>
                    👤 Load Sneha (QA Automation)
                  </button>
                </div>
              </div>
            </div>

            {parsedCandidate && (
              <div className="match-result-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                  Parsed Candidate Profile
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>CANDIDATE NAME</label>
                    <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{parsedCandidate.name}</p>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>EMAIL ADDRESS</label>
                    <p style={{ fontSize: '1.1rem' }}>{parsedCandidate.email || "Not specified"}</p>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>PHONE NUMBER</label>
                    <p>{parsedCandidate.phone || "Not specified"}</p>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>FILENAMES</label>
                    <p style={{ fontSize: '0.85rem' }}>{parsedCandidate.resume_filename}</p>
                  </div>
                </div>

                <div style={{ marginBottom: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>PROFESSIONAL PROFILES</label>
                    <button
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                      disabled={enriching}
                      onClick={async () => {
                        if (!parsedCandidate?.id) return;
                        setEnriching(true);
                        setEnrichMsg("");
                        try {
                          const res = await axios.post(`${API_BASE}/candidates/${parsedCandidate.id}/enrich`);
                          setEnrichMsg(`✓ Auto-extracted ${res.data.extracted_projects?.length || 0} GitHub projects & ${res.data.added_skills?.length || 0} skills!`);
                          // Refresh candidate
                          const candRes = await axios.get(`${API_BASE}/candidates/${parsedCandidate.id}`);
                          setParsedCandidate(candRes.data);
                          fetchCandidates();
                        } catch (e) {
                          setEnrichMsg("Failed to auto-extract profiles.");
                        } finally {
                          setEnriching(false);
                        }
                      }}
                    >
                      {enriching ? "Extracting Projects & Skills..." : "⚡ Auto-Extract Projects & Skills"}
                    </button>
                  </div>
                  {enrichMsg && <div style={{ color: '#10b981', fontSize: '0.8rem', marginBottom: '8px' }}>{enrichMsg}</div>}
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {parsedCandidate.linkedin_url ? (
                      <a href={parsedCandidate.linkedin_url.startsWith('http') ? parsedCandidate.linkedin_url : `https://linkedin.com/in/${parsedCandidate.linkedin_url}`} target="_blank" rel="noreferrer" className="badge" style={{ backgroundColor: '#0077b5', color: '#fff', textDecoration: 'none', padding: '6px 12px', fontSize: '0.8rem' }}>
                        💼 LinkedIn (@{parsedCandidate.linkedin_url})
                      </a>
                    ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No LinkedIn</span>}

                    {parsedCandidate.github_url ? (
                      <a href={parsedCandidate.github_url.startsWith('http') ? parsedCandidate.github_url : `https://github.com/${parsedCandidate.github_url}`} target="_blank" rel="noreferrer" className="badge" style={{ backgroundColor: '#24292e', color: '#fff', border: '1px solid #444', textDecoration: 'none', padding: '6px 12px', fontSize: '0.8rem' }}>
                        🐙 GitHub (@{parsedCandidate.github_url})
                      </a>
                    ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No GitHub</span>}

                    {parsedCandidate.leetcode_url ? (
                      <a href={parsedCandidate.leetcode_url.startsWith('http') ? parsedCandidate.leetcode_url : `https://leetcode.com/${parsedCandidate.leetcode_url}`} target="_blank" rel="noreferrer" className="badge" style={{ backgroundColor: '#f59e0b', color: '#000', fontWeight: 'bold', textDecoration: 'none', padding: '6px 12px', fontSize: '0.8rem' }}>
                        🧩 LeetCode (@{parsedCandidate.leetcode_url})
                      </a>
                    ) : null}

                    {parsedCandidate.hackerrank_url ? (
                      <a href={parsedCandidate.hackerrank_url.startsWith('http') ? parsedCandidate.hackerrank_url : `https://hackerrank.com/${parsedCandidate.hackerrank_url}`} target="_blank" rel="noreferrer" className="badge" style={{ backgroundColor: '#10b981', color: '#fff', textDecoration: 'none', padding: '6px 12px', fontSize: '0.8rem' }}>
                        🟢 HackerRank (@{parsedCandidate.hackerrank_url})
                      </a>
                    ) : null}
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>EXTRACTED SKILLS</label>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                    {parsedCandidate.skills.map((s, idx) => (
                      <span key={idx} className="badge badge-primary">{s}</span>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>EDUCATION DETAILS</label>
                  <div style={{ backgroundColor: 'var(--bg-main)', padding: '12px', borderRadius: '8px', marginTop: '6px', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
                    {parsedCandidate.education || "None detected"}
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>EXPERIENCE SUMMARY</label>
                  <div style={{ backgroundColor: 'var(--bg-main)', padding: '12px', borderRadius: '8px', marginTop: '6px', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
                    {parsedCandidate.experience || "None detected"}
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                      PROJECTS EXTRACTED (GITHUB &amp; LINKEDIN)
                    </label>
                    {parsedCandidate.projects && (
                      <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                        {parsedCandidate.projects.split(';').filter(p => p.trim()).length} Projects Found
                      </span>
                    )}
                  </div>
                  {parsedCandidate.projects ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                      {parsedCandidate.projects.split(';').map((p, idx) => {
                        const cleanP = p.trim();
                        if (!cleanP) return null;
                        const isGh = cleanP.startsWith('GitHub:');
                        return (
                          <div key={idx} style={{ backgroundColor: 'var(--bg-main)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', borderLeft: `3px solid ${isGh ? '#6e40c9' : '#0077b5'}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '1.1rem' }}>{isGh ? '🐙' : '💼'}</span>
                            <span style={{ color: 'var(--text-main)' }}>{cleanP}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ backgroundColor: 'var(--bg-main)', padding: '12px', borderRadius: '8px', marginTop: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      No projects detected yet. Click "Auto-Extract Projects &amp; Skills" or connect GitHub/LinkedIn to pull public repositories.
                    </div>
                  )}
                </div>

                {parsedCandidate.certifications && (
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>VERIFIED CREDENTIALS &amp; CERTIFICATIONS</label>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                      {parsedCandidate.certifications.split(';').map((c, idx) => {
                        const cleanC = c.trim();
                        if (!cleanC) return null;
                        return (
                          <span key={idx} className="badge badge-success" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                            ✓ {cleanC}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: MATCHING */}
        {currentTab === "matching" && (
          <div>
            <div className="page-header">
              <h2>Candidate-Job Matching</h2>
              <p>Calculate semantic scores, compare skill inventory, check gaps, and see justifications.</p>
            </div>

            <div className="form-card" style={{ maxWidth: '600px', margin: '0 auto 30px' }}>
              <form onSubmit={handleAnalyzeMatch}>
                <div className="form-group">
                  <label>Select Candidate Profile</label>
                  <select value={selectedCandidate} onChange={(e) => setSelectedCandidate(e.target.value)} required>
                    <option value="">-- Choose Candidate --</option>
                    {candidates.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} (#{c.id})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Select Job Position</label>
                  <select value={selectedJob} onChange={(e) => setSelectedJob(e.target.value)} required>
                    <option value="">-- Choose Job --</option>
                    {jobs.map((j) => (
                      <option key={j.id} value={j.id}>{j.job_title} (#{j.id})</option>
                    ))}
                  </select>
                </div>

                {renderWeightSliders()}

                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                  <button className="btn btn-primary" type="submit" disabled={matchingLoading}>
                    {matchingLoading ? "Calculating Embeddings..." : "Analyze Match"}
                  </button>
                </div>
              </form>

              {matchingLoading && <div className="spinner"></div>}
              {matchingError && <div style={{ color: 'var(--danger)', marginTop: '16px', textAlign: 'center' }}>{matchingError}</div>}
            </div>

            {matchingResult && (
              <div className="match-result-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                  Match Report
                </h3>
                
                <div className="score-rings">
                  <CircularProgress score={matchingResult.overall_score} label="Overall Match" color="var(--primary)" />
                  <CircularProgress score={matchingResult.semantic_score} label="Semantic Similarity" color="var(--secondary)" />
                  <CircularProgress score={matchingResult.skill_score} label="Skill Match" color="var(--warning)" />
                </div>
                <div style={{ marginBottom: '24px', backgroundColor: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontWeight: 'bold', marginBottom: '12px', fontSize: '0.95rem' }}>Baseline Benchmarking: Semantic AI vs Keyword Baseline</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                        <span>Semantic Similarity (Sentence Transformers AI)</span>
                        <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{matchingResult.semantic_score}%</span>
                      </div>
                      <div style={{ background: 'var(--bg-main)', height: '10px', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ background: 'linear-gradient(to right, var(--primary), #a5b4fc)', width: `${matchingResult.semantic_score}%`, height: '100%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                        <span>Exact Keyword Matching Baseline</span>
                        <span style={{ color: 'var(--text-muted)', fontWeight: 'bold' }}>{matchingResult.keyword_baseline_score}%</span>
                      </div>
                      <div style={{ background: 'var(--bg-main)', height: '10px', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ background: '#4b5563', width: `${matchingResult.keyword_baseline_score}%`, height: '100%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>


                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontWeight: 'bold', marginBottom: '8px' }}>Matching Skills</h4>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {matchingResult.matching_skills.length === 0 ? (
                      <span style={{ color: 'var(--text-muted)' }}>No overlapping skills found.</span>
                    ) : (
                      matchingResult.matching_skills.map((s, idx) => (
                        <span key={idx} className="badge badge-success">✓ {s}</span>
                      ))
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontWeight: 'bold', marginBottom: '8px' }}>Missing Skills (Gaps)</h4>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {matchingResult.missing_skills.length === 0 ? (
                      <span className="badge badge-success">No Skill Gaps! Candidate meets all skills requirements.</span>
                    ) : (
                      matchingResult.missing_skills.map((s, idx) => (
                        <span key={idx} className="badge badge-danger">✗ {s}</span>
                      ))
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontWeight: 'bold', marginBottom: '8px' }}>Experience Variance</h4>
                  <p>
                    Required: <strong>{matchingResult.required_experience_years} Years</strong> | Candidate has:{' '}
                    <strong>{matchingResult.candidate_experience_years} Years</strong> ({matchingResult.experience_match ? "Meets Requirement" : "Below Requirement"})
                  </p>
                </div>

                <div style={{ backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: '8px', borderLeft: '4px solid var(--success)' }}>
                  <h4 style={{ fontWeight: 'bold', marginBottom: '6px', color: 'var(--success)' }}>AI Match Explanation</h4>
                  <p style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>{matchingResult.explanation}</p>
                </div>

                {matchingResult.interview_questions && matchingResult.interview_questions.length > 0 && (
                  <div style={{ marginTop: '24px', backgroundColor: 'rgba(59, 130, 246, 0.03)', padding: '16px', borderRadius: '8px', borderLeft: '4px solid var(--secondary)', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                    <h4 style={{ fontWeight: 'bold', marginBottom: '10px', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                      AI-Generated Interview Questions (Gap-Targeted)
                    </h4>
                    <ul style={{ paddingLeft: '20px', fontSize: '0.9rem', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {matchingResult.interview_questions.map((q, idx) => (
                        <li key={idx} style={{ color: 'var(--text-main)' }}>{q}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div style={{ marginTop: '24px' }}>
                  <h4 style={{ fontWeight: 'bold', marginBottom: '12px' }}>Resume Text Semantic Highlights</h4>
                  <HighlightedResumeText 
                    text={candidates.find(c => c.id === parseInt(selectedCandidate))?.resume_text} 
                    matchingSkills={matchingResult.matching_skills} 
                    semanticKeywords={matchingResult.missing_skills} 
                  />
                  <div style={{ display: 'flex', gap: '16px', marginTop: '10px', fontSize: '0.8rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: 'rgba(16, 185, 129, 0.15)', borderBottom: '1.5px solid #10b981', borderRadius: '2px' }}></span>
                      Matching Skills (Green)
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: 'rgba(59, 130, 246, 0.15)', borderBottom: '1.5px solid #3b82f6', borderRadius: '2px' }}></span>
                      Required/Missing Skills (Blue)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: CANDIDATE COMPARER */}
        {currentTab === "comparer" && (
          <div>
            <div className="page-header">
              <h2>Candidate Comparer</h2>
              <p>Compare candidates side-by-side against any saved job or custom job description.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px', alignItems: 'start' }}>
              <div className="form-card">
                <form onSubmit={handleCompareCandidates}>
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label>Target Position Mode</label>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                      <button 
                        type="button" 
                        className={`btn ${!isCustomJob ? 'btn-primary' : 'btn-secondary'}`} 
                        onClick={() => setIsCustomJob(false)}
                        style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem' }}
                      >
                        Saved Position
                      </button>
                      <button 
                        type="button" 
                        className={`btn ${isCustomJob ? 'btn-primary' : 'btn-secondary'}`} 
                        onClick={() => setIsCustomJob(true)}
                        style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem' }}
                      >
                        Custom Job
                      </button>
                    </div>
                  </div>

                  {!isCustomJob ? (
                    <div className="form-group">
                      <label>Select Saved Job Position</label>
                      <select value={comparerJob} onChange={(e) => setComparerJob(e.target.value)} required={!isCustomJob}>
                        <option value="">-- Select Job --</option>
                        {jobs.map((j) => (
                          <option key={j.id} value={j.id}>{j.job_title} (#{j.id})</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <div className="form-group">
                        <label>Custom Job Title</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Senior Machine Learning Engineer" 
                          value={customJobTitle} 
                          onChange={(e) => setCustomJobTitle(e.target.value)} 
                          required={isCustomJob}
                        />
                      </div>
                      <div className="form-group">
                        <label>Required Experience (Years)</label>
                        <input 
                          type="number" 
                          min="0" 
                          value={customJobExp} 
                          onChange={(e) => setCustomJobExp(parseInt(e.target.value) || 0)} 
                        />
                      </div>
                      <div className="form-group">
                        <label>Required Skills (Comma-separated)</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Python, TensorFlow, SQL" 
                          value={customJobSkills} 
                          onChange={(e) => setCustomJobSkills(e.target.value)} 
                        />
                      </div>
                      <div className="form-group">
                        <label>Job Description</label>
                        <textarea 
                          rows="4" 
                          placeholder="Paste the full job description here..." 
                          value={customJobDesc} 
                          onChange={(e) => setCustomJobDesc(e.target.value)} 
                          required={isCustomJob}
                        />
                      </div>
                    </div>
                  )}

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ margin: 0 }}>Select Candidates to Compare</label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button 
                          type="button" 
                          className="btn btn-secondary" 
                          style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                          onClick={() => setSelectedComparerCandidates(candidates.map(c => c.id.toString()))}
                        >
                          Select All
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-secondary" 
                          style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                          onClick={() => setSelectedComparerCandidates([])}
                        >
                          Clear All
                        </button>
                      </div>
                    </div>

                    <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', backgroundColor: 'var(--bg-main)' }}>
                      {candidates.map((c) => {
                        const isChecked = selectedComparerCandidates.includes(c.id.toString());
                        return (
                          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0' }}>
                            <input 
                              type="checkbox" 
                              id={`comp-cand-${c.id}`} 
                              value={c.id} 
                              checked={isChecked}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (e.target.checked) {
                                  setSelectedComparerCandidates([...selectedComparerCandidates, val]);
                                } else {
                                  setSelectedComparerCandidates(selectedComparerCandidates.filter(id => id !== val));
                                }
                              }}
                            />
                            <label htmlFor={`comp-cand-${c.id}`} style={{ margin: 0, fontSize: '0.9rem', cursor: 'pointer' }}>
                              {c.name} (#{c.id})
                            </label>
                          </div>
                        );
                      })}
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                      Selected: {selectedComparerCandidates.length} candidate(s).
                    </p>
                  </div>

                  <button className="btn btn-primary" type="submit" disabled={comparisonLoading || selectedComparerCandidates.length === 0 || (!isCustomJob && !comparerJob)}>
                    {comparisonLoading ? "Comparing..." : "Compare Candidates"}
                  </button>
                </form>
                {comparisonError && <div style={{ color: 'var(--danger)', marginTop: '12px' }}>{comparisonError}</div>}
              </div>

              <div>
                {comparisonResults.length > 0 ? (
                  <div className="table-container">
                    <div className="table-header">
                      <h3>Side-by-Side Comparison Matrix</h3>
                    </div>
                    <table>
                      <thead>
                        <tr>
                          <th style={{ width: '180px' }}>Criteria</th>
                          {comparisonResults.map((r, idx) => (
                            <th key={idx}>Candidate {idx + 1}: {r.candidate_name}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><strong>Overall Suitability</strong></td>
                          {comparisonResults.map((r, idx) => (
                            <td key={idx}>
                              <span className="badge badge-primary" style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>{r.overall_score}%</span>
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td><strong>Semantic Similarity</strong></td>
                          {comparisonResults.map((r, idx) => (
                            <td key={idx} style={{ color: 'var(--success)', fontWeight: 'bold' }}>{r.semantic_score}%</td>
                          ))}
                        </tr>
                        <tr>
                          <td><strong>Keyword Baseline</strong></td>
                          {comparisonResults.map((r, idx) => (
                            <td key={idx} style={{ color: 'var(--text-muted)' }}>{r.keyword_baseline_score}%</td>
                          ))}
                        </tr>
                        <tr>
                          <td><strong>Experience Match</strong></td>
                          {comparisonResults.map((r, idx) => (
                            <td key={idx}>
                              <div><strong>{r.candidate_experience_years} Years</strong></div>
                              <div style={{ fontSize: '0.75rem', color: r.experience_match ? 'var(--success)' : 'var(--danger)' }}>
                                {r.experience_match ? "✓ Meets Req" : "✗ Below Req"}
                              </div>
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td><strong>Skills Match</strong></td>
                          {comparisonResults.map((r, idx) => (
                            <td key={idx}>
                              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
                                {r.matching_skills.map((sk, sidx) => (
                                  <span key={sidx} className="badge badge-success" style={{ fontSize: '0.7rem' }}>{sk}</span>
                                ))}
                              </div>
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td><strong>Skills Missing (Gaps)</strong></td>
                          {comparisonResults.map((r, idx) => (
                            <td key={idx}>
                              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                {r.missing_skills.length === 0 ? (
                                  <span style={{ fontSize: '0.8rem', color: 'var(--success)' }}>No gaps</span>
                                ) : (
                                  r.missing_skills.map((sk, sidx) => (
                                    <span key={sidx} className="badge badge-danger" style={{ fontSize: '0.7rem' }}>{sk}</span>
                                  ))
                                )}
                              </div>
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td><strong>AI Match Explanation</strong></td>
                          {comparisonResults.map((r, idx) => (
                            <td key={idx} style={{ fontSize: '0.8rem', lineHeight: '1.4', color: 'var(--text-muted)' }}>
                              {r.explanation}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ padding: '40px', textAlign: 'center', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'var(--text-muted)', backgroundColor: 'var(--bg-card)' }}>
                    Select a position and choose candidates on the left to display the comparative matrix.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB: BATCH EVALUATION */}
        {currentTab === "batch" && (
          <div>
            <div className="page-header">
              <h2>Batch Evaluation System</h2>
              <p>Extract, parse, and evaluate 100 candidate resumes in a single batch against active job criteria.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px', alignItems: 'start' }}>
              <div className="form-card">
                <form onSubmit={handleRunBatchEvaluation}>
                  <div className="form-group">
                    <label>Select Target Position</label>
                    <select value={batchJobId} onChange={(e) => setBatchJobId(e.target.value)} required>
                      <option value="">-- Select Job --</option>
                      {jobs.map((j) => (
                        <option key={j.id} value={j.id}>{j.job_title} (#{j.id})</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ padding: '16px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '10px', marginBottom: '20px' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '8px' }}>Test Batch Setup</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                      Locates <strong>100 resumes</strong> from the Kaggle Resume Dataset across 10 diverse categories (Information Technology, HR, Finance, Advocate, Accountant, Chef, and more).
                    </p>
                  </div>

                  {renderWeightSliders()}

                  <button className="btn btn-primary" type="submit" style={{ width: '100%' }} disabled={batchLoading || !batchJobId}>
                    {batchLoading ? "Processing Batch..." : "Process Resumes (100 Files)"}
                  </button>
                </form>

                {batchError && <div style={{ color: 'var(--danger)', marginTop: '12px' }}>{batchError}</div>}

                {batchLoading && (
                  <div style={{ marginTop: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px' }}>
                      <span>Extracting and Evaluating Resumes...</span>
                      <strong>{batchProgress}%</strong>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${batchProgress}%`, height: '100%', backgroundColor: 'var(--primary)', transition: 'width 0.2s ease-out' }}></div>
                    </div>
                    <div className="spinner" style={{ marginTop: '16px' }}></div>
                  </div>
                )}
              </div>

              <div>
                {batchResult ? (
                  <div>
                    {/* Summary Cards */}
                    <div className="dashboard-grid" style={{ marginBottom: '24px' }}>
                      <div className="card-stat">
                        <div className="stat-icon">📄</div>
                        <div className="stat-info">
                          <h3>Total Resumes</h3>
                          <p>{batchResult.summary.total_resumes}</p>
                        </div>
                      </div>
                      <div className="card-stat">
                        <div className="stat-icon" style={{ color: 'var(--primary)' }}>✓</div>
                        <div className="stat-info">
                          <h3>Processed</h3>
                          <p>{batchResult.summary.processed_count}</p>
                        </div>
                      </div>
                      <div className="card-stat">
                        <div className="stat-icon" style={{ color: 'var(--danger)' }}>✗</div>
                        <div className="stat-info">
                          <h3>Failed</h3>
                          <p>{batchResult.summary.failed_count}</p>
                        </div>
                      </div>
                      <div className="card-stat">
                        <div className="stat-icon green">⚡</div>
                        <div className="stat-info">
                          <h3>Avg Match</h3>
                          <p>{batchResult.summary.avg_final_score}%</p>
                        </div>
                      </div>
                    </div>


                    {/* Rankings Table */}
                    <div className="table-container" id="batch-ranking-print">
                      <div className="table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3>Ranked Candidates</h3>
                        <button
                          className="btn-primary"
                          style={{ fontSize: '0.8rem', padding: '7px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                          onClick={() => window.print()}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                          Export PDF / Print
                        </button>
                      </div>
                      <div style={{ maxHeight: '450px', overflowY: 'auto' }}>
                        <table>
                          <thead>
                            <tr>
                              <th>Rank</th>
                              <th>Name</th>
                              <th>Match Score</th>
                              <th>Experience</th>
                              <th>Education</th>
                              <th>Skill Coverage</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {batchResult.rankings.map((r) => (
                              <React.Fragment key={r.candidate_id}>
                                <tr>
                                  <td><strong>#{r.rank}</strong></td>
                                  <td>
                                    <strong>{r.candidate_name}</strong>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {r.candidate_id}</div>
                                  </td>
                                  <td>
                                    <span className="badge badge-primary" style={{ fontSize: '0.85rem' }}>{r.overall_score}%</span>
                                  </td>
                                  <td>{r.candidate_experience_years} Years</td>
                                  <td>{r.education_score}%</td>
                                  <td>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 'bold' }}>
                                      {r.matching_skills.length} / {r.matching_skills.length + r.missing_skills.length}
                                    </span>
                                  </td>
                                  <td>
                                    <button 
                                      type="button"
                                      className="btn btn-secondary" 
                                      style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                      onClick={() => setBatchActiveDetails(batchActiveDetails === r.candidate_id ? null : r.candidate_id)}
                                    >
                                      {batchActiveDetails === r.candidate_id ? "Hide" : "Explain"}
                                    </button>
                                  </td>
                                </tr>
                                {batchActiveDetails === r.candidate_id && (
                                  <tr>
                                    <td colSpan="7" style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '16px 24px' }}>
                                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '16px' }}>
                                        <div>
                                          <h5 style={{ fontWeight: 'bold', color: 'var(--primary)', marginBottom: '6px', fontSize: '0.8rem', textTransform: 'uppercase' }}>Matching Skills</h5>
                                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                            {r.matching_skills.map((s, idx) => <span key={idx} className="badge badge-success">{s}</span>)}
                                          </div>
                                        </div>
                                        <div>
                                          <h5 style={{ fontWeight: 'bold', color: 'var(--danger)', marginBottom: '6px', fontSize: '0.8rem', textTransform: 'uppercase' }}>Missing Skills (Gaps)</h5>
                                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                            {r.missing_skills.length === 0 ? <span className="badge badge-success">No Gaps</span> : r.missing_skills.map((s, idx) => <span key={idx} className="badge badge-danger">{s}</span>)}
                                          </div>
                                        </div>
                                      </div>
                                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                                        <h5 style={{ fontWeight: 'bold', marginBottom: '6px', fontSize: '0.8rem', textTransform: 'uppercase' }}>AI Rationale</h5>
                                        <p style={{ fontSize: '0.85rem', lineHeight: '1.5', color: 'var(--text-muted)' }}>{r.explanation}</p>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '60px', textAlign: 'center', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'var(--text-muted)', backgroundColor: 'var(--bg-card)' }}>
                    Select a target position on the left and run the evaluation batch to process and rank candidates.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: SYNTHETIC MODEL LAB */}
        {currentTab === "lab" && (
          <div>
            <div className="page-header">
              <h2>Synthetic Model Lab</h2>
              <p>Evaluate pipeline limits and audit decisions against demographic biases.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
              <div>
                <div className="form-card">
                  <h3 style={{ marginBottom: '16px' }}>Data Generation & Model Training</h3>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <button className="btn btn-success" onClick={handleGenerateSynthetic} disabled={labGenerating}>
                      {labGenerating ? "Synthesizing..." : "Generate 500+ Candidates"}
                    </button>
                    <button className="btn btn-primary" onClick={handleTrainModel} disabled={labTraining}>
                      {labTraining ? "Training classifier..." : "Train Classifier Model"}
                    </button>
                  </div>

                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Status: <strong style={{ color: 'var(--text-main)' }}>{labStatus}</strong>
                  </p>

                  {labMetrics && (
                    <div style={{ marginTop: '24px' }}>
                      <h4 style={{ fontWeight: 'bold' }}>Model Performance Metrics (Random Forest)</h4>
                      <div className="ml-metrics-grid">
                        <div className="ml-metric-card">
                          <div className="ml-metric-val">{Math.round(labMetrics.accuracy * 100)}%</div>
                          <div className="ml-metric-lbl">Accuracy</div>
                        </div>
                        <div className="ml-metric-card">
                          <div className="ml-metric-val">{Math.round(labMetrics.precision * 100)}%</div>
                          <div className="ml-metric-lbl">Precision</div>
                        </div>
                        <div className="ml-metric-card">
                          <div className="ml-metric-val">{Math.round(labMetrics.recall * 100)}%</div>
                          <div className="ml-metric-lbl">Recall</div>
                        </div>
                        <div className="ml-metric-card">
                          <div className="ml-metric-val">{Math.round(labMetrics.f1_score * 100)}%</div>
                          <div className="ml-metric-lbl">F1 Score</div>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '12px' }}>
                        Evaluated on a separate validation test partition (300 pairs) to avoid data leakage.
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="form-card">
                  <h3 style={{ marginBottom: '16px' }}>Demographic Bias Validation (Fairness Audit)</h3>
                  <button className="btn btn-primary" onClick={handleRunFairness} disabled={labFairnessTesting} style={{ marginBottom: '20px' }}>
                    {labFairnessTesting ? "Auditing pipeline..." : "Run Fairness Audit"}
                  </button>

                  {labFairnessResult && (
                    <div>
                      <div className="alert-notice" style={{ borderColor: labFairnessResult.status === 'passed' ? 'var(--success)' : 'var(--danger)', backgroundColor: 'rgba(16, 185, 129, 0.05)' }}>
                        <h4 style={{ fontWeight: 'bold', color: 'var(--success)' }}>
                          Status: {labFairnessResult.status.toUpperCase()}
                        </h4>
                        <p style={{ fontSize: '0.85rem' }}>{labFairnessResult.description}</p>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                        <div style={{ backgroundColor: 'var(--bg-main)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                          <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--success)' }}>{labFairnessResult.gender_variance}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Gender Score Variance</p>
                        </div>
                        <div style={{ backgroundColor: 'var(--bg-main)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                          <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--success)' }}>{labFairnessResult.race_variance}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Race Score Variance</p>
                        </div>
                      </div>

                      <h4 style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '0.9rem' }}>Gender Audit Log</h4>
                      <ul style={{ listStyle: 'none', paddingLeft: '0', fontSize: '0.85rem', marginBottom: '16px' }}>
                        {labFairnessResult.gender_audit_details.map((gd, idx) => (
                          <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>
                            <span>Gender: <strong>{gd.gender}</strong></span>
                            <span>Score: <strong>{gd.overall_score}%</strong></span>
                          </li>
                        ))}
                      </ul>

                      <h4 style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '0.9rem' }}>Race Audit Log</h4>
                      <ul style={{ listStyle: 'none', paddingLeft: '0', fontSize: '0.85rem' }}>
                        {labFairnessResult.race_audit_details.map((rd, idx) => (
                          <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>
                            <span>Race/Ethnicity: <strong>{rd.race}</strong></span>
                            <span>Score: <strong>{rd.overall_score}%</strong></span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="form-card" style={{ marginTop: '30px' }}>
              <h3 style={{ marginBottom: '16px' }}>Keyword Baseline vs. Semantic AI Benchmark</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
                Run side-by-side performance benchmarks and error analysis evaluations comparing our Semantic Transformers AI pipeline against an exact Keyword Baseline.
              </p>
              
              <button className="btn btn-primary" onClick={handleRunBenchmark} disabled={labBenchmarking} style={{ marginBottom: '24px' }}>
                {labBenchmarking ? "Running Benchmark Analysis..." : "Execute Comparative Benchmark & Error Analysis"}
              </button>

              {labBenchmark && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px' }}>
                  <div className="table-container" style={{ margin: 0 }}>
                    <div className="table-header">
                      <h4>Model Performance Comparison</h4>
                    </div>
                    <table>
                      <thead>
                        <tr>
                          <th>Metric</th>
                          <th style={{ color: 'var(--primary)' }}>Semantic AI Model</th>
                          <th>Keyword Baseline</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><strong>Accuracy</strong></td>
                          <td style={{ color: 'var(--success)', fontWeight: 'bold' }}>{Math.round(labBenchmark.semantic_matching.accuracy * 100)}%</td>
                          <td>{Math.round(labBenchmark.keyword_baseline.accuracy * 100)}%</td>
                        </tr>
                        <tr>
                          <td><strong>Precision</strong></td>
                          <td style={{ color: 'var(--success)', fontWeight: 'bold' }}>{Math.round(labBenchmark.semantic_matching.precision * 100)}%</td>
                          <td>{Math.round(labBenchmark.keyword_baseline.precision * 100)}%</td>
                        </tr>
                        <tr>
                          <td><strong>Recall</strong></td>
                          <td style={{ color: 'var(--success)', fontWeight: 'bold' }}>{Math.round(labBenchmark.semantic_matching.recall * 100)}%</td>
                          <td>{Math.round(labBenchmark.keyword_baseline.recall * 100)}%</td>
                        </tr>
                        <tr>
                          <td><strong>F1 Score</strong></td>
                          <td style={{ color: 'var(--success)', fontWeight: 'bold' }}>{Math.round(labBenchmark.semantic_matching.f1_score * 100)}%</td>
                          <td>{Math.round(labBenchmark.keyword_baseline.f1_score * 100)}%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="match-result-card" style={{ padding: '20px', borderRadius: '12px' }}>
                    <h4 style={{ fontWeight: 'bold', marginBottom: '12px' }}>Quantitative Error Analysis</h4>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                      <div style={{ backgroundColor: 'var(--bg-main)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                        <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--danger)' }}>
                          {labBenchmark.error_analysis.keyword_false_negatives}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Keyword False Negatives</p>
                      </div>
                      <div style={{ backgroundColor: 'var(--bg-main)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                        <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--success)' }}>
                          {labBenchmark.error_analysis.semantic_false_negatives}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Semantic False Negatives</p>
                      </div>
                    </div>

                    <div style={{ backgroundColor: 'var(--bg-main)', padding: '12px', borderRadius: '8px', borderLeft: '4px solid var(--primary)' }}>
                      <h5 style={{ fontWeight: 'bold', color: 'var(--primary)', marginBottom: '4px', fontSize: '0.85rem' }}>Error Analysis Insight</h5>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                        {labBenchmark.error_analysis.insights}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: SKILL TAXONOMY / SYNONYM MAPPER */}
        {currentTab === "settings" && (() => {
          const loadSynonyms = async () => {
            setSynonymLoading(true);
            try {
              const res = await axios.get("http://127.0.0.1:8000/api/matching/synonyms");
              setSynonyms(res.data);
            } catch(e) {
              console.error(e);
            }
            setSynonymLoading(false);
          };
          const saveSynonym = async (e) => {
            e.preventDefault();
            if (!synSkill.trim() || !synSynonym.trim()) return;
            setSynSaving(true);
            try {
              await axios.post("http://127.0.0.1:8000/api/matching/synonyms", {
                skill: synSkill.trim(),
                synonym: synSynonym.trim(),
                equivalence_ratio: parseFloat(synRatio)
              });
              setSynMsg("✅ Synonym saved!");
              setSynSkill(""); setSynSynonym(""); setSynRatio(0.8);
              loadSynonyms();
              setTimeout(() => setSynMsg(""), 3000);
            } catch(e) {
              setSynMsg("❌ Failed to save synonym.");
            }
            setSynSaving(false);
          };
          const deleteSynonym = async (id) => {
            try {
              await axios.delete(`http://127.0.0.1:8000/api/matching/synonyms/${id}`);
              loadSynonyms();
            } catch(e) {}
          };
          if (!synonymLoading && synonyms.length === 0) loadSynonyms();
          return (
            <div>
              <div className="page-header">
                <h2>Skill Taxonomy Manager</h2>
                <p>Map equivalent skills so the matching engine gives fractional credit for related competencies (e.g. treat Svelte as 80% equivalent to React).</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px', alignItems: 'start' }}>
                <div className="form-card">
                  <h3 style={{ fontWeight: 'bold', marginBottom: '20px' }}>Add Skill Synonym</h3>
                  <form onSubmit={saveSynonym}>
                    <div className="form-group">
                      <label>Primary Skill (Job Requirement)</label>
                      <input type="text" placeholder="e.g. React" value={synSkill} onChange={e => setSynSkill(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label>Equivalent Skill (Candidate May Have)</label>
                      <input type="text" placeholder="e.g. Svelte" value={synSynonym} onChange={e => setSynSynonym(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label>Equivalence Ratio: <strong style={{ color: 'var(--primary)' }}>{Math.round(synRatio * 100)}%</strong></label>
                      <input type="range" min="0.1" max="1.0" step="0.05" value={synRatio} onChange={e => setSynRatio(parseFloat(e.target.value))} style={{ width: '100%', cursor: 'pointer' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        <span>10% (loosely related)</span><span>100% (full equivalent)</span>
                      </div>
                    </div>
                    {synMsg && <div style={{ padding: '10px', borderRadius: '6px', backgroundColor: 'rgba(16,185,129,0.1)', fontSize: '0.85rem', marginBottom: '12px' }}>{synMsg}</div>}
                    <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={synSaving}>
                      {synSaving ? "Saving..." : "Save Synonym Mapping"}
                    </button>
                  </form>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h3 style={{ fontWeight: 'bold' }}>Active Synonym Mappings</h3>
                    <button onClick={loadSynonyms} className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>↺ Refresh</button>
                  </div>
                  {synonymLoading ? (
                    <div className="spinner"></div>
                  ) : synonyms.length === 0 ? (
                    <div className="form-card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px' }}>
                      No synonym mappings configured yet. Add the first one on the left.
                    </div>
                  ) : (
                    <div className="table-container">
                      <table>
                        <thead>
                          <tr>
                            <th>Primary Skill</th>
                            <th>Equivalent Skill</th>
                            <th>Credit %</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {synonyms.map(s => (
                            <tr key={s.id}>
                              <td><span className="badge badge-primary">{s.skill}</span></td>
                              <td><span className="badge badge-success">{s.synonym}</span></td>
                              <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{Math.round(s.equivalence_ratio * 100)}%</td>
                              <td>
                                <button onClick={() => deleteSynonym(s.id)} style={{ background: 'none', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>✕ Remove</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div className="form-card" style={{ marginTop: '24px', borderLeft: '4px solid var(--secondary)' }}>
                    <h4 style={{ fontWeight: 'bold', color: 'var(--secondary)', marginBottom: '8px' }}>How Synonyms Work</h4>
                    <p style={{ fontSize: '0.85rem', lineHeight: '1.6', color: 'var(--text-muted)' }}>
                      When a job requires <strong>React</strong> but the candidate only lists <strong>Svelte</strong> (mapped at 80%), 
                      the matching engine awards <strong>0.8 × skill weight</strong> rather than 0, improving the candidate's score 
                      proportionally. Bidirectional checking is supported — both "job skill → candidate skill" and reverse.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── Profile Verifier Tab ── */}
        {currentTab === "verifier" && (() => {
          const runVerification = async () => {
            if (!verifyCandidateId) return;
            setVerifying(true);
            setVerifyError("");
            setVerificationResult(null);
            try {
              const res = await axios.get(`${API_BASE}/verification/${verifyCandidateId}`);
              setVerificationResult(res.data);
            } catch (e) {
              setVerifyError(e?.response?.data?.detail || "Verification failed. Make sure the backend is running.");
            } finally {
              setVerifying(false);
            }
          };

          const PlatformCard = ({ data, icon, color }) => {
            if (!data) return null;
            const verified = data.verified;
            const status = data.status;
            const isNotInResume = status === "not_found_in_resume";
            return (
              <div style={{ background: 'var(--bg-card)', border: `1px solid ${verified ? color : 'var(--border-color)'}`, borderRadius: '12px', padding: '20px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, right: 0, width: '120px', height: '120px', background: verified ? `${color}08` : 'transparent', borderRadius: '0 12px 0 100%' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.4rem' }}>{icon}</span>
                    <div>
                      <h4 style={{ fontWeight: 'bold', color: 'var(--text-main)', fontSize: '0.95rem' }}>{data.platform}</h4>
                      {data.handle && <code style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{data.handle}</code>}
                    </div>
                  </div>
                  <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.3px',
                    background: verified ? `${color}18` : isNotInResume ? 'rgba(100,116,139,0.12)' : 'rgba(239,68,68,0.1)',
                    color: verified ? color : isNotInResume ? 'var(--text-muted)' : '#ef4444', border: `1px solid ${verified ? color : isNotInResume ? 'var(--border-color)' : '#ef4444'}40`
                  }}>
                    {verified ? '✓ Verified' : isNotInResume ? 'Not Detected' : status === 'not_found' ? 'Not Found' : 'Unverifiable'}
                  </span>
                </div>

                {/* Platform-specific stats */}
                {data.platform === 'GitHub' && verified && (
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.3rem', fontWeight: '800', color }}>{data.repos_count}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Public Repos</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.3rem', fontWeight: '800', color }}>{data.followers}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Followers</div>
                    </div>
                    {data.matched_projects?.length > 0 && (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#10b981' }}>{data.matched_projects.length}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Projects Matched</div>
                      </div>
                    )}
                  </div>
                )}

                {data.platform === 'LeetCode' && verified && (
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.3rem', fontWeight: '800', color }}>{data.problems_solved}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total Solved</div>
                    </div>
                    {data.easy_solved !== undefined && (
                      <>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#10b981' }}>{data.easy_solved}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Easy</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f59e0b' }}>{data.medium_solved}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Medium</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#ef4444' }}>{data.hard_solved}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Hard</div>
                        </div>
                      </>
                    )}
                    {data.contest_rating && (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: '700', color }}>{data.contest_rating}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Contest Rating</div>
                      </div>
                    )}
                  </div>
                )}

                {data.platform === 'HackerRank' && verified && data.badges?.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Public Badges</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {data.badges.slice(0, 6).map((b, i) => (
                        <span key={i} style={{ padding: '3px 8px', background: `${color}15`, color, border: `1px solid ${color}30`, borderRadius: '12px', fontSize: '0.72rem', fontWeight: '600' }}>{b}</span>
                      ))}
                      {data.badges.length > 6 && <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>+{data.badges.length - 6} more</span>}
                    </div>
                  </div>
                )}

                {/* Remark */}
                <p style={{ fontSize: '0.82rem', lineHeight: '1.6', color: 'var(--text-muted)', margin: 0, borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                  {data.remark}
                </p>
              </div>
            );
          };

          const summary = verificationResult?.summary;

          return (
            <div className="main-content">
              <div className="page-header">
                <div>
                  <h2>Profile Verifier</h2>
                  <p>Section 5.9 — Professional Profile &amp; Credential Verification. Resolves GitHub, LeetCode, HackerRank, and LinkedIn handles from resume text and cross-checks claimed projects and certifications against public platform data.</p>
                </div>
              </div>

              <div className="content-grid" style={{ gridTemplateColumns: '320px 1fr', gap: '24px' }}>
                {/* Left: Control Panel */}
                <div>
                  <div className="form-card">
                    <h3 style={{ fontWeight: 'bold', marginBottom: '16px', color: 'var(--text-main)' }}>Run Verification</h3>
                    <div className="form-group">
                      <label>Select Candidate</label>
                      <select value={verifyCandidateId} onChange={e => setVerifyCandidateId(e.target.value)}>
                        <option value="">-- Select Candidate --</option>
                        {candidates.map(c => (
                          <option key={c.id} value={c.id}>{c.name} (#{c.id})</option>
                        ))}
                      </select>
                    </div>
                    <button
                      className="btn btn-primary"
                      style={{ width: '100%', marginTop: '8px' }}
                      onClick={runVerification}
                      disabled={verifying || !verifyCandidateId}
                    >
                      {verifying ? "Verifying Profiles..." : "Verify Professional Profiles"}
                    </button>
                    {verifyError && <div style={{ color: '#ef4444', fontSize: '0.82rem', marginTop: '10px' }}>{verifyError}</div>}
                  </div>

                  <div className="form-card" style={{ marginTop: '16px', borderLeft: '4px solid var(--secondary)' }}>
                    <h4 style={{ fontWeight: 'bold', color: 'var(--secondary)', marginBottom: '8px', fontSize: '0.85rem' }}>What This Checks</h4>
                    <ul style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.8', paddingLeft: '16px', margin: 0 }}>
                      <li><strong style={{ color: 'var(--text-main)' }}>GitHub</strong> — Profile exists, repo count, activity, project name matches</li>
                      <li><strong style={{ color: 'var(--text-main)' }}>LeetCode</strong> — Profile exists, problems solved, contest rating</li>
                      <li><strong style={{ color: 'var(--text-main)' }}>HackerRank</strong> — Profile exists, badges earned, certificate cross-check</li>
                      <li><strong style={{ color: 'var(--text-main)' }}>LinkedIn</strong> — URL reachability (content blocked by LinkedIn)</li>
                    </ul>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '10px', fontStyle: 'italic' }}>
                      Verification degrades gracefully — unreachable profiles are reported as "Unable to verify", never penalized.
                    </p>
                  </div>

                  {summary && (
                    <div className="form-card" style={{ marginTop: '16px' }}>
                      <h4 style={{ fontWeight: 'bold', marginBottom: '12px', fontSize: '0.85rem' }}>Verification Summary</h4>
                      <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                        <div style={{ fontSize: '2rem', fontWeight: '900', color: summary.overall_status === 'Strong' ? '#10b981' : summary.overall_status === 'Moderate' ? '#f59e0b' : summary.overall_status === 'Limited' ? '#3b82f6' : '#ef4444' }}>
                          {summary.overall_status}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Verification Strength</div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#10b981' }}>{summary.platforms_verified}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Verified</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-muted)' }}>{summary.platforms_failed}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Unverified</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--primary)' }}>{summary.platforms_checked}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Checked</div>
                        </div>
                      </div>
                      {verificationResult?.handles_found && (
                        <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Handles Detected</div>
                          {Object.entries(verificationResult.handles_found).map(([platform, handle]) => (
                            <div key={platform} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', padding: '3px 0' }}>
                              <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>{platform}</span>
                              <span style={{ color: handle ? 'var(--primary)' : '#6b7280', fontFamily: 'monospace' }}>{handle || 'Not found'}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: Platform Cards */}
                <div>
                  {!verificationResult && !verifying && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', color: 'var(--text-muted)', textAlign: 'center' }}>
                      <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px', opacity: 0.3 }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                      <p style={{ fontSize: '0.9rem' }}>Select a candidate and click <strong>"Verify Professional Profiles"</strong> to run the verification engine.</p>
                      <p style={{ fontSize: '0.8rem', marginTop: '8px' }}>GitHub, LeetCode, HackerRank, and LinkedIn handles will be automatically extracted from the resume text.</p>
                    </div>
                  )}

                  {verifying && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', gap: '16px' }}>
                      <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--border-color)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Contacting platform APIs... (up to 6s per platform)</p>
                    </div>
                  )}

                  {verificationResult && !verifying && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <PlatformCard data={verificationResult.github}     icon="🐙" color="#6e40c9" />
                      <PlatformCard data={verificationResult.leetcode}   icon="🧩" color="#f59e0b" />
                      <PlatformCard data={verificationResult.hackerrank} icon="🟢" color="#10b981" />
                      <PlatformCard data={verificationResult.linkedin}   icon="💼" color="#0077b5" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

      </main>
    </div>
  );
}
