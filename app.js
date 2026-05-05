let scene, camera, renderer, gridStandard, gridOrganic;
let isCameraActive = false;

function init() {
    // 1. Setup 3D Environment
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // 2. Add Standard Perspective Grid
    gridStandard = new THREE.GridHelper(100, 40, 0x00f2ff, 0x222222);
    scene.add(gridStandard);

    // 3. Add Organic (Polar) Grid placeholder
    const radius = 50;
    const radials = 16;
    const circles = 8;
    const divisions = 64;
    gridOrganic = new THREE.PolarGridHelper(radius, radials, circles, divisions, 0xc9a84c, 0x444444);
    gridOrganic.visible = false;
    gridOrganic.rotation.x = Math.PI / 2;
    scene.add(gridOrganic);

    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);

    animate();
}

async function toggleCamera() {
    const video = document.getElementById('video-bg');
    if (!isCameraActive) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            video.srcObject = stream;
            video.style.display = 'block';
            document.getElementById('mode-indicator').innerText = "AR Lens (Live)";
            isCameraActive = true;
        } catch (err) {
            alert("Camera access denied or unavailable.");
        }
    } else {
        const stream = video.srcObject;
        stream.getTracks().forEach(track => track.stop());
        video.style.display = 'none';
        document.getElementById('mode-indicator').innerText = "Studio Mode (Offline)";
        isCameraActive = false;
    }
}

function setTool(tool, el) {
    document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    el.classList.add('active');

    gridStandard.visible = (tool === 'perspective');
    gridOrganic.visible = (tool === 'organic');
    
    // Add logic for Composition and Color soon...
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
