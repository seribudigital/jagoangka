import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

let scene, camera, renderer, numbers = [];
let mainLight, ambientLight;
let mouseX = 0, mouseY = 0;
let targetX = 0, targetY = 0;

let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

// Daftar warna futuristik
const colors = [
    0x3b82f6, // Blue
    0x06b6d4, // Cyan
    0x10b981, // Emerald
    0x8b5cf6, // Violet
    0xf43f5e, // Rose
    0xf59e0b  // Amber
];

function init() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;

    scene = new THREE.Scene();

    // Kamera sesuai dengan referensi
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 10;

    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0f172a, 1); // Dark mode default background

    ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    mainLight = new THREE.PointLight(0xffffff, 2, 50);
    mainLight.position.set(0, 0, 10);
    scene.add(mainLight);

    const loader = new FontLoader();
    loader.load('https://unpkg.com/three@0.160.0/examples/fonts/helvetiker_bold.typeface.json', function (font) {
        createNumericFlow(font);

        // Cek mode awal setelah angka dibuat
        update3DTheme(document.documentElement.classList.contains('light'));
    });

    document.addEventListener('mousemove', onDocumentMouseMove);
    window.addEventListener('resize', onWindowResize);

    // Observer untuk mendengarkan perubahan mode (class 'light' di tag <html>)
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class') {
                const isLight = document.documentElement.classList.contains('light');
                update3DTheme(isLight);
            }
        });
    });

    observer.observe(document.documentElement, { attributes: true });

    animate();
}

function update3DTheme(isLight) {
    if (!mainLight || !ambientLight) return;

    // Update renderer clear color to match theme background
    if (renderer) {
        if (isLight) {
            renderer.setClearColor(0xf1f5f9, 1); // Light mode: slate-100
        } else {
            renderer.setClearColor(0x0f172a, 1); // Dark mode: slate-900
        }
    }

    // Dark mode should have a fainter glow so it's not blinding
    const targetOpacity = isLight ? 0.3 : 0.2;
    const targetIntensity = isLight ? 0.5 : 0.8;
    const targetAmbient = isLight ? 0.8 : 0.3;

    mainLight.intensity = targetIntensity;
    ambientLight.intensity = targetAmbient;

    numbers.forEach(num => {
        if (num.material) {
            num.material.opacity = targetOpacity;
        }
    });
}

function createNumericFlow(font) {
    for (let i = 0; i < 35; i++) {
        const randomDigit = Math.floor(Math.random() * 10).toString();
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        const geometry = new TextGeometry(randomDigit, {
            font: font,
            size: 0.7 + Math.random() * 0.8,
            height: 0.3,
            curveSegments: 12,
            bevelEnabled: true,
            bevelThickness: 0.05,
            bevelSize: 0.03,
            bevelSegments: 5
        });

        geometry.computeBoundingBox();
        const centerOffset = -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);
        geometry.translate(centerOffset, 0, 0);

        const material = new THREE.MeshStandardMaterial({
            color: randomColor,
            metalness: 0.2,
            roughness: 0.6,
            emissive: randomColor,
            emissiveIntensity: 0.4,
            transparent: true,
            opacity: 0.8
        });

        const mesh = new THREE.Mesh(geometry, material);

        mesh.position.x = (Math.random() - 0.5) * 25;
        mesh.position.y = (Math.random() - 0.5) * 20;
        mesh.position.z = (Math.random() - 0.5) * 15;

        mesh.rotation.x = Math.random() * Math.PI;
        mesh.rotation.y = Math.random() * Math.PI;

        mesh.userData = {
            rotationSpeedX: (Math.random() - 0.5) * 0.02,
            rotationSpeedY: (Math.random() - 0.5) * 0.02,
            floatSpeed: 0.005 + Math.random() * 0.01,
            offset: Math.random() * Math.PI * 2
        };

        scene.add(mesh);
        numbers.push(mesh);
    }
}

function onDocumentMouseMove(event) {
    mouseX = (event.clientX - windowHalfX);
    mouseY = (event.clientY - windowHalfY);
}

function onWindowResize() {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    targetX += (mouseX - targetX) * 0.05;
    targetY += (mouseY - targetY) * 0.05;

    // Parallax Scene
    scene.rotation.y = targetX * 0.0002;
    scene.rotation.x = targetY * 0.0002;

    const time = Date.now() * 0.001;

    numbers.forEach(num => {
        num.rotation.x += num.userData.rotationSpeedX;
        num.rotation.y += num.userData.rotationSpeedY;
        num.position.y += Math.sin(time + num.userData.offset) * num.userData.floatSpeed;
    });

    renderer.render(scene, camera);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
