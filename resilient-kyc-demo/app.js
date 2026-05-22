// Initialize Lucide Icons
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    initApp();
});

// App State Management
const state = {
    currentStep: 'step-id-upload',
    selectedScenario: 'pass',
    inputSource: 'webcam', // 'webcam' or 'mock'
    backendMode: 'simulation', // 'simulation' or 'live'
    apiEndpoint: 'http://localhost:8000/verify',
    
    // Identity Data
    idUploaded: false,
    selectedIdentity: null, // 'aarav_sharma', 'priya_patel', or 'custom'
    idImageSrc: null, // Base64 or ObjectURL of ID
    liveImageSrc: null, // Captured live photo
    
    // Liveness Challenge variables
    livenessRunning: false,
    currentChallengeIndex: 0,
    webcamStream: null,
    animationFrameId: null,
    livenessProgress: 0,
    challenges: [
        { id: 'alignment', title: 'Face Alignment', desc: 'Aligning face within frame...' },
        { id: 'rotation', title: 'Head Rotation Check', desc: 'Please rotate your head to the left...' }
    ],
    
    // Pipeline Variables
    pipelineProgress: 0,
    activeLayer: null
};

// Scenario Settings Database
const SCENARIOS = {
    pass: {
        verdict: 'APPROVED',
        theme: 'approved',
        icon: 'shield-check',
        message: 'Identity successfully verified. The subject matches the ID document and passed all anti-spoofing tests.',
        layers: {
            liveness: { status: 'PASS', score: '98.4%', motion: 'Dynamic Motion (Normal)', reflection: 'Spectral Verified' },
            deepfake: { status: 'REAL', score: '99.1%', cnn: '0.009 (Authentic)', blending: 'Negative' },
            facematch: { status: 'MATCH', score: '94.6%', distance: '0.18', similarity: '94.6% (Match)' }
        }
    },
    spoof: {
        verdict: 'REJECTED',
        theme: 'rejected',
        icon: 'alert-octagon',
        message: 'Liveness check failed. The system detected a static image/video replay attack.',
        layers: {
            liveness: { status: 'FAIL', score: '12.5%', motion: 'Static Profile (No Motion)', reflection: 'Planar Surface Detected' },
            deepfake: { status: 'SKIPPED', score: '--', cnn: 'Not Evaluated', blending: 'Not Evaluated' },
            facematch: { status: 'SKIPPED', score: '--', distance: 'Not Evaluated', similarity: 'Not Evaluated' }
        }
    },
    deepfake: {
        verdict: 'REJECTED',
        theme: 'rejected',
        icon: 'user-x',
        message: 'Deepfake detected. Input classified as synthetic AI-generated content (texture blending inconsistency).',
        layers: {
            liveness: { status: 'PASS', score: '94.2%', motion: 'Dynamic Motion (Normal)', reflection: 'Spectral Verified' },
            deepfake: { status: 'FAKE', score: '97.8%', cnn: '0.978 (Synthetic)', blending: 'Anomaly Detected' },
            facematch: { status: 'SKIPPED', score: '--', distance: 'Not Evaluated', similarity: 'Not Evaluated' }
        }
    },
    mismatch: {
        verdict: 'REJECTED',
        theme: 'rejected',
        icon: 'users',
        message: 'Identity mismatch. The live face does not match the photo on the uploaded ID document.',
        layers: {
            liveness: { status: 'PASS', score: '97.9%', motion: 'Dynamic Motion (Normal)', reflection: 'Spectral Verified' },
            deepfake: { status: 'REAL', score: '98.5%', cnn: '0.015 (Authentic)', blending: 'Negative' },
            facematch: { status: 'FAIL', score: '41.2%', distance: '0.82', similarity: '41.2% (Mismatch)' }
        }
    }
};

// Vector Avatars Data (SVG drawing specs)
const AVATARS = {
    aarav_sharma_id: (ctx) => {
        // Suit & Tie Blue background
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, 100, 120);
        // Face outline
        ctx.fillStyle = '#fed7aa'; // light skin peach
        ctx.beginPath(); ctx.arc(50, 50, 24, 0, Math.PI * 2); ctx.fill();
        // Hair (Short Brown)
        ctx.fillStyle = '#451a03';
        ctx.beginPath(); ctx.arc(50, 38, 26, Math.PI, 0); ctx.fill();
        // Suit/Body
        ctx.fillStyle = '#0f172a';
        ctx.beginPath(); ctx.moveTo(20, 120); ctx.lineTo(30, 85); ctx.lineTo(70, 85); ctx.lineTo(80, 120); ctx.closePath(); ctx.fill();
        // Tie
        ctx.fillStyle = '#ef4444';
        ctx.beginPath(); ctx.moveTo(47, 85); ctx.lineTo(53, 85); ctx.lineTo(55, 110); ctx.lineTo(50, 115); ctx.lineTo(45, 110); ctx.closePath(); ctx.fill();
    },
    aarav_sharma_live: (ctx) => {
        // Webcam gray/green grid background
        ctx.fillStyle = '#111827'; ctx.fillRect(0, 0, 100, 120);
        ctx.strokeStyle = '#374151'; ctx.lineWidth = 1;
        for (let i = 10; i < 100; i += 15) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 120); ctx.stroke(); }
        // Face
        ctx.fillStyle = '#ffedd5'; // skin
        ctx.beginPath(); ctx.arc(50, 52, 24, 0, Math.PI * 2); ctx.fill();
        // Hair
        ctx.fillStyle = '#451a03';
        ctx.beginPath(); ctx.arc(50, 40, 26, Math.PI, 0); ctx.fill();
        // Body (Simple T-shirt)
        ctx.fillStyle = '#3730a3';
        ctx.beginPath(); ctx.moveTo(15, 120); ctx.lineTo(30, 90); ctx.lineTo(70, 90); ctx.lineTo(85, 120); ctx.closePath(); ctx.fill();
    },
    priya_patel_id: (ctx) => {
        // Suit & Red background
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(0, 0, 100, 120);
        // Face
        ctx.fillStyle = '#ffedd5';
        ctx.beginPath(); ctx.arc(50, 50, 22, 0, Math.PI * 2); ctx.fill();
        // Hair (Long Black Hair)
        ctx.fillStyle = '#111827';
        ctx.beginPath(); ctx.arc(50, 40, 25, Math.PI, 0); ctx.fill();
        ctx.fillRect(25, 40, 12, 50);
        ctx.fillRect(63, 40, 12, 50);
        // Suit/Body
        ctx.fillStyle = '#312e81';
        ctx.beginPath(); ctx.moveTo(20, 120); ctx.lineTo(32, 85); ctx.lineTo(68, 85); ctx.lineTo(80, 120); ctx.closePath(); ctx.fill();
        // Red Necklace
        ctx.strokeStyle = '#e11d48'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(50, 85, 12, 0, Math.PI); ctx.stroke();
    },
    priya_patel_live: (ctx) => {
        // Webcam grey grid background
        ctx.fillStyle = '#111827'; ctx.fillRect(0, 0, 100, 120);
        ctx.strokeStyle = '#374151'; ctx.lineWidth = 1;
        for (let i = 10; i < 100; i += 15) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 120); ctx.stroke(); }
        // Face
        ctx.fillStyle = '#ffedd5';
        ctx.beginPath(); ctx.arc(50, 52, 22, 0, Math.PI * 2); ctx.fill();
        // Hair
        ctx.fillStyle = '#111827';
        ctx.beginPath(); ctx.arc(50, 42, 25, Math.PI, 0); ctx.fill();
        ctx.fillRect(25, 42, 12, 50);
        ctx.fillRect(63, 42, 12, 50);
        // Body (Yellow top)
        ctx.fillStyle = '#ca8a04';
        ctx.beginPath(); ctx.moveTo(15, 120); ctx.lineTo(30, 92); ctx.lineTo(70, 92); ctx.lineTo(85, 120); ctx.closePath(); ctx.fill();
    }
};

// Main DOM elements
const DOM = {
    steps: document.querySelectorAll('.workspace-step'),
    scenarios: document.querySelectorAll('.scenario-option'),
    btnWebcam: document.getElementById('btn-webcam'),
    btnMockFeed: document.getElementById('btn-mock-feed'),

    
    // ID Upload Elements
    idDropzone: document.getElementById('id-dropzone'),
    idFileInput: document.getElementById('id-file-input'),
    dropzonePrompt: document.getElementById('dropzone-prompt'),
    idPreviewContainer: document.getElementById('id-preview-container'),
    idPreview: document.getElementById('id-preview'),
    btnDemoIdentities: document.querySelectorAll('.btn-demo-identity'),
    btnToLiveness: document.getElementById('btn-to-liveness'),
    
    // Liveness Elements
    webcamVideo: document.getElementById('webcam-video'),
    cameraOverlay: document.getElementById('camera-overlay'),
    cameraFallback: document.getElementById('camera-fallback-screen'),
    challengeBox: document.getElementById('challenge-box'),
    challengeIcon: document.getElementById('challenge-icon'),
    challengeIconContainer: document.getElementById('challenge-icon-container'),
    challengeTitle: document.getElementById('challenge-title'),
    challengeDesc: document.getElementById('challenge-desc'),
    livenessProgress: document.getElementById('liveness-progress'),
    btnStartVerification: document.getElementById('btn-start-verification'),
    
    // Challenges checklist
    chkAlignment: document.getElementById('chk-alignment'),
    chkRotation: document.getElementById('chk-rotation'),
    
    // Pipeline Elements
    pipelineFeedCanvas: document.getElementById('pipeline-feed-canvas'),
    pipelineCurrentOp: document.getElementById('pipeline-current-op'),
    cardLiveness: document.getElementById('card-liveness'),
    cardDeepfake: document.getElementById('card-deepfake'),
    cardFacematch: document.getElementById('card-facematch'),
    statusLiveness: document.getElementById('status-liveness'),
    statusDeepfake: document.getElementById('status-deepfake'),
    statusFacematch: document.getElementById('status-facematch'),
    metricMotion: document.getElementById('metric-motion'),
    metricReflection: document.getElementById('metric-reflection'),
    metricCnn: document.getElementById('metric-cnn'),
    metricBlending: document.getElementById('metric-blending'),
    metricDistance: document.getElementById('metric-distance'),
    metricSimilarity: document.getElementById('metric-similarity'),
    progressLiveness: document.getElementById('progress-liveness'),
    progressDeepfake: document.getElementById('progress-deepfake'),
    progressFacematch: document.getElementById('progress-facematch'),
    
    // Decision Screen
    decisionBoxElement: document.getElementById('decision-box-element'),
    decisionIconContainer: document.getElementById('decision-icon-container'),
    decisionTitle: document.getElementById('decision-title'),
    decisionMessage: document.getElementById('decision-message'),
    decisionTimestamp: document.getElementById('decision-timestamp'),
    resultIdImg: document.getElementById('result-id-img'),
    resultLiveImg: document.getElementById('result-live-img'),
    resultSimilarityPill: document.getElementById('result-similarity-pill'),
    btnResetDemo: document.getElementById('btn-reset-demo'),
    
    // Security metrics decision
    verdictLivenessStatus: document.getElementById('verdict-liveness-status'),
    verdictLivenessBar: document.getElementById('verdict-liveness-bar'),
    verdictLivenessDesc: document.getElementById('verdict-liveness-desc'),
    verdictDeepfakeStatus: document.getElementById('verdict-deepfake-status'),
    verdictDeepfakeBar: document.getElementById('verdict-deepfake-bar'),
    verdictDeepfakeDesc: document.getElementById('verdict-deepfake-desc'),
    verdictFacematchStatus: document.getElementById('verdict-facematch-status'),
    verdictFacematchBar: document.getElementById('verdict-facematch-bar'),
    verdictFacematchDesc: document.getElementById('verdict-facematch-desc'),
    
    // Verdict wrappers
    verdictLivenessItem: document.getElementById('verdict-liveness-item'),
    verdictDeepfakeItem: document.getElementById('verdict-deepfake-item'),
    verdictFacematchItem: document.getElementById('verdict-facematch-item'),
    
    // Logger console
    appConsole: document.getElementById('app-console'),
    consoleHeader: document.getElementById('console-header'),
    consoleLogs: document.getElementById('console-logs'),
    btnClearLogs: document.getElementById('btn-clear-logs')
};

// Canvas drawing contexts
let cameraOverlayCtx = DOM.cameraOverlay.getContext('2d');

function initApp() {
    registerEvents();
    logSystem('ResilientKYC Demo Framework ready. Setup system listeners.', 'system');
}

function registerEvents() {
    // Scenario options selector
    DOM.scenarios.forEach(option => {
        option.addEventListener('click', (e) => {
            DOM.scenarios.forEach(o => o.classList.remove('active'));
            option.classList.add('active');
            const scenario = option.querySelector('input').value;
            state.selectedScenario = scenario;
            logSystem(`Evaluator switched scenario to: ${option.querySelector('.option-title').innerText}`, 'system');
        });
    });

    // Input source toggles
    DOM.btnWebcam.addEventListener('click', () => {
        DOM.btnWebcam.classList.add('active');
        DOM.btnMockFeed.classList.remove('active');
        state.inputSource = 'webcam';
        logSystem('Verification feed input set to LIVE WEBCAM.', 'system');
    });

    DOM.btnMockFeed.addEventListener('click', () => {
        DOM.btnMockFeed.classList.add('active');
        DOM.btnWebcam.classList.remove('active');
        state.inputSource = 'mock';
        logSystem('Verification feed input set to MOCK SIMULATED STREAM.', 'system');
    });



    // Drag and drop events for ID card
    DOM.idDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        DOM.idDropzone.classList.add('dragover');
    });

    DOM.idDropzone.addEventListener('dragleave', () => {
        DOM.idDropzone.classList.remove('dragover');
    });

    DOM.idDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        DOM.idDropzone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleUploadedID(files[0]);
        }
    });

    DOM.idDropzone.addEventListener('click', () => {
        DOM.idFileInput.click();
    });

    DOM.idFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleUploadedID(e.target.files[0]);
        }
    });

    // Demo identities selector
    DOM.btnDemoIdentities.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // prevent triggering dropzone click
            const identity = btn.dataset.identity;
            loadDemoIdentity(identity);
        });
    });

    // Step navigation
    DOM.btnToLiveness.addEventListener('click', () => {
        navigateTo('step-liveness');
        startCameraStage();
    });

    DOM.btnStartVerification.addEventListener('click', () => {
        if (!state.livenessRunning) {
            runLivenessChallenges();
        }
    });

    DOM.btnResetDemo.addEventListener('click', () => {
        resetDemoState();
        navigateTo('step-id-upload');
    });

    DOM.btnClearLogs.addEventListener('click', (e) => {
        e.stopPropagation();
        DOM.consoleLogs.innerHTML = '';
        logSystem('Logs cleared.', 'system');
    });

    DOM.consoleHeader.addEventListener('click', () => {
        DOM.appConsole.classList.toggle('collapsed');
    });
}

// System logging in console
function logSystem(message, category = 'system') {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    const logEl = document.createElement('div');
    logEl.className = `log-entry ${category}`;
    logEl.innerHTML = `<span class="log-time">[${time}]</span> ${message}`;
    DOM.consoleLogs.appendChild(logEl);
    DOM.consoleLogs.scrollTop = DOM.consoleLogs.scrollHeight;
}

// Navigation between steps
function navigateTo(stepId) {
    DOM.steps.forEach(step => {
        step.classList.remove('active');
    });
    const activeStep = document.getElementById(stepId);
    if (activeStep) {
        activeStep.classList.add('active');
        state.currentStep = stepId;
    }
}

// Generate Vector Avatar Data URI
function getAvatarDataUri(avatarType) {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 120;
    const ctx = canvas.getContext('2d');
    if (AVATARS[avatarType]) {
        AVATARS[avatarType](ctx);
    } else {
        // generic placeholder
        ctx.fillStyle = '#374151';
        ctx.fillRect(0, 0, 100, 120);
    }
    return canvas.toDataURL();
}

// Setup simulated or uploaded ID image
function handleUploadedID(file) {
    state.idUploaded = true;
    state.selectedIdentity = 'custom';
    logSystem(`Scanning custom uploaded file: ${file.name} (${Math.round(file.size / 1024)} KB)...`, 'system');
    
    const reader = new FileReader();
    reader.onload = (e) => {
        state.idImageSrc = e.target.result;
        displayIDPreview(e.target.result);
    };
    reader.readAsDataURL(file);
}

function loadDemoIdentity(identityKey) {
    state.idUploaded = true;
    state.selectedIdentity = identityKey;
    const name = identityKey === 'aarav_sharma' ? 'Aarav Sharma' : 'Priya Patel';
    logSystem(`Loading demo identity template: ${name}...`, 'system');
    
    // Generate data uri representation
    const idAvatarName = `${identityKey}_id`;
    const imageUri = getAvatarDataUri(idAvatarName);
    state.idImageSrc = imageUri;
    displayIDPreview(imageUri);
}

function displayIDPreview(src) {
    DOM.dropzonePrompt.style.display = 'none';
    DOM.idPreviewContainer.style.display = 'flex';
    DOM.idPreview.src = src;
    DOM.btnToLiveness.disabled = false;
    logSystem('ID Card processed successfully. Face template extracted (Module 3). Ready for liveness checks.', 'success');
}

// Camera activation
function startCameraStage() {
    logSystem('Initializing presence stage. Setting up visual challenge trackers...', 'system');
    
    // Setup Canvas Resolution matching display size
    const rect = DOM.webcamVideo.getBoundingClientRect();
    DOM.cameraOverlay.width = rect.width || 480;
    DOM.cameraOverlay.height = rect.height || 360;
    
    if (state.inputSource === 'webcam') {
        DOM.cameraFallback.style.display = 'none';
        DOM.webcamVideo.style.display = 'block';
        
        navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 640 }, 
                height: { ideal: 480 },
                facingMode: 'user'
            } 
        })
        .then(stream => {
            state.webcamStream = stream;
            DOM.webcamVideo.srcObject = stream;
            logSystem('Webcam stream started successfully.', 'success');
            // Trigger visual guides
            drawLiveCameraOverlay();
        })
        .catch(err => {
            logSystem('Webcam access error: ' + err.message + '. Falling back to Mock Video Stream.', 'error');
            activateCameraFallback();
        });
    } else {
        activateCameraFallback();
    }
}

function activateCameraFallback() {
    DOM.webcamVideo.style.display = 'none';
    DOM.cameraFallback.style.display = 'flex';
    logSystem('Simulating optical feed with pre-recorded reference streams.', 'warning');
    drawLiveCameraOverlay();
}

function stopCamera() {
    if (state.webcamStream) {
        state.webcamStream.getTracks().forEach(track => track.stop());
        state.webcamStream = null;
    }
    if (state.animationFrameId) {
        cancelAnimationFrame(state.animationFrameId);
        state.animationFrameId = null;
    }
}

// Drawing overlay graphics (face frames, guides, scanline vectors)
function drawLiveCameraOverlay() {
    const ctx = cameraOverlayCtx;
    const width = DOM.cameraOverlay.width;
    const height = DOM.cameraOverlay.height;
    
    ctx.clearRect(0, 0, width, height);
    
    // Draw face guide lines dynamically
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    
    // Oval guide
    const ovalWidth = 140;
    const ovalHeight = 180;
    const centerX = width / 2;
    const centerY = height / 2 - 10;
    
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, ovalWidth, ovalHeight, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]); // Reset dash
    
    // If liveness is running, draw visual indicators based on active challenge
    if (state.livenessRunning) {
        // Bounding box representing AI model tracker
        ctx.strokeStyle = state.currentChallengeIndex > 0 ? 'var(--primary)' : 'var(--info)';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = ctx.strokeStyle;
        
        // Draw corners around the guide
        const boxX = centerX - ovalWidth;
        const boxY = centerY - ovalHeight + 10;
        const boxW = ovalWidth * 2;
        const boxH = ovalHeight * 2 - 20;
        
        ctx.beginPath();
        // Top-left
        ctx.moveTo(boxX, boxY + 20); ctx.lineTo(boxX, boxY); ctx.lineTo(boxX + 20, boxY);
        // Top-right
        ctx.moveTo(boxX + boxW - 20, boxY); ctx.lineTo(boxX + boxW, boxY); ctx.lineTo(boxX + boxW, boxY + 20);
        // Bottom-left
        ctx.moveTo(boxX, boxY + boxH - 20); ctx.lineTo(boxX, boxY + boxH); ctx.lineTo(boxX + 20, boxY + boxH);
        // Bottom-right
        ctx.moveTo(boxX + boxW - 20, boxY + boxH); ctx.lineTo(boxX + boxW, boxY + boxH); ctx.lineTo(boxX + boxW, boxY + boxH - 20);
        ctx.stroke();
        
        // Reset shadows
        ctx.shadowBlur = 0;
        
        // Active challenge visualization
        if (state.challenges[state.currentChallengeIndex].id === 'rotation') {
            // Draw rotatory arrow pointers
            ctx.strokeStyle = 'var(--primary)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(centerX, centerY, 50, -Math.PI / 4, Math.PI / 4, false);
            ctx.stroke();
        }
    }
    
    state.animationFrameId = requestAnimationFrame(drawLiveCameraOverlay);
}

// Running challenges sequentially
function runLivenessChallenges() {
    state.livenessRunning = true;
    state.currentChallengeIndex = 0;
    DOM.btnStartVerification.disabled = true;
    DOM.challengeBox.classList.add('challenging');
    
    // Set all checklist items to neutral/pending
    DOM.chkAlignment.className = 'challenge-item active';
    DOM.chkRotation.className = 'challenge-item pending';
    
    executeChallengeStep(0);
}

function executeChallengeStep(index) {
    if (index >= state.challenges.length) {
        completeLivenessStage();
        return;
    }
    
    state.currentChallengeIndex = index;
    const challenge = state.challenges[index];
    
    // Update Instruction Panel UI
    DOM.challengeTitle.innerText = `Challenge ${index + 1}: ${challenge.title}`;
    DOM.challengeDesc.innerText = challenge.desc;
    
    // Change Icon
    if (challenge.id === 'alignment') {
        DOM.challengeIconContainer.innerHTML = '<i data-lucide="scan"></i>';
        DOM.chkAlignment.className = 'challenge-item active';
        logLiveness('Analyzing head posture and boundary parameters...');
    } else if (challenge.id === 'rotation') {
        DOM.challengeIconContainer.innerHTML = '<i data-lucide="rotate-ccw"></i>';
        DOM.chkAlignment.className = 'challenge-item completed';
        DOM.chkRotation.className = 'challenge-item active';
        logLiveness('3D Euler angle estimation activated...');
    }
    lucide.createIcons();
    
    // Simulate progression of each challenge (2.5 seconds each)
    let steps = 0;
    const challengeInterval = setInterval(() => {
        steps++;
        
        // Increment progress bar
        state.livenessProgress = ((index * 50) + (steps * 5));
        DOM.livenessProgress.style.width = `${state.livenessProgress}%`;
        
        if (steps >= 10) {
            clearInterval(challengeInterval);
            
            // Check for specific scenario spoofing failure
            if (state.selectedScenario === 'spoof' && challenge.id === 'rotation') {
                // Instantly fail the head rotation challenge
                failLivenessStage();
            } else {
                // Continue to next challenge
                executeChallengeStep(index + 1);
            }
        }
    }, 250);
}

function logLiveness(msg) {
    logSystem(`[Module 1 - Liveness] ${msg}`, 'liveness');
}

function failLivenessStage() {
    state.livenessRunning = false;
    DOM.challengeBox.classList.remove('challenging');
    DOM.chkRotation.className = 'challenge-item failed';
    DOM.challengeTitle.innerText = 'Liveness Fail';
    DOM.challengeDesc.innerText = 'Head rotation static. Liveness validation failed.';
    DOM.challengeIconContainer.innerHTML = '<i data-lucide="x-circle" class="danger-text"></i>';
    lucide.createIcons();
    
    logLiveness('FAIL: Static texture matching photo detected. Head rotation dynamic missing.', 'error');
    logSystem('Process halted. Sequential evaluation rejected at Layer 1.', 'error');
    
    // Create a mock captured picture of whatever was on the feed
    captureLiveFaceFrame();
    
    setTimeout(() => {
        // Directly skip to decision stage with the failure results
        showFinalDecision();
    }, 2000);
}

function completeLivenessStage() {
    state.livenessRunning = false;
    DOM.challengeBox.classList.remove('challenging');
    DOM.chkRotation.className = 'challenge-item completed';
    DOM.livenessProgress.style.width = '100%';
    DOM.challengeTitle.innerText = 'Liveness Verified';
    DOM.challengeDesc.innerText = 'Presence validation complete. Processing security modules...';
    DOM.challengeIconContainer.innerHTML = '<i data-lucide="check-circle" class="success-text"></i>';
    lucide.createIcons();
    
    logLiveness('PASS: Presence confirmed. Real physical user validated.', 'success');
    
    captureLiveFaceFrame();
    
    setTimeout(() => {
        startPipelineStage();
    }, 1500);
}

// Captures video frame or loads corresponding avatar if mock
function captureLiveFaceFrame() {
    if (state.inputSource === 'webcam' && state.webcamStream) {
        // Capture frame from webcam using a temporary canvas
        const canvas = document.createElement('canvas');
        canvas.width = 150;
        canvas.height = 180;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(DOM.webcamVideo, 0, 0, 150, 180);
        state.liveImageSrc = canvas.toDataURL();
    } else {
        // Simulated mode avatars
        if (state.selectedScenario === 'mismatch') {
            // Evaluator testing different identity
            state.liveImageSrc = getAvatarDataUri(state.selectedIdentity === 'priya_patel' ? 'aarav_sharma_live' : 'priya_patel_live');
        } else {
            // Identity matches ID card
            state.liveImageSrc = getAvatarDataUri(state.selectedIdentity === 'priya_patel' ? 'priya_patel_live' : 'aarav_sharma_live');
        }
    }
}

// STEP 3: RUN PIPELINE VISUALIZER
function startPipelineStage() {
    stopCamera();
    navigateTo('step-pipeline');
    
    // Setup Pipeline Feed representation
    const canvas = DOM.pipelineFeedCanvas;
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    
    // Draw initial captured frame on pipeline monitor
    const img = new Image();
    img.src = state.liveImageSrc;
    img.onload = () => {
        ctx.drawImage(img, 125, 60, 150, 180);
    };
    
    // Reset Pipeline UI
    DOM.statusLiveness.className = 'status-indicator pending'; DOM.statusLiveness.innerText = 'Pending';
    DOM.statusDeepfake.className = 'status-indicator pending'; DOM.statusDeepfake.innerText = 'Pending';
    DOM.statusFacematch.className = 'status-indicator pending'; DOM.statusFacematch.innerText = 'Pending';
    
    DOM.progressLiveness.style.width = '0%';
    DOM.progressDeepfake.style.width = '0%';
    DOM.progressFacematch.style.width = '0%';
    
    // Start sequencing layers
    runPipelineLayer1(ctx);
}

function runPipelineLayer1(ctx) {
    state.activeLayer = 'liveness';
    DOM.pipelineCurrentOp.innerHTML = '<i data-lucide="loader" class="spin-icon"></i> Layer 1: Checking Liveness...';
    DOM.statusLiveness.className = 'status-indicator running'; DOM.statusLiveness.innerText = 'Running';
    DOM.cardLiveness.classList.add('running');
    lucide.createIcons();
    
    logSystem('[Module 1] Starting biological texture & motion pattern analysis...', 'system');
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += 5;
        DOM.progressLiveness.style.width = `${progress}%`;
        
        // Draw cyber boundary box flicker on canvas
        drawPipelineScanningOverlay(ctx, 'liveness');
        
        // Mock rolling metric values
        DOM.metricMotion.innerText = (95 + Math.random() * 4.9).toFixed(1) + '%';
        DOM.metricReflection.innerText = 'Spectral confidence: ' + Math.round(50 + Math.random() * 45) + '%';
        
        if (progress >= 100) {
            clearInterval(interval);
            const scenarioData = SCENARIOS[state.selectedScenario].layers.liveness;
            
            DOM.metricMotion.innerText = scenarioData.motion;
            DOM.metricReflection.innerText = scenarioData.reflection;
            DOM.statusLiveness.innerText = scenarioData.status;
            
            DOM.cardLiveness.classList.remove('running');
            
            if (scenarioData.status === 'PASS') {
                DOM.statusLiveness.className = 'status-indicator pass';
                DOM.cardLiveness.classList.add('success');
                logSystem('[Module 1] PASS: Biometric texture matches living skin cells.', 'success');
                setTimeout(() => runPipelineLayer2(ctx), 1000);
            } else {
                DOM.statusLiveness.className = 'status-indicator fail';
                DOM.cardLiveness.classList.add('failed');
                logSystem('[Module 1] FAIL: Static image structure detected.', 'error');
                setTimeout(() => showFinalDecision(), 1000);
            }
        }
    }, 100);
}

function runPipelineLayer2(ctx) {
    state.activeLayer = 'deepfake';
    DOM.pipelineCurrentOp.innerHTML = '<i data-lucide="loader" class="spin-icon"></i> Layer 2: Texture CNN Deepfake Filter...';
    DOM.statusDeepfake.className = 'status-indicator running'; DOM.statusDeepfake.innerText = 'Running';
    DOM.cardDeepfake.classList.add('running');
    lucide.createIcons();
    
    logSystem('[Module 2] CNN executing frequency feature analysis on blending masks...', 'system');
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += 5;
        DOM.progressDeepfake.style.width = `${progress}%`;
        
        // Draw cyber boundary box flicker on canvas
        drawPipelineScanningOverlay(ctx, 'deepfake');
        
        // Mock rolling metrics
        DOM.metricCnn.innerText = 'Prob: ' + Math.random().toFixed(4);
        DOM.metricBlending.innerText = Math.random() > 0.5 ? 'Anomaly: 24%' : 'No Anomaly';
        
        if (progress >= 100) {
            clearInterval(interval);
            const scenarioData = SCENARIOS[state.selectedScenario].layers.deepfake;
            
            DOM.metricCnn.innerText = scenarioData.cnn;
            DOM.metricBlending.innerText = scenarioData.blending;
            DOM.statusDeepfake.innerText = scenarioData.status;
            DOM.cardDeepfake.classList.remove('running');
            
            if (scenarioData.status === 'REAL') {
                DOM.statusDeepfake.className = 'status-indicator pass';
                DOM.cardDeepfake.classList.add('success');
                logSystem('[Module 2] PASS: Face texture frequency matches physical camera lenses.', 'success');
                setTimeout(() => runPipelineLayer3(ctx), 1000);
            } else {
                DOM.statusDeepfake.className = 'status-indicator fail';
                DOM.cardDeepfake.classList.add('failed');
                logSystem('[Module 2] FAIL: Synthetic blending artifacts or deepfake network signatures matched.', 'error');
                setTimeout(() => showFinalDecision(), 1000);
            }
        }
    }, 100);
}

function runPipelineLayer3(ctx) {
    state.activeLayer = 'facematch';
    DOM.pipelineCurrentOp.innerHTML = '<i data-lucide="loader" class="spin-icon"></i> Layer 3: ArcFace Embedding Comparison...';
    DOM.statusFacematch.className = 'status-indicator running'; DOM.statusFacematch.innerText = 'Running';
    DOM.cardFacematch.classList.add('running');
    lucide.createIcons();
    
    logSystem('[Module 3] Calculating 512D facial embedding coordinates and computing cosine distance...', 'system');
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += 5;
        DOM.progressFacematch.style.width = `${progress}%`;
        
        // Draw cyber boundary box flicker on canvas
        drawPipelineScanningOverlay(ctx, 'facematch');
        
        // Mock rolling metric values
        DOM.metricDistance.innerText = 'Dist: ' + Math.random().toFixed(2);
        DOM.metricSimilarity.innerText = Math.round(30 + Math.random() * 60) + '%';
        
        if (progress >= 100) {
            clearInterval(interval);
            const scenarioData = SCENARIOS[state.selectedScenario].layers.facematch;
            
            DOM.metricDistance.innerText = scenarioData.distance;
            DOM.metricSimilarity.innerText = scenarioData.similarity;
            DOM.statusFacematch.innerText = scenarioData.status;
            DOM.cardFacematch.classList.remove('running');
            
            if (scenarioData.status === 'MATCH') {
                DOM.statusFacematch.className = 'status-indicator pass';
                DOM.cardFacematch.classList.add('success');
                logSystem('[Module 3] PASS: Face verification matching threshold satisfied.', 'success');
            } else {
                DOM.statusFacematch.className = 'status-indicator fail';
                DOM.cardFacematch.classList.add('failed');
                logSystem('[Module 3] FAIL: Live embedding cluster diverges from target ID template.', 'error');
            }
            
            setTimeout(() => showFinalDecision(), 1200);
        }
    }, 100);
}

// Drawing scanning line effects on the pipeline feed monitor
function drawPipelineScanningOverlay(ctx, step) {
    const width = 400;
    const height = 300;
    
    // Redraw face frame
    ctx.clearRect(0, 0, width, height);
    const img = new Image();
    img.src = state.liveImageSrc;
    ctx.drawImage(img, 125, 60, 150, 180);
    
    // Scanning green/pink visual overlays
    const scanY = Math.round((Date.now() % 2000) / 2000 * 180) + 60;
    ctx.strokeStyle = step === 'liveness' ? 'var(--info)' : (step === 'deepfake' ? '#ec4899' : 'var(--primary)');
    ctx.lineWidth = 2;
    ctx.shadowBlur = 8;
    ctx.shadowColor = ctx.strokeStyle;
    
    // Draw scanning vector bar
    ctx.beginPath();
    ctx.moveTo(125, scanY);
    ctx.lineTo(275, scanY);
    ctx.stroke();
    
    // Draw target corners
    ctx.lineWidth = 1;
    ctx.strokeRect(125, 60, 150, 180);
    ctx.shadowBlur = 0;
}

// FINAL SCREEN: SHOW DECISION
function showFinalDecision() {
    navigateTo('step-decision');
    
    const scenario = SCENARIOS[state.selectedScenario];
    
    // Update Result Header Panel
    DOM.decisionBoxElement.className = `decision-result-card ${scenario.theme}`;
    DOM.decisionIconContainer.className = `result-icon-container ${scenario.theme}-glow`;
    DOM.decisionIconContainer.innerHTML = `<i data-lucide="${scenario.icon}" class="${scenario.theme}-color"></i>`;
    
    DOM.decisionTitle.innerText = scenario.verdict === 'APPROVED' ? 'Verification Approved' : 'Verification Rejected';
    DOM.decisionMessage.innerText = scenario.message;
    DOM.decisionTimestamp.innerText = `Scan ID: RK-${Math.random().toString(36).substr(2, 9).toUpperCase()} | Timestamp: ${new Date().toISOString().replace('T', ' ').substr(0, 19)}`;
    
    // Setup Faces Comparison images
    DOM.resultIdImg.src = state.idImageSrc;
    DOM.resultLiveImg.src = state.liveImageSrc;
    
    // Score configurations
    const matchScoreStr = scenario.layers.facematch.score !== '--' ? scenario.layers.facematch.score : '0.0%';
    DOM.resultSimilarityPill.innerText = matchScoreStr;
    
    if (scenario.layers.facematch.status === 'MATCH') {
        DOM.resultSimilarityPill.className = 'similarity-pill approved-match';
    } else {
        DOM.resultSimilarityPill.className = 'similarity-pill rejected-match';
    }
    
    // Verdict checklist details
    updateVerdictMetricRow('liveness', scenario.layers.liveness);
    updateVerdictMetricRow('deepfake', scenario.layers.deepfake);
    updateVerdictMetricRow('facematch', scenario.layers.facematch);
    
    // Final report logging
    logSystem(`========================================`, 'system');
    logSystem(`VERIFICATION OVERVIEW: ${scenario.verdict}`, scenario.theme === 'approved' ? 'success' : 'error');
    logSystem(`- Liveness Check: ${scenario.layers.liveness.status} (${scenario.layers.liveness.score})`, 'liveness');
    logSystem(`- Deepfake Check: ${scenario.layers.deepfake.status} (${scenario.layers.deepfake.score})`, 'deepfake');
    logSystem(`- Face Verification: ${scenario.layers.facematch.status} (${scenario.layers.facematch.score})`, 'facematch');
    logSystem(`========================================`, 'system');
    
    lucide.createIcons();
}

function updateVerdictMetricRow(layer, layerData) {
    const statusEl = document.getElementById(`verdict-${layer}-status`);
    const barEl = document.getElementById(`verdict-${layer}-bar`);
    const descEl = document.getElementById(`verdict-${layer}-desc`);
    const itemEl = document.getElementById(`verdict-${layer}-item`);
    
    statusEl.innerText = layerData.status;
    
    // Style bar based on pass status
    barEl.className = 'fill';
    itemEl.style.opacity = '1';
    
    if (layerData.status === 'PASS' || layerData.status === 'REAL' || layerData.status === 'MATCH') {
        statusEl.className = 'success-text';
        barEl.classList.add('success-bg');
        
        // Extract numeric score
        const val = parseFloat(layerData.score);
        barEl.style.width = `${val}%`;
        
        if (layer === 'liveness') descEl.innerText = `Confidence: ${layerData.score} (Real user physical presence confirmed)`;
        if (layer === 'deepfake') descEl.innerText = `Confidence: ${layerData.score} (Authentication verified - genuine biological textures)`;
        if (layer === 'facematch') descEl.innerText = `Match Score: ${layerData.score} (Satisfies safety vector distance)`;
    } else if (layerData.status === 'FAIL' || layerData.status === 'FAKE' || layerData.status === 'MISMATCH') {
        statusEl.className = 'danger-text';
        barEl.classList.add('danger-bg');
        
        const val = parseFloat(layerData.score) || 15;
        barEl.style.width = `${val}%`;
        
        if (layer === 'liveness') descEl.innerText = `Confidence: ${layerData.score} (Spoof vector match - static display detected)`;
        if (layer === 'deepfake') descEl.innerText = `Confidence: ${layerData.score} (Deepfake filter alert - blending artifacts)`;
        if (layer === 'facematch') descEl.innerText = `Match Score: ${layerData.score} (Cosine similarity below critical threshold)`;
    } else {
        // SKIPPED
        statusEl.className = 'info-text';
        barEl.classList.add('warning-bg');
        barEl.style.width = '0%';
        descEl.innerText = `Layer bypassed - execution halted due to prior check failure.`;
        itemEl.style.opacity = '0.5';
    }
}

// Resetting demo state back to default
function resetDemoState() {
    stopCamera();
    state.idUploaded = false;
    state.selectedIdentity = null;
    state.idImageSrc = null;
    state.liveImageSrc = null;
    state.livenessRunning = false;
    state.livenessProgress = 0;
    state.currentChallengeIndex = 0;
    
    // Enable/disable buttons
    DOM.btnToLiveness.disabled = true;
    DOM.btnStartVerification.disabled = false;
    
    // UI Resets
    DOM.dropzonePrompt.style.display = 'flex';
    DOM.idPreviewContainer.style.display = 'none';
    DOM.idPreview.src = '';
    DOM.livenessProgress.style.width = '0%';
    
    // Reset checklists
    DOM.chkAlignment.className = 'challenge-item pending';
    DOM.chkRotation.className = 'challenge-item pending';
    
    DOM.challengeTitle.innerText = 'Liveness Challenge';
    DOM.challengeDesc.innerText = 'Prepare to position your face within the camera boundaries.';
    DOM.challengeIconContainer.innerHTML = '<i data-lucide="video"></i>';
    
    logSystem('Verification session reset. System ready for scanning ID.', 'system');
    lucide.createIcons();
}
