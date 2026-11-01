"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ParticleCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060d24, 0.0018);

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      1,
      2000
    );
    camera.position.z = 600;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 1. Create Thousands of Floating Microscopic Nanoparticles
    const particleCount = 2000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const originalPositions = new Float32Array(particleCount * 3);

    const color1 = new THREE.Color(0x22d3ee); // Cyan
    const color2 = new THREE.Color(0x3b82f6); // Electric Blue
    const color3 = new THREE.Color(0x67e8f9); // Light Cyan

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const radius = 550 * Math.cbrt(Math.random());
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;

      originalPositions[i3] = x;
      originalPositions[i3 + 1] = y;
      originalPositions[i3 + 2] = z;

      // Color interpolation based on position
      const mixedColor = Math.random() > 0.5 ? color1.clone().lerp(color2, Math.random()) : color3;
      colors[i3] = mixedColor.r;
      colors[i3 + 1] = mixedColor.g;
      colors[i3 + 2] = mixedColor.b;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    // Particle sprite texture (circular glow)
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, "rgba(255, 255, 255, 1)");
      grad.addColorStop(0.3, "rgba(34, 211, 238, 0.8)");
      grad.addColorStop(0.7, "rgba(59, 130, 246, 0.3)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);
    }
    const particleTexture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 7,
      map: particleTexture,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // 2. Molecular Nodes & Connecting Agglomerate Network
    const networkNodeCount = 45;
    const nodeGeometry = new THREE.BufferGeometry();
    const nodePositions = new Float32Array(networkNodeCount * 3);
    for (let i = 0; i < networkNodeCount; i++) {
      nodePositions[i * 3] = (Math.random() - 0.5) * 600;
      nodePositions[i * 3 + 1] = (Math.random() - 0.5) * 500;
      nodePositions[i * 3 + 2] = (Math.random() - 0.5) * 400;
    }
    nodeGeometry.setAttribute("position", new THREE.BufferAttribute(nodePositions, 3));

    // Line connections between close nodes
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x0891b2,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
    });

    const linePositions: number[] = [];
    for (let i = 0; i < networkNodeCount; i++) {
      for (let j = i + 1; j < networkNodeCount; j++) {
        const dx = nodePositions[i * 3] - nodePositions[j * 3];
        const dy = nodePositions[i * 3 + 1] - nodePositions[j * 3 + 1];
        const dz = nodePositions[i * 3 + 2] - nodePositions[j * 3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < 140) {
          linePositions.push(
            nodePositions[i * 3], nodePositions[i * 3 + 1], nodePositions[i * 3 + 2],
            nodePositions[j * 3], nodePositions[j * 3 + 1], nodePositions[j * 3 + 2]
          );
        }
      }
    }
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
    const networkLines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(networkLines);

    // 3. Scientific Scanning Plane Effect
    const scanPlaneGeo = new THREE.PlaneGeometry(1200, 2);
    const scanPlaneMat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const scanPlane = new THREE.Mesh(scanPlaneGeo, scanPlaneMat);
    scanPlane.position.z = 200;
    scene.add(scanPlane);

    // Mouse responsiveness
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;
    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX - windowHalfX) * 0.4;
      mouseY = (e.clientY - windowHalfY) * 0.4;
    };

    window.addEventListener("mousemove", onMouseMove);

    // Resize handling
    const onResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener("resize", onResize);

    // Animation Loop
    let clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth camera interpolation
      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;
      camera.position.x = targetX * 0.5;
      camera.position.y = -targetY * 0.5;
      camera.lookAt(scene.position);

      // Rotate particle cloud
      particles.rotation.y = elapsedTime * 0.06;
      particles.rotation.x = elapsedTime * 0.03;

      // Pulse network
      networkLines.rotation.y = -elapsedTime * 0.04;
      networkLines.rotation.z = elapsedTime * 0.02;

      // Scanning plane movement
      scanPlane.position.y = Math.sin(elapsedTime * 1.2) * 300;

      // Interactive particle dispersion and wave animation
      const posAttr = geometry.attributes.position as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        const wave = Math.sin(elapsedTime * 1.5 + originalPositions[i3] * 0.01) * 3;
        posArray[i3 + 1] = originalPositions[i3 + 1] + wave;
      }
      posAttr.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      scanPlaneGeo.dispose();
      scanPlaneMat.dispose();
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0 pointer-events-none z-0 overflow-hidden" />;
}

