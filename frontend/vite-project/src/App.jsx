import { useState } from 'react';
import { Upload, LoaderCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

export default function ResumeAnalyzer() {
  const [jobDescription, setJobDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [analysisResult, setAnalysisResult] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState('');
  const [downloadMessage, setDownloadMessage] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [skills, setSkills] = useState('');
  const [experience, setExperience] = useState('');
  const [matchScore, setMatchScore] = useState('');
  const [isUploading, setIsUploading] = useState(false);  // Track uploading state
  const [isAnalyzing, setIsAnalyzing] = useState(false);  // Track analyzing state
  const [tailoredResume, setTailoredResume] = useState('');

  // Upload the resume file
  const handleUpload = async () => {
    if (!resumeFile) {
      alert('Please select a resume file first.');
      return;
    }

    setIsUploading(true); // Start loading
    const formData = new FormData();
    formData.append('file', resumeFile);

    try {
      const res = await axios.post('/api/resumes/upload', formData);
      if (res.data.url) {
        setUploadedFileUrl(res.data.url);
        alert('File uploaded successfully!');
      } else {
        alert('File upload failed.');
      }
    } catch (error) {
      console.error(error);
      alert('Upload failed');
    } finally {
      setIsUploading(false); // Stop loading
    }
  };

  // Download the resume file from Cloudinary
  const handleDownload = async () => {
    if (isDownloading) {
      alert('Download is already in progress. Please wait.');
      return;
    }

    if (!uploadedFileUrl) {
      alert('Please upload a resume file first.');
      return;
    }

    setIsDownloading(true);
    setDownloadMessage('Downloading file...');

    try {
      const res = await axios.post('/api/resumes/download', {
        fileUrl: uploadedFileUrl
      });

      // Handle download success
      if (res.data.filePath) {
        setDownloadMessage(`File downloaded successfully to: ${res.data.filePath}`);
        handleParse(res.data.filePath); // Proceed to parsing once the file is downloaded
      } else {
        setDownloadMessage('Failed to download the file.');
      }
    } catch (error) {
      console.error(error);
      setDownloadMessage('Error downloading the file.', error.message);
    } finally {
      setIsDownloading(false);
    }
  };

  // Parse the resume (extract skills and experience)
  const handleParse = async (filePath) => {
    try {
      const res = await axios.post('/api/resumes/parse', {
        filePath: filePath
      });

      if (res.data.skills && res.data.experience) {
        setSkills(res.data.skills);
        setExperience(res.data.experience);
      } else {
        alert('Error parsing the resume');
      }
    } catch (error) {
      console.error(error);
      alert('Failed to parse resume');
    }
  };

  // Analyze the resume (compare skills, experience to job description and requirements)
  const handleAnalyze = async () => {
    if (!jobDescription || !requirements) {
      alert('Please provide both the job description and requirements.');
      return;
    }

    if (!skills || !experience) {
      alert('Please make sure the resume is parsed and skills and experience are extracted.');
      return;
    }

    setIsAnalyzing(true); // Start loading

    try {
      const res = await axios.post('/api/resumes/analyze', {
        JobDescription: jobDescription,
        Requirements: requirements,
        skills: skills,
        experience: experience,
      });

      if (res.data.success) {
        setMatchScore(res.data.matchScore);
        setAnalysisResult(res.data.analysis);
      } else {
        alert('Analysis failed');
      }
    } catch (error) {
      console.error(error);
      alert('Failed to analyze resume');
    } finally {
      setIsAnalyzing(false); // Stop loading
    }
  };

  const handleTailorResume = async () => {
    if (!skills || !experience || !jobDescription || !requirements) {
      alert("Please ensure all resume data and job details are provided.");
      return;
    }
  
    try {
      const res = await axios.post('/api/resumes/update', {
        skills,
        experience,
        JobDescription: jobDescription,
        Requirements: requirements,
        analysis: analysisResult,
      });
  
      if (res.data.tailoredResume) {
        setTailoredResume(res.data.tailoredResume);
      } else {
        alert("Failed to tailor resume.");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred while tailoring the resume.");
    }
  };

  return (
  <>
  <div className="min-h-screen bg-[linear-gradient(45deg,_#ccfbf1,_#ffffff)] px-6 py-10">
    {/* Header */}
    <motion.div
      className="text-black rounded-lg p-8 max-w-xl mx-auto "
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <h2 className="text-3xl text-left font-semibold">Resume Screener</h2>
    </motion.div>

    {/* Main Form Container */}
    <div className="bg-white rounded-xl p-6 space-y-4 w-full max-w-4xl mx-auto shadow">
      {/* Job Description & Requirements */}
      <div className="flex flex-col gap-4">
        <textarea
          className="w-full border bg-white rounded p-2"
          rows={5}
          placeholder="Enter Job Description..."
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
        />

        <textarea
          className="w-full border bg-white rounded p-2"
          rows={5}
          placeholder="Enter Requirements..."
          value={requirements}
          onChange={(e) => setRequirements(e.target.value)}
        />
      </div>

      {/* File Upload Section */}
      <div className="flex items-center gap-4">
        <input
          type="file"
          onChange={(e) => setResumeFile(e.target.files[0])}
          accept=".pdf,.docx"
        />
        <button
          onClick={handleUpload}
          className="flex items-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60"
          disabled={isUploading}
        >
          {isUploading ? (
            <LoaderCircle className="h-5 w-5 animate-spin mr-2" />
          ) : (
            <Upload className="mr-2" />
          )}
          {isUploading ? 'Uploading...' : 'Upload Resume'}
        </button>
      </div>

      {/* Uploaded File Display */}
      {uploadedFileUrl && (
        <div className="mt-2 text-gray-700">
          <strong>Uploaded Resume:</strong> {uploadedFileUrl.split('/').pop()}
        </div>
      )}

      {/* Download Resume Button */}
      <button
        onClick={handleDownload}
        className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 w-full mt-4 flex justify-center items-center disabled:opacity-60"
        disabled={isDownloading}
      >
        {isDownloading && <LoaderCircle className="h-5 w-5 animate-spin mr-2" />}
        {isDownloading ? 'Downloading...' : 'Download Resume'}
      </button>

      {/* Download Message */}
      {downloadMessage && (
        <div className="mt-4 text-gray-700">
          <strong>{downloadMessage}</strong>
        </div>
      )}

      {/* Analyze Resume Button */}
      <button
        onClick={handleAnalyze}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full mt-4"
        disabled={isAnalyzing}
      >
        {isAnalyzing ? 'Analyzing...' : 'Analyze Resume'}
      </button>

      {/* Analysis Result */}
      <div className="mt-4">
        {isAnalyzing ? (
          <div className="animate-pulse text-gray-500">Analyzing...</div>
        ) : (
          analysisResult && (
            <div className="transition-all opacity-100 duration-500">
              <h4 className="font-bold mb-2">{matchScore}</h4>
              <p>{analysisResult}</p>
            </div>
          )
        )}
      </div>

      {/* Tailor Resume Button */}
      

      {/* Tailored Resume Output */}
      {tailoredResume && (
        <div className="bg-white p-4 rounded shadow mt-4 whitespace-pre-wrap">
          <h4 className="font-bold mb-2">Tailored Resume</h4>
          <p>{tailoredResume}</p>
        </div>
      )}
    </div>
  </div>
</>


);
}
