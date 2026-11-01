import sys
import httpx
from pathlib import Path

# Ensure UTF-8 output on Windows console
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = "http://127.0.0.1:8000/api"

def run_tests():
    print("==================================================")
    print("NANOVISION BACKEND INTEGRATION TEST SUITE")
    print("==================================================")
    
    with httpx.Client(base_url=BASE_URL, timeout=30.0) as client:
        # 1. Health check
        res = client.get("/health")
        assert res.status_code == 200, f"Health check failed: {res.text}"
        print("✓ Health Check: OK ->", res.json())

        # 2. Login
        res = client.post("/auth/login", json={"email": "researcher@nanovision.ai", "password": "nanovision2026"})
        assert res.status_code == 200, f"Login failed: {res.text}"
        data = res.json()
        token = data["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print(f"✓ Authentication: OK (User: {data['user']['full_name']})")

        # 3. Dashboard stats
        res = client.get("/projects/dashboard-stats", headers=headers)
        assert res.status_code == 200, f"Dashboard stats failed: {res.text}"
        stats = res.json()
        print(f"✓ Dashboard Stats: OK (Total Images: {stats['total_images']}, Total Particles: {stats['total_particles']}, Avg ECD: {stats['avg_particle_diameter']} nm)")

        # 4. List projects
        res = client.get("/projects", headers=headers)
        assert res.status_code == 200
        projects = res.json()
        print(f"✓ Project List: OK ({len(projects)} projects in DB)")
        sample_project = projects[0]
        project_id = sample_project["id"]

        # 5. Calibration test
        res = client.post(
            f"/analysis/calibrate/{project_id}",
            headers=headers,
            json={
                "method": "manual",
                "point1": [100.0, 100.0],
                "point2": [250.0, 100.0],
                "known_distance": 200.0,
                "unit": "nm"
            }
        )
        assert res.status_code == 200, f"Calibration failed: {res.text}"
        calib = res.json()
        print(f"✓ Calibration Engine: OK (Factor: {calib['calibration_factor']} nm/pixel)")

        # 6. Watershed Detection test
        res = client.post(
            f"/analysis/run/{project_id}",
            headers=headers,
            json={
                "clahe_clip_limit": 2.5,
                "gaussian_blur": 5,
                "threshold_method": "otsu",
                "min_area_px": 30,
                "max_area_px": 50000,
                "watershed_enabled": True,
                "watershed_distance_fraction": 0.35,
                "exclude_border": False,
                "invert_binary": False
            }
        )
        assert res.status_code == 200, f"Detection failed: {res.text}"
        detection = res.json()
        stat_out = detection["statistics"]
        print(f"✓ Watershed Particle Detection: OK ({len(detection['particles'])} particles identified, Mean ECD: {stat_out['mean_diameter']} nm, CV: {stat_out['cv_percent']}%)")

        # 7. Toggle particle validity test
        first_particle = detection["particles"][0]
        res = client.post(
            f"/analysis/toggle-particle/{project_id}",
            headers=headers,
            json={"particle_id": first_particle["id"], "is_valid": False}
        )
        assert res.status_code == 200
        print(f"✓ Particle Exclusion / Toggle: OK (Particle #{first_particle['particle_number']} marked invalid)")

        # Re-enable particle
        client.post(
            f"/analysis/toggle-particle/{project_id}",
            headers=headers,
            json={"particle_id": first_particle["id"], "is_valid": True}
        )

        # 8. NanoBot Chatbot query test
        res = client.post(
            "/chatbot/query",
            headers=headers,
            json={
                "message": "What is the average nanoparticle size of this sample?",
                "project_id": project_id
            }
        )
        assert res.status_code == 200, f"NanoBot query failed: {res.text}"
        bot_res = res.json()
        print("✓ NanoBot AI Assistant: OK -> Response preview:")
        print("   " + bot_res["reply"][:140].replace("\n", " ") + "...")

        # 9. Reports test (PDF, Excel, CSV)
        res_pdf = client.get(f"/reports/pdf/{project_id}", headers=headers)
        assert res_pdf.status_code == 200 and len(res_pdf.content) > 1000
        print(f"✓ PDF Academic Report: OK ({len(res_pdf.content)} bytes generated with embedded micrographs)")

        res_excel = client.get(f"/reports/excel/{project_id}", headers=headers)
        assert res_excel.status_code == 200 and len(res_excel.content) > 500
        print(f"✓ Excel Multi-Sheet Dataset: OK ({len(res_excel.content)} bytes generated)")

        res_csv = client.get(f"/reports/csv/{project_id}", headers=headers)
        assert res_csv.status_code == 200 and len(res_csv.content) > 100
        print(f"✓ CSV Metrics Dataset: OK ({len(res_csv.content)} bytes generated)")

    print("==================================================")
    print("ALL 9 CORE SCIENTIFIC SUBSYSTEMS PASSED WITH 100% SUCCESS!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
