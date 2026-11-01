"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import CalibrationTool from "@/components/analysis/CalibrationTool";
import ImageComparisonViewer from "@/components/analysis/ImageComparisonViewer";
import ParticleTable from "@/components/analysis/ParticleTable";
import DistributionCharts from "@/components/analysis/DistributionCharts";
import { api } from "@/lib/api";
import {
  UploadCloud,
  FileImage,
  Microscope,
  CheckCircle,
  Sliders,
  Play,
  RotateCcw,
  Download,
  FileText,
  FileSpreadsheet,
  Layers,
  Sparkles,
  ArrowRight,
  Info,
} from "lucide-react";

export default function NewAnalysisPage() {
  const [step, setStep] = useState<"upload" | "calibrate" | "detect" | "results">("upload");
  const [title, setTitle] = useState("Colloidal Nanoparticle Specimen");
  const [description, setDescription] = useState("");
  const [imageType, setImageType] = useState<"SEM" | "TEM">("SEM");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Calibration State
  const [calibrationFactor, setCalibrationFactor] = useState<number>(1.0);
  const [calibrationUnit, setCalibrationUnit] = useState<string>("nm");
  const [calibrationMessage, setCalibrationMessage] = useState<string | null>(null);

  // Detection Settings State
  const [detectionSettings, setDetectionSettings] = useState({
    clahe_clip_limit: 2.5,
    gaussian_blur: 5,
    threshold_method: "otsu",
    min_area_px: 25,
    max_area_px: 50000,
    watershed_enabled: true,
    watershed_distance_fraction: 0.35,
    exclude_border: false,
    invert_binary: false,
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [selectedParticleId, setSelectedParticleId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      setErrorMsg(null);
    }
  };

  // Upload or Quick-Load Specimen
  const handleUpload = async () => {
    if (!file) {
      setErrorMsg("Please select an SEM or TEM micrograph to upload.");
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);
      formData.append("description", description);
      formData.append("image_type", imageType);

      const res = await api.uploadImage(formData);
      setProjectId(res.project_id);
      setStep("calibrate");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to upload image file.");
    } finally {
      setIsUploading(false);
    }
  };

  // Load Seeded Benchmark Sample for Instant Evaluation
  const handleLoadSample = async (sampleType: "gold_sem" | "silver_tem") => {
    setIsUploading(true);
    setErrorMsg(null);
    try {
      // Fetch seeded sample directly from backend
      const filename =
        sampleType === "gold_sem"
          ? "sem_gold_nanoparticles.png"
          : "tem_silver_nanoparticles.png";
      const sampleImageUrl = `${api.getImageUrl(filename)}`;
      
      const response = await fetch(sampleImageUrl);
      const blob = await response.blob();
      const sampleFile = new File([blob], filename, { type: "image/png" });
      
      const formData = new FormData();
      formData.append("file", sampleFile);
      formData.append(
        "title",
        sampleType === "gold_sem"
          ? "Benchmark AuNP Colloidal Standard (SEM 15kV)"
          : "Benchmark AgNP Transmission Specimen (TEM 200kV)"
      );
      formData.append(
        "description",
        sampleType === "gold_sem"
          ? "Monodisperse gold nanoparticles with known 200 nm scale bar."
          : "Brightfield TEM transmission micrograph showing touching silver particles."
      );
      formData.append("image_type", sampleType === "gold_sem" ? "SEM" : "TEM");

      const res = await api.uploadImage(formData);
      setProjectId(res.project_id);
      setImageType(sampleType === "gold_sem" ? "SEM" : "TEM");
      setPreviewUrl(api.getImageUrl(res.relative_path));
      setStep("calibrate");
    } catch (err: any) {
      setErrorMsg(`Could not load benchmark sample: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Calibration Complete
  const handleCalibrationComplete = async (calibData: any) => {
    if (!projectId) return;
    try {
      const res = await api.calibrate(projectId, calibData);
      setCalibrationFactor(res.calibration_factor);
      setCalibrationUnit(res.unit);
      setCalibrationMessage(res.message);
      setStep("detect");
    } catch (err: any) {
      setErrorMsg(err.message || "Scale calibration failed.");
    }
  };

  // Run CV Nanoparticle Detection
  const handleRunDetection = async () => {
    if (!projectId) return;
    setIsAnalyzing(true);
    setErrorMsg(null);
    try {
      const results = await api.runDetection(projectId, detectionSettings);
      setAnalysisResults(results);
      setStep("results");
    } catch (err: any) {
      setErrorMsg(err.message || "Particle detection analysis failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Toggle Particle Status
  const handleToggleParticle = async (particleId: number, isValid: boolean) => {
    if (!projectId || !analysisResults) return;
    try {
      const res = await api.toggleParticle(projectId, particleId, isValid);
      // Update local state
      setAnalysisResults((prev: any) => ({
        ...prev,
        statistics: res.updated_statistics,
        particles: prev.particles.map((p: any) =>
          p.id === particleId ? { ...p, is_valid: isValid } : p
        ),
      }));
    } catch (err: any) {
      console.error("Toggle error:", err);
    }
  };

  return (
    <div className="flex min-h-screen bg-navy-950 text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Nanoparticle Metrology Studio"
          subtitle="Precision SEM/TEM automated segmentation, watershed separation & sizing"
        />

        <main className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-8">
          {/* Workflow Stepper */}
          <div className="glass-panel p-4 rounded-2xl border border-cyan-500/20 flex items-center justify-between">
            {[
              { id: "upload", label: "1. Upload Specimen", icon: UploadCloud },
              { id: "calibrate", label: "2. Scale Calibration", icon: Microscope },
              { id: "detect", label: "3. AI Segmentation", icon: Sliders },
              { id: "results", label: "4. Results & Reports", icon: CheckCircle },
            ].map((s, idx) => {
              const isCurrent = step === s.id;
              const isDone =
                (s.id === "upload" && step !== "upload") ||
                (s.id === "calibrate" && (step === "detect" || step === "results")) ||
                (s.id === "detect" && step === "results");

              return (
                <div key={s.id} className="flex items-center gap-2">
                  <div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono text-xs transition-all ${
                      isCurrent
                        ? "bg-cyan-500 text-navy-950 font-bold shadow-glow-cyan"
                        : isDone
                        ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/40"
                        : "text-slate-500"
                    }`}
                  >
                    <s.icon className="w-4 h-4" />
                    <span>{s.label}</span>
                  </div>
                  {idx < 3 && <div className="hidden sm:block w-8 h-px bg-slate-800" />}
                </div>
              );
            })}
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs font-mono flex items-center gap-2">
              <span className="font-bold">METROLOGY ERROR:</span> {errorMsg}
            </div>
          )}

          {/* STAGE 1: UPLOAD */}
          {step === "upload" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Upload Form */}
                <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-cyan-500/20 space-y-5">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <FileImage className="w-5 h-5 text-cyan-400" />
                    Upload Raw Electron Micrograph
                  </h3>

                  {/* Drag & Drop Zone */}
                  <label className="border-2 border-dashed border-cyan-500/30 hover:border-cyan-400 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer bg-navy-900/40 hover:bg-navy-900/70 transition-all text-center">
                    <UploadCloud className="w-12 h-12 text-cyan-400 mb-3 animate-pulse" />
                    <span className="text-sm font-semibold text-white">
                      {file ? file.name : "Click to select or drag micrograph here"}
                    </span>
                    <span className="text-xs text-slate-400 mt-1">
                      Supports PNG, JPG, JPEG, TIFF, BMP (Up to 50MB)
                    </span>
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.tif,.tiff,.bmp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-slate-300 block mb-1">
                        Specimen / Project Name
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-navy-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-300 block mb-1">
                        Microscopy Modality
                      </label>
                      <select
                        value={imageType}
                        onChange={(e) => setImageType(e.target.value as "SEM" | "TEM")}
                        className="w-full bg-navy-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-cyan-300 focus:outline-none focus:border-cyan-400"
                      >
                        <option value="SEM">Scanning Electron Microscopy (SEM)</option>
                        <option value="TEM">Transmission Electron Microscopy (TEM)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">
                      Specimen Description & Chemical Formulation (Optional)
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                      placeholder="e.g. Citrate-capped colloidal gold nanoparticles, accelerating voltage 15kV."
                      className="w-full bg-navy-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <button
                    onClick={handleUpload}
                    disabled={!file || isUploading}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-navy-950 font-bold text-sm shadow-glow-cyan hover:brightness-110 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                  >
                    {isUploading ? (
                      <span>Validating & Uploading...</span>
                    ) : (
                      <>
                        <span>Proceed to Scale Calibration</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                {/* Instant Benchmark Presets Card */}
                <div className="glass-panel p-6 rounded-2xl border border-cyan-500/20 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-mono uppercase text-cyan-400 mb-3">
                      <Sparkles className="w-4 h-4" /> Quick Test Benchmarks
                    </div>
                    <h4 className="text-sm font-bold text-white mb-2">
                      Test With Standard Electron Micrographs
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed font-light mb-4">
                      Don&apos;t have an SEM or TEM file right now? Load one of our pre-calibrated scientific benchmark samples for instant evaluation.
                    </p>

                    <div className="space-y-3">
                      <button
                        onClick={() => handleLoadSample("gold_sem")}
                        disabled={isUploading}
                        className="w-full text-left p-3 rounded-xl bg-navy-900/80 border border-slate-800 hover:border-cyan-500/40 transition-all group"
                      >
                        <div className="font-semibold text-xs text-white group-hover:text-cyan-300 flex items-center justify-between">
                          <span>Colloidal AuNP (FE-SEM)</span>
                          <span className="text-[10px] font-mono text-cyan-400">200 nm Bar</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Spherical gold nanoparticles on dark substrate with secondary electron edge bloom.
                        </p>
                      </button>

                      <button
                        onClick={() => handleLoadSample("silver_tem")}
                        disabled={isUploading}
                        className="w-full text-left p-3 rounded-xl bg-navy-900/80 border border-slate-800 hover:border-cyan-500/40 transition-all group"
                      >
                        <div className="font-semibold text-xs text-white group-hover:text-cyan-300 flex items-center justify-between">
                          <span>Silver AgNP (Brightfield TEM)</span>
                          <span className="text-[10px] font-mono text-cyan-400">100 nm Bar</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Mass-thickness contrast transmission micrograph with touching particle clusters.
                        </p>
                      </button>
                    </div>
                  </div>

                  <div className="p-3 mt-4 rounded-xl bg-navy-900/40 border border-slate-800 text-[11px] text-slate-400 font-mono">
                    <span className="text-cyan-300 font-bold block mb-0.5">Scientific Security:</span>
                    Files are deep-validated using magic bytes to prevent format tampering.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STAGE 2: CALIBRATE */}
          {step === "calibrate" && previewUrl && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Microscope className="w-5 h-5 text-cyan-400" />
                    Scale Calibration
                  </h3>
                  <p className="text-xs text-slate-400">
                    Accurately define the image scale factor before particle segmentation.
                  </p>
                </div>
                <button
                  onClick={() => setStep("upload")}
                  className="px-3 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-400 hover:text-white"
                >
                  Change Image
                </button>
              </div>

              <CalibrationTool
                imageUrl={previewUrl}
                onCalibrationComplete={handleCalibrationComplete}
                initialFactor={calibrationFactor}
                initialUnit={calibrationUnit}
              />
            </div>
          )}

          {/* STAGE 3: AI DETECTION & PARAMETERS */}
          {step === "detect" && (
            <div className="space-y-6">
              <div className="glass-panel p-6 rounded-2xl border border-cyan-500/20">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800 mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Sliders className="w-5 h-5 text-cyan-400" />
                      Nanoparticle Segmentation Engine
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Fine-tune OpenCV computer vision, contrast enhancement, and watershed separation parameters.
                    </p>
                  </div>
                  <div className="font-mono text-xs text-cyan-300 px-3 py-1.5 rounded-lg bg-navy-950 border border-cyan-500/30">
                    Scale: 1 px = {calibrationFactor.toFixed(4)} {calibrationUnit}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* CLAHE Contrast */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-300">CLAHE Contrast Clip</span>
                      <span className="font-mono text-cyan-400">{detectionSettings.clahe_clip_limit}</span>
                    </div>
                    <input
                      type="range"
                      min="1.0"
                      max="6.0"
                      step="0.1"
                      value={detectionSettings.clahe_clip_limit}
                      onChange={(e) =>
                        setDetectionSettings({
                          ...detectionSettings,
                          clahe_clip_limit: parseFloat(e.target.value),
                        })
                      }
                      className="w-full accent-cyan-400"
                    />
                    <p className="text-[11px] text-slate-400">
                      Normalizes illumination gradients across the specimen surface.
                    </p>
                  </div>

                  {/* Gaussian Blur */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-300">Gaussian Smoothing Kernel</span>
                      <span className="font-mono text-cyan-400">{detectionSettings.gaussian_blur} px</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="15"
                      step="2"
                      value={detectionSettings.gaussian_blur}
                      onChange={(e) =>
                        setDetectionSettings({
                          ...detectionSettings,
                          gaussian_blur: parseInt(e.target.value, 10),
                        })
                      }
                      className="w-full accent-cyan-400"
                    />
                    <p className="text-[11px] text-slate-400">
                      Eliminates high-frequency electron shot noise.
                    </p>
                  </div>

                  {/* Thresholding Method */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300 block">
                      Binarization Algorithm
                    </label>
                    <select
                      value={detectionSettings.threshold_method}
                      onChange={(e) =>
                        setDetectionSettings({
                          ...detectionSettings,
                          threshold_method: e.target.value,
                        })
                      }
                      className="w-full bg-navy-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                    >
                      <option value="otsu">Otsu Automatic Bimodal Threshold</option>
                      <option value="adaptive_gaussian">Adaptive Gaussian Threshold</option>
                      <option value="adaptive_mean">Adaptive Mean Threshold</option>
                    </select>
                    <p className="text-[11px] text-slate-400">
                      Otsu provides optimal separation for bimodal histogram electron micrographs.
                    </p>
                  </div>

                  {/* Min Particle Area */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-300">Minimum Particle Area (px²)</span>
                      <span className="font-mono text-cyan-400">{detectionSettings.min_area_px}</span>
                    </div>
                    <input
                      type="number"
                      min="2"
                      value={detectionSettings.min_area_px}
                      onChange={(e) =>
                        setDetectionSettings({
                          ...detectionSettings,
                          min_area_px: parseInt(e.target.value, 10) || 10,
                        })
                      }
                      className="w-full bg-navy-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                    <p className="text-[11px] text-slate-400">Filters tiny non-particulate background artifacts.</p>
                  </div>

                  {/* Watershed Distance Fraction */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-300">Watershed Peak Distance</span>
                      <span className="font-mono text-cyan-400">
                        {detectionSettings.watershed_distance_fraction}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="0.8"
                      step="0.05"
                      value={detectionSettings.watershed_distance_fraction}
                      onChange={(e) =>
                        setDetectionSettings({
                          ...detectionSettings,
                          watershed_distance_fraction: parseFloat(e.target.value),
                        })
                      }
                      className="w-full accent-cyan-400"
                    />
                    <p className="text-[11px] text-slate-400">
                      Separates touching particles at neck contours.
                    </p>
                  </div>

                  {/* Toggles */}
                  <div className="space-y-3 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                      <input
                        type="checkbox"
                        checked={detectionSettings.watershed_enabled}
                        onChange={(e) =>
                          setDetectionSettings({
                            ...detectionSettings,
                            watershed_enabled: e.target.checked,
                          })
                        }
                        className="rounded accent-cyan-400"
                      />
                      <span>Enable Watershed Touching-Particle Separation</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                      <input
                        type="checkbox"
                        checked={detectionSettings.exclude_border}
                        onChange={(e) =>
                          setDetectionSettings({
                            ...detectionSettings,
                            exclude_border: e.target.checked,
                          })
                        }
                        className="rounded accent-cyan-400"
                      />
                      <span>Discard Border-Intersecting Particles</span>
                    </label>
                  </div>
                </div>

                <div className="mt-8 flex justify-end gap-4">
                  <button
                    onClick={() => setStep("calibrate")}
                    className="px-5 py-2.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Back to Calibration
                  </button>
                  <button
                    onClick={handleRunDetection}
                    disabled={isAnalyzing}
                    className="px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-navy-950 font-bold text-xs shadow-glow-cyan hover:brightness-110 disabled:opacity-40 transition-all flex items-center gap-2"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-navy-950 border-t-transparent rounded-full animate-spin" />
                        <span>Executing Watershed Segmentation...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-navy-950" />
                        <span>Run Nanoparticle Detection</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STAGE 4: RESULTS, METROLOGY & REPORTS */}
          {step === "results" && analysisResults && (
            <div className="space-y-8">
              {/* Top Action Bar with Report Downloads */}
              <div className="glass-panel p-4 rounded-2xl border border-cyan-500/20 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    Analysis Complete: {title}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Modality: {imageType} • Scale: 1 px = {calibrationFactor.toFixed(4)} {calibrationUnit}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setStep("detect")}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-navy-900 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white"
                  >
                    <Sliders className="w-3.5 h-3.5" /> Adjust Parameters
                  </button>

                  {/* PDF Report Download */}
                  <a
                    href={api.getReportPdfUrl(analysisResults.project_id)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-navy-950 font-bold text-xs shadow-glow-cyan hover:brightness-110 transition-all"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Download PDF Report</span>
                  </a>

                  {/* Excel Report Download */}
                  <a
                    href={api.getReportExcelUrl(analysisResults.project_id)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-semibold text-xs hover:bg-emerald-900 transition-all"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Excel (.xlsx)</span>
                  </a>

                  {/* CSV Download */}
                  <a
                    href={api.getReportCsvUrl(analysisResults.project_id)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-navy-900 border border-slate-700 text-xs text-slate-300 hover:text-white"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV</span>
                  </a>
                </div>
              </div>

              {/* Statistical Distribution Charts */}
              <DistributionCharts stats={analysisResults.statistics} />

              {/* Interactive Image Comparison & Particle Selection Viewer */}
              <ImageComparisonViewer
                originalUrl={api.getImageUrl(analysisResults.original_image)}
                processedUrl={api.getImageUrl(analysisResults.processed_image)}
                overlayUrl={api.getImageUrl(analysisResults.overlay_image)}
                particles={analysisResults.particles}
                selectedParticleId={selectedParticleId}
                onSelectParticle={(id) => setSelectedParticleId(id)}
                onToggleParticle={handleToggleParticle}
                unit={calibrationUnit}
              />

              {/* Sortable & Filterable Particle Measurement Table */}
              <ParticleTable
                particles={analysisResults.particles}
                selectedParticleId={selectedParticleId}
                onSelectParticle={(id) => setSelectedParticleId(id)}
                onToggleParticle={handleToggleParticle}
                unit={calibrationUnit}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

