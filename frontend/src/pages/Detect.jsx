import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import pngIcon from '../assets/png-file-.png';
import jpgIcon from '../assets/jpg.png';

const Detect = () => {
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1 State: Image Upload
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  // Step 2 State: Pet Information
  const [petInfo, setPetInfo] = useState({
    

  });
  const [petInfoError, setPetInfoError] = useState('');

  // Dynamic Sequential Question State
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [diseaseCandidates, setDiseaseCandidates] = useState([]);
  const [currentCandidateIndex, setCurrentCandidateIndex] = useState(0);
  const [candidateAnswers, setCandidateAnswers] = useState({});
  const [allCareGuidelines, setAllCareGuidelines] = useState({});
  const [confirmedPrediction, setConfirmedPrediction] = useState(null);

  const navigate = useNavigate();

  // File Handlers
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    validateAndSetFile(file);
  };

  const validateAndSetFile = (file) => {
    setUploadError('');
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Invalid file format. Please upload a JPG or PNG image.');
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);

    setSelectedFile(file);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    validateAndSetFile(file);
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleResetAll = () => {
    handleClearFile();
    setConfirmedPrediction(null);
    setDiseaseCandidates([]);
    setCurrentCandidateIndex(0);
    setCandidateAnswers({});
    setApiError('');
    setCurrentStep(1);
  };

  // Step 1 -> Step 2
  const handleStep1Submit = (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please select or drag an image first.');
      return;
    }
    setCurrentStep(2);
  };

  // Step 2 -> Step 3 (Call backend to analyze image & fetch questions for candidates)
  const handleStep2Continue = async (e) => {
    e.preventDefault();
    if (!petInfo.name.trim()) {
      setPetInfoError('Please enter your dog’s name.');
      return;
    }
    setPetInfoError('');
    setApiError('');
    setApiLoading(true);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('petName', petInfo.name);
      formData.append('age', petInfo.age);
      formData.append('gender', petInfo.gender);

      const token = localStorage.getItem('token');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('http://localhost:5001/api/detect', {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to detect disease');
      }

      setAllCareGuidelines(data.careGuidelines || {});

      const candidates = data.disease_candidates || [];
      const topCand = candidates[0];
      const topDiseaseLower = topCand?.disease?.toLowerCase();

      if (!topCand || topDiseaseLower === 'others' || topDiseaseLower === 'notmatch' || topDiseaseLower === 'not match') {
        setConfirmedPrediction(null);
        setCurrentStep(4);
      } else if (topDiseaseLower === 'healthy') {
        setConfirmedPrediction(topCand);
        setCurrentStep(4);
      } else {
        setDiseaseCandidates(candidates);
        setCurrentCandidateIndex(0);
        const initialAns = {};
        (topCand.questions || []).forEach((_, idx) => {
          initialAns[idx] = 'No';
        });
        setCandidateAnswers(initialAns);
        setCurrentStep(3);
      }
    } catch (err) {
      setApiError(err.message);
    } finally {
      setApiLoading(false);
    }
  };

  const handleAnswerChange = (qIndex, value) => {
    setCandidateAnswers((prev) => ({ ...prev, [qIndex]: value }));
  };

  // Handle questionnaire submission for current candidate
  const handleQuestionnaireSubmit = (e) => {
    e.preventDefault();

    const currentCandidate = diseaseCandidates[currentCandidateIndex];
    const yesCount = Object.values(candidateAnswers).filter((val) => val === 'Yes').length;

    if (yesCount >= 3) {
      // Confirmed disease!
      setConfirmedPrediction(currentCandidate);
      setCurrentStep(4);
    } else {
      const nextIdx = currentCandidateIndex + 1;
      if (nextIdx < 3 && nextIdx < diseaseCandidates.length) {
        const nextCandidate = diseaseCandidates[nextIdx];
        const nextLower = nextCandidate.disease?.toLowerCase();

        if (nextLower === 'healthy') {
          setConfirmedPrediction(nextCandidate);
          setCurrentStep(4);
        } else if (nextLower === 'others' || nextLower === 'notmatch' || nextLower === 'not match') {
          setConfirmedPrediction(null);
          setCurrentStep(4);
        } else {
          setCurrentCandidateIndex(nextIdx);
          const nextInitialAns = {};
          (nextCandidate.questions || []).forEach((_, idx) => {
            nextInitialAns[idx] = 'No';
          });
          setCandidateAnswers(nextInitialAns);
        }
      } else {
        // Top 3 candidates evaluated, none reached 3 Yeses -> No Match
        setConfirmedPrediction(null);
        setCurrentStep(4);
      }
    }
  };

  const currentCandidate = diseaseCandidates[currentCandidateIndex];

  return (
    <div className="min-h-[calc(100vh-100px)] bg-[#F8F9FA] flex items-center justify-center py-12 px-4 font-sans">

      {/* STEP 1: Upload the Image */}
      {currentStep === 1 && (
        <div className="w-full max-w-[660px] bg-white rounded-[32px] md:rounded-[36px] shadow-[0_10px_35px_rgba(0,0,0,0.06)] border border-gray-100 p-8 md:p-12 flex flex-col items-center justify-center relative">
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#FA9132] tracking-wide uppercase text-center mb-8">
            UPLOAD THE IMAGE
          </h1>

          <div
            className={`w-full min-h-[290px] rounded-[24px] bg-[#F9F9F9] border border-gray-200 flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden p-6 ${uploadError
                ? 'border-red-400 bg-red-50/50'
                : selectedFile
                  ? 'border-[#FA9132] bg-orange-50/30'
                  : 'hover:bg-gray-100/60'
              }`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/jpeg, image/png, image/jpg"
            />

            {!previewUrl ? (
              <div className="flex flex-col items-center justify-center w-full">
                {/* Graphic Icons */}
                <div className="relative flex justify-center items-center mb-4 w-full h-[120px]">
                  <div className="relative z-10 flex flex-col items-center">
                    <img
                      src={pngIcon}
                      alt="PNG"
                      className="w-16 h-20 md:w-20 md:h-24 object-contain drop-shadow-sm"
                    />
                    <div className="absolute -bottom-1 right-0 bg-black text-white w-7 h-7 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>
                  </div>

                  <div className="absolute right-12 top-4 transform rotate-12 flex flex-col items-center opacity-85">
                    <img
                      src={jpgIcon}
                      alt="JPG"
                      className="w-14 h-16 md:w-16 md:h-20 object-contain"
                    />
                    <div className="absolute -bottom-3 -right-2 text-gray-700">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 11.24V7.5a2.5 2.5 0 015 0v3.74a3 3 0 011 .61V6.5a4.5 4.5 0 00-9 0v8.79l-2.06-2.06a1.5 1.5 0 00-2.12 0 1.5 1.5 0 000 2.12l4.89 4.89A5.5 5.5 0 0010.61 22h3.89a5.5 5.5 0 005.5-5.5V11a3.5 3.5 0 00-7 0v.24z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <h3 className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight mb-1">
                  Drag & Drop
                </h3>
                <p className="text-gray-500 text-xs md:text-sm font-medium">
                  or{' '}
                  <span className="underline cursor-pointer hover:text-[#FA9132]">
                    choose a file
                  </span>
                </p>
              </div>
            ) : (
              <div className="relative w-full h-full p-2 flex flex-col items-center justify-center group">
                <img
                  src={previewUrl}
                  alt="Selected Preview"
                  className="max-h-56 object-contain rounded-xl shadow-sm"
                />
                <p className="mt-2 text-xs font-semibold text-gray-700">
                  {selectedFile?.name}
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearFile();
                  }}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-md transition-colors"
                  title="Remove image"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {uploadError && (
            <p className="text-red-500 text-xs font-bold mb-4 text-center">
              {uploadError}
            </p>
          )}

          <div className="flex justify-center gap-4 w-full mt-6">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="bg-[#9E9E9E] hover:bg-gray-500 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-sm text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleStep1Submit}
              disabled={!selectedFile}
              className={`font-bold py-3 px-8 rounded-xl transition-all shadow-md text-sm ${!selectedFile
                  ? 'bg-[#FA9132]/50 text-white cursor-not-allowed'
                  : 'bg-[#FA9132] hover:bg-[#e07f28] text-white active:scale-95'
                }`}
            >
              Submit
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Pet Information */}
      {currentStep === 2 && (
        <div className="w-full max-w-[660px] bg-white rounded-[32px] md:rounded-[36px] shadow-[0_10px_35px_rgba(0,0,0,0.06)] border border-gray-100 p-8 md:p-12 flex flex-col items-center justify-center relative">
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#FA9132] text-center mb-1">
            Pet Information
          </h1>
          <p className="text-gray-500 text-xs md:text-sm text-center mb-8">
            Please provide your dog's details before continuing.
          </p>

          <form onSubmit={handleStep2Continue} className="w-full flex flex-col gap-5">
            <div>
              <label className="block text-xs font-semibold text-gray-900 mb-1.5">
                Pet Name
              </label>
              <input
                type="text"
                value={petInfo.name}
                onChange={(e) => setPetInfo({ ...petInfo, name: e.target.value })}
                placeholder="Enter your dog's name"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#FA9132]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-900 mb-1.5">
                Age
              </label>
              <input
                type="text"
                value={petInfo.age}
                onChange={(e) => setPetInfo({ ...petInfo, age: e.target.value })}
                placeholder="Age in years"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#FA9132]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-900 mb-1.5">
                Gender
              </label>
              <select
                value={petInfo.gender}
                onChange={(e) => setPetInfo({ ...petInfo, gender: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#F3F3F3] text-sm text-gray-700 focus:outline-none cursor-pointer"
              >
                <option value="Select Gender">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            {petInfoError && (
              <p className="text-red-500 text-xs font-bold text-center">
                {petInfoError}
              </p>
            )}

            {apiError && (
              <p className="text-red-500 text-xs font-bold text-center">
                {apiError}
              </p>
            )}

            <div className="flex justify-center gap-6 mt-6 w-full">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                disabled={apiLoading}
                className="bg-[#9E9E9E] hover:bg-gray-500 text-white font-bold py-3 px-10 rounded-xl transition-all shadow-sm text-sm"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={apiLoading}
                className="bg-[#FA9132] hover:bg-[#e07f28] text-white font-bold py-3 px-10 rounded-xl transition-all shadow-md active:scale-95 text-sm flex items-center gap-2"
              >
                {apiLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    Analyzing Image...
                  </>
                ) : (
                  'Continue'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 3: Symptoms Questionnaire (Sequential per Disease Candidate) */}
      {currentStep === 3 && currentCandidate && (
        <div className="w-full max-w-[680px] bg-white rounded-[32px] md:rounded-[36px] shadow-[0_10px_35px_rgba(0,0,0,0.06)] border border-gray-100 p-8 md:p-12 flex flex-col items-center justify-center relative">
          <div className="flex items-center justify-between w-full mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Evaluation {currentCandidateIndex + 1} of {diseaseCandidates.length}
            </span>
            
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-[#FA9132] text-center mb-1">
            Symptom Verification
          </h1>
          <p className="text-gray-500 text-xs md:text-sm text-center mb-8">
            Please answer these questions regarding <strong className="text-gray-700">{currentCandidate.disease}</strong> to confirm the diagnosis.
          </p>

          <form onSubmit={handleQuestionnaireSubmit} className="w-full flex flex-col gap-3.5">
            {(currentCandidate.questions || []).map((q, idx) => (
              <div
                key={idx}
                className="w-full bg-[#FAFAFA] rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2"
              >
                <div className="flex flex-col">
                  <span className="text-xs md:text-sm font-semibold text-gray-800">
                    {idx + 1}. {q.en}
                  </span>
                  {q.si && (
                    <span className="text-xs text-gray-500 font-normal">
                      {q.si}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name={`q_${idx}`}
                      value="Yes"
                      checked={candidateAnswers[idx] === 'Yes'}
                      onChange={() => handleAnswerChange(idx, 'Yes')}
                      className="text-[#FA9132] focus:ring-[#FA9132]"
                    />
                    Yes
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name={`q_${idx}`}
                      value="No"
                      checked={candidateAnswers[idx] === 'No'}
                      onChange={() => handleAnswerChange(idx, 'No')}
                      className="text-[#FA9132] focus:ring-[#FA9132]"
                    />
                    No
                  </label>
                </div>
              </div>
            ))}

            <div className="flex justify-between items-center mt-6 w-full">
              <button
                type="button"
                onClick={() => {
                  if (currentCandidateIndex > 0) {
                    const prevIdx = currentCandidateIndex - 1;
                    setCurrentCandidateIndex(prevIdx);
                    const prevCandidate = diseaseCandidates[prevIdx];
                    const prevAns = {};
                    (prevCandidate.questions || []).forEach((_, idx) => {
                      prevAns[idx] = 'Yes';
                    });
                    setCandidateAnswers(prevAns);
                  } else {
                    setCurrentStep(2);
                  }
                }}
                className="bg-[#9E9E9E] hover:bg-gray-500 text-white font-bold py-3 px-10 rounded-xl transition-all shadow-sm text-sm"
              >
                Back
              </button>
              <button
                type="submit"
                className="bg-[#FA9132] hover:bg-[#e07f28] text-white font-bold py-3 px-10 rounded-xl transition-all shadow-md active:scale-95 text-sm"
              >
                Submit Answers
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 4: Final Result (Confirmed Disease OR No Match) */}
      {currentStep === 4 && (
        <div className="w-full max-w-[700px] bg-white rounded-[32px] md:rounded-[36px] shadow-[0_10px_35px_rgba(0,0,0,0.06)] border border-gray-100 p-8 md:p-12 flex flex-col items-center justify-center relative">
          <h1 className={`text-2xl md:text-3xl font-extrabold text-center mb-6 ${
            confirmedPrediction?.disease?.toLowerCase() === 'healthy'
              ? 'text-green-600'
              : confirmedPrediction
              ? 'text-[#FA9132]'
              : 'text-red-500'
          }`}>
            {confirmedPrediction?.disease?.toLowerCase() === 'healthy'
              ? 'Healthy Skin Result'
              : confirmedPrediction
              ? 'Disease Prediction Result'
              : 'Skin Detection Result'}
          </h1>

          {/* Pet Info Badges */}
          <div className="grid grid-cols-3 gap-3 md:gap-4 w-full mb-6">
            <div className="bg-[#F9F9F9] rounded-xl p-3 md:p-4 text-center border border-gray-100">
              <span className="block text-[11px] font-semibold text-gray-400 mb-0.5">Name</span>
              <span className="font-extrabold text-gray-900 text-sm md:text-base">{petInfo.name || 'Buddy'}</span>
            </div>
            <div className="bg-[#F9F9F9] rounded-xl p-3 md:p-4 text-center border border-gray-100">
              <span className="block text-[11px] font-semibold text-gray-400 mb-0.5">Age</span>
              <span className="font-extrabold text-gray-900 text-sm md:text-base">{petInfo.age || '3 Years'}</span>
            </div>
            <div className="bg-[#F9F9F9] rounded-xl p-3 md:p-4 text-center border border-gray-100">
              <span className="block text-[11px] font-semibold text-gray-400 mb-0.5">Gender</span>
              <span className="font-extrabold text-gray-900 text-sm md:text-base">{petInfo.gender || 'Male'}</span>
            </div>
          </div>

          {/* Alert Box */}
          {confirmedPrediction ? (
            confirmedPrediction.disease.toLowerCase() === 'healthy' ? (
              <div className="bg-green-50 border-l-4 border-green-500 rounded-xl p-5 mb-6 text-xs md:text-sm text-green-800 leading-relaxed text-left w-full shadow-sm">
                <strong className="font-extrabold block text-sm mb-1 text-green-900">
                  Healthy Skin Detected!
                </strong>
                The uploaded image indicates that your dog's skin appears to be healthy with a model confidence of{' '}
                <strong className="font-extrabold text-green-900">
                  {(confirmedPrediction.confidence * 100).toFixed(1)}%
                </strong>
                . Continue regular grooming and routine care to maintain your pet's skin health.
              </div>
            ) : (
              <div className="bg-[#FFF8F0] border-l-4 border-[#FA9132] rounded-xl p-5 mb-6 text-xs md:text-sm text-gray-800 leading-relaxed text-left w-full shadow-sm">
                The uploaded image and your symptom responses confirm that your dog is most likely affected by{' '}
                <strong className="text-[#FA9132] font-extrabold">
                  {confirmedPrediction.disease}
                </strong>{' '}
                with a model confidence of{' '}
                <strong className="text-gray-900 font-extrabold">
                  {(confirmedPrediction.confidence * 100).toFixed(1)}%
                </strong>
                . Veterinary attention is recommended to prevent symptoms from worsening.
              </div>
            )
          ) : (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-5 mb-6 text-xs md:text-sm text-red-700 leading-relaxed text-left w-full shadow-sm">
              <strong className="font-extrabold block text-sm mb-1 text-red-800">
                Please input another image
              </strong>
              The uploaded image or symptom responses did not match any known skin condition. Please upload another clear image of the affected area and try again.
            </div>
          )}

          {/* Care Guidelines (If Confirmed) */}
          {confirmedPrediction && (
            <div className="w-full text-left mb-8">
              <h2 className="text-base md:text-lg font-bold text-[#FA9132] mb-3">
                Care Guidelines
              </h2>
              <ul className="list-disc list-inside text-xs md:text-sm text-gray-700 space-y-2">
                {(allCareGuidelines[confirmedPrediction.disease] ||
                  allCareGuidelines[confirmedPrediction.disease?.toLowerCase()] || [
                  'Keep the skin clean and dry.',
                  'Maintain a balanced, nutrient-dense diet and fresh water daily.',
                  'Use gentle, pet-safe shampoos during routine baths.',
                  'Schedule regular veterinary checkups.',
                ]).map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-between items-center w-full gap-4">
            {confirmedPrediction && confirmedPrediction.disease.toLowerCase() !== 'healthy' && (
              <Link
                to="/store"
                className="bg-[#FA9132] hover:bg-[#e07f28] text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md text-sm text-center flex-1 min-w-[160px]"
              >
                Store
              </Link>
            )}
            <button
              type="button"
              onClick={handleResetAll}
              className="bg-[#5C5C5C] hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-sm text-sm text-center flex-1 min-w-[160px]"
            >
              Upload Another Image
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Detect;
