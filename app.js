let scene, camera, renderer, gridStandard, gridOrganic;
let isCameraActive = false;
let isGyroActive = false;
let isFrozen = false; // "Freeze" button state

function init() {
    // 1. Setup 3D Environment
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    // IMPORTANT: WebGLRenderer with alpha:true lets us see the camera behind the grid
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // 2. Add Standard Perspective Grid
    gridStandard = new THREE.GridHelper(100, 40, 0x00f2ff, 0x222222);
    scene.add(gridStandard);

    // 3. Add Organic (Polar) Grid
    const radius = 50;
    const radials = 16;
    const circles = 8;
    const divisions = 64;
    gridOrganic = new THREE.PolarGridHelper(radius, radials, circles, divisions, 0xc9a84c, 0x444444);
    gridOrganic.visible = false;
    gridOrganic.rotation.x = Math.PI / 2;
    scene.add(gridOrganic);

    // Position camera for Studio Mode
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);

    animate();
}

// ── GYROSCOPE LOGIC ──
async function requestGyro() {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        const response = await DeviceOrientationEvent.requestPermission();
        if (response === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation);
            isGyroActive = true;
        }
    } else {
        window.addEventListener('deviceorientation', handleOrientation);
        isGyroActive = true;
    }
}

function handleOrientation(event) {
    if (!isGyroActive || isFrozen) return;

    // Convert degrees to radians
    const alpha = event.alpha ? THREE.MathUtils.degToRad(event.alpha) : 0; // Z-axis
    const beta = event.beta ? THREE.MathUtils.degToRad(event.beta) : 0;   // X-axis
    const gamma = event.gamma ? THREE.MathUtils.degToRad(event.gamma) : 0; // Y-axis

    // Update camera rotation based on phone tilt
    // order 'ZXY' is best for mobile sensors
    camera.rotation.set(beta, alpha, -gamma, 'ZXY');
    
    // Update the HUD Leveling UI
    updateHorizonUI(beta);
}

function updateHorizonUI(beta) {
    const horizon = document.getElementById('horizon-line');
    if (!horizon) return;
    
    // If phone is near-vertical (around 90 deg or 1.57 rad), turn cyan
    const tolerance = 0.05;
    if (Math.abs(beta - 1.57) < tolerance) {
        horizon.style.background = "var(--cyan)";
        horizon.style.boxShadow = "0 0 15px var(--cyan)";
    } else {
        horizon.style.background = "rgba(255, 255, 255, 0.3)";
        horizon.style.boxShadow = "none";
    }
}

// ── CAMERA & FREEZE LOGIC ──
async function toggleCamera() {
    const video = document.getElementById('video-bg');
    const indicator = document.getElementById('mode-indicator');

    if (!isCameraActive) {
        try {
            await requestGyro();
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: "environment" } 
            });
            video.srcObject = stream;
            video.style.display = 'block';
            indicator.innerText = "AR LENS + GYRO ACTIVE";
            isCameraActive = true;
        } catch (err) {
            console.error(err);
            alert("Camera access required for AR features.");
        }
    } else {
        const stream = video.srcObject;
        if (stream) stream.getTracks().forEach(track => track.stop());
        video.style.display = 'none';
        indicator.innerText = "STUDIO MODE (OFFLINE)";
        isCameraActive = false;
        isGyroActive = false;
    }
}

function toggleFreeze() {
    isFrozen = !isFrozen;
    const btn = document.getElementById('freeze-btn');
    btn.innerText = isFrozen ? "LOCKED" : "FREEZE";
    btn.classList.toggle('active', isFrozen);
}

// ── UI TOOL SWITCHER ──
function setTool(tool, el) {
    document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    el.classList.add('active');

    gridStandard.visible = (tool === 'perspective');
    gridOrganic.visible = (tool === 'organic');
    
    const horizon = document.getElementById('horizon-line');
    if (horizon) {
        horizon.style.display = (tool === 'perspective') ? 'block' : 'none';
    }
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

init();
