const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("nanovision_token");
}

export function setAuthToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("nanovision_token", token);
  }
}

export function removeAuthToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("nanovision_token");
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Set json content-type unless FormData
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorDetail = "An unexpected error occurred.";
    try {
      const errorJson = await res.json();
      errorDetail = errorJson.detail || JSON.stringify(errorJson);
    } catch {
      errorDetail = await res.text();
    }
    throw new Error(errorDetail || `HTTP error ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Auth
  register: (data: { email: string; full_name: string; password: string }) =>
    request<any>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    request<any>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getCurrentUser: () => request<any>("/auth/me"),

  // Projects & Dashboard
  getDashboardStats: () => request<any>("/projects/dashboard-stats"),
  listProjects: () => request<any[]>("/projects"),
  getProject: (id: number) => request<any>(`/projects/${id}`),
  updateProject: (id: number, data: { title?: string; description?: string; image_type?: string }) =>
    request<any>(`/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteProject: (id: number) =>
    request<any>(`/projects/${id}`, {
      method: "DELETE",
    }),
  compareProjects: (projectIds: number[]) =>
    request<any>("/projects/compare", {
      method: "POST",
      body: JSON.stringify({ project_ids: projectIds }),
    }),

  // Image Upload
  uploadImage: (formData: FormData) =>
    request<any>("/upload", {
      method: "POST",
      body: formData,
    }),

  // Analysis & Calibration
  calibrate: (
    projectId: number,
    data: {
      method: "manual" | "scale_bar";
      point1?: [number, number];
      point2?: [number, number];
      scale_bar_bbox?: [number, number, number, number];
      known_distance: number;
      unit: string;
    }
  ) =>
    request<any>(`/analysis/calibrate/${projectId}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  runDetection: (
    projectId: number,
    settings: {
      clahe_clip_limit: number;
      gaussian_blur: number;
      threshold_method: string;
      min_area_px: number;
      max_area_px: number;
      watershed_enabled: boolean;
      watershed_distance_fraction: number;
      exclude_border: boolean;
      invert_binary: boolean;
    }
  ) =>
    request<any>(`/analysis/run/${projectId}`, {
      method: "POST",
      body: JSON.stringify(settings),
    }),

  toggleParticle: (projectId: number, particleId: number, isValid: boolean) =>
    request<any>(`/analysis/toggle-particle/${projectId}`, {
      method: "POST",
      body: JSON.stringify({ particle_id: particleId, is_valid: isValid }),
    }),

  getAnalysisResults: (projectId: number) =>
    request<any>(`/analysis/results/${projectId}`),

  // NanoBot Chatbot
  queryChatbot: (data: {
    message: string;
    project_id?: number;
    history?: { role: string; content: string }[];
  }) =>
    request<any>("/chatbot/query", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Report URLs
  getReportPdfUrl: (projectId: number) => `${API_BASE_URL}/reports/pdf/${projectId}`,
  getReportExcelUrl: (projectId: number) => `${API_BASE_URL}/reports/excel/${projectId}`,
  getReportCsvUrl: (projectId: number) => `${API_BASE_URL}/reports/csv/${projectId}`,
  getImageUrl: (path: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    const clean = path.replace("/api/upload/file/", "").replace("uploads/", "");
    return `${API_BASE_URL}/upload/file/${clean}`;
  },
};

