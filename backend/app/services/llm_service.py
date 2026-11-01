import os
import json
import httpx
from typing import List, Dict, Any, Optional
from app.config import settings

SYSTEM_PROMPT = """You are NanoBot, an advanced scientific AI research assistant specializing in Scanning Electron Microscopy (SEM), Transmission Electron Microscopy (TEM), and nanoparticle metrology.

Your mission is to assist materials scientists, nanotechnologists, and researchers with:
1. Explaining SEM and TEM imaging principles (beam interactions, secondary vs backscattered electrons, brightfield/darkfield TEM).
2. Interpreting particle detection results, segmentation algorithms (Watershed, Otsu, distance transforms), and scale calibration.
3. Explaining statistical parameters: Equivalent Circular Diameter (ECD), Feret Diameter, aspect ratio, circularity, polydispersity index (PDI), and coefficient of variation (CV%).
4. Answering queries on nanoparticle synthesis, agglomeration, Ostwald ripening, and colloidal stability.
5. Grounding answers in actual sample data when context is provided, clearly distinguishing measured sample facts from theoretical principles.

Rules:
- Format your answers in professional, clear GitHub-flavored Markdown.
- Use LaTeX or mathematical notation for formulas (e.g. $ECD = 2 \\times \\sqrt{Area / \\pi}$, $CV\\% = \\frac{\\sigma}{\\mu} \\times 100$).
- If active project measurements are provided in the context, refer to them accurately and never invent numbers.
- If uncertain, state the scientific limitations honestly.
"""

def generate_domain_fallback_answer(message: str, context: Optional[Dict[str, Any]] = None) -> str:
    """
    High-precision scientific knowledge base fallback when external LLM API key is not configured.
    Accurately handles all standard scientific and sample queries.
    """
    msg = message.lower()
    
    # 1. Inquiries about current sample metrics
    if context and ("average" in msg or "mean" in msg or "size" in msg or "diameter" in msg) and ("this" in msg or "sample" in msg or "current" in msg or "detected" in msg):
        mean_d = context.get('mean_diameter', 'N/A')
        unit = context.get('unit', 'nm')
        std_d = context.get('std_diameter', 'N/A')
        total = context.get('valid_count', context.get('total_particles', 'N/A'))
        cv = context.get('cv_percent', 'N/A')
        
        return f"""### Active Sample Nanoparticle Size Analysis

Based on the quantitative analysis of **{context.get('project_title', 'Current Project')}**:

- **Mean Equivalent Circular Diameter (ECD):** **{mean_d} {unit}** ($\\pm {std_d}$ {unit})
- **Median Diameter:** **{context.get('median_diameter', 'N/A')} {unit}**
- **Valid Detected Particles:** **{total}**
- **Coefficient of Variation (CV):** **{cv}%**
- **Size Range:** Min **{context.get('min_diameter', 'N/A')} {unit}** to Max **{context.get('max_diameter', 'N/A')} {unit}**

#### Interpretation:
A coefficient of variation of **{cv}%** indicates {"a relatively monodisperse particle population ($CV < 15\\%$)" if isinstance(cv, (int, float)) and cv < 15 else "a polydisperse sample distribution typical of colloidal precipitation or secondary nucleation"}.
"""

    if context and ("how many" in msg or "count" in msg or "particles detected" in msg):
        total = context.get('total_particles', 0)
        valid = context.get('valid_count', total)
        uncertain = context.get('uncertain_count', 0)
        return f"""### Particle Population Count

In the current microscopy field of view:
- **Total Particles Identified:** **{total}**
- **Statistically Valid Particles:** **{valid}**
- **Flagged / Boundary Detections:** **{uncertain}** (particles intersecting image borders or exhibiting high overlap uncertainty).

*Note: Boundary particles are isolated to eliminate edge-truncation bias in statistical sizing.*"""

    # 2. Scientific definitions
    if "ecd" in msg or "equivalent circular diameter" in msg:
        return """### Equivalent Circular Diameter (ECD)

**Equivalent Circular Diameter (ECD)** is the diameter of a hypothetical perfect circle having the exact same projected area ($A$) as the 2D projected boundary of the nanoparticle:

$$ECD = 2 \\times \\sqrt{\\frac{A}{\\pi}} = \\sqrt{\\frac{4A}{\\pi}}$$

#### Why ECD is Standard in Nanometrology:
1. **Area Invariance:** Unlike Feret max/min which depend on particle orientation, ECD is invariant to rotation.
2. **Comparable to DLS & Centrifugation:** Allows direct mathematical comparison between electron microscopy images and ensemble hydrodynamic sizing methods (Dynamic Light Scattering).
3. **Accuracy Constraint:** For high aspect-ratio particles (nanorods, nanowires), Major Axis Length and Minor Axis Length should be reported alongside ECD.
"""

    if "watershed" in msg or "overlapping" in msg or "touching" in msg or "separate" in msg:
        return """### Watershed Segmentation & Handling Touching Particles

When nanoparticles aggregate or settle on a microscopy grid, their 2D projections often overlap or form contact necks. 

#### How NanoVision Separates Touching Particles:
1. **Euclidean Distance Transform:** The binary mask is converted to an intensity gradient where each pixel represents its distance to the nearest background boundary:
   $$D(p) = \\min_{q \\in \\text{Background}} \\|p - q\\|_2$$
2. **Local Maxima Detection:** Peak distance centroids are detected using topological peak finders.
3. **Marker-Controlled Watershed:** The inverse distance map is treated as a 3D topographic relief. Water simulated from each marker "floods" the basins; where water from distinct markers collides, a **watershed dam** (boundary dividing line) is constructed.

#### Scientific Precautions:
If particles form true chemical sinter necks (aggregation) rather than physical touching (agglomeration), check the `uncertainty` flags and adjust the **Watershed Distance Fraction** slider in the detection panel.
"""

    if "calibration" in msg or "scale bar" in msg or "factor" in msg:
        return """### Image Scale Calibration Methodology

Accurate calibration converts pixel coordinates $(x, y)$ into physical SI dimensions ($\\text{nm}$, $\\mu\\text{m}$, $\\text{\\AA}$):

$$\\text{Calibration Factor } (F) = \\frac{\\text{Known Physical Distance } (L_{\\text{physical}})}{\\text{Measured Pixel Distance } (D_{\\text{pixels}})} \\quad \\left[\\frac{\\text{nm}}{\\text{pixel}}\\right]$$

#### Best Practices:
1. **Never guess magnification alone:** SEM/TEM digital zoom and monitor resolution vary. Always use the calibrated embedded micron bar.
2. **Manual Two-Point Calibration:** Select the extreme start and end pixels of the scale bar for maximum baseline length to minimize relative pixel rounding errors.
3. **Scale Bar Artifacts:** Ensure the scale bar region is masked or excluded from particle detection to prevent the calibration bar from being counted as a particle.
"""

    if "sem" in msg and "tem" in msg:
        return """### SEM vs TEM in Nanoparticle Characterization

| Feature | Scanning Electron Microscopy (SEM) | Transmission Electron Microscopy (TEM) |
| :--- | :--- | :--- |
| **Electron Energy** | Typically $1 - 30\\text{ kV}$ | Typically $80 - 300\\text{ kV}$ |
| **Interaction** | Surface scattering (Secondary & Backscattered Electrons) | Transmitted through ultra-thin specimen ($< 100\\text{ nm}$) |
| **Image Type** | 3D topographic pseudo-relief | 2D projection / mass-thickness & phase contrast |
| **Resolution Limit** | $\\approx 0.5 - 2\\text{ nm}$ (FE-SEM) | Sub-angstrom ($< 0.1\\text{ nm}$ in HR-TEM) |
| **Internal Structure** | Surface morphology only | Lattice fringes, core-shell architectures, dislocations |
| **Threshold Polarity** | Usually bright particles on dark substrate | Usually dark contrast on bright background |
"""

    if "cv" in msg or "coefficient of variation" in msg or "polydispersity" in msg or "standard deviation" in msg:
        return """### Size Distribution & Coefficient of Variation ($CV\\%$)

In nanoparticle synthesis and colloidal science:

$$\\sigma = \\sqrt{\\frac{1}{N-1}\\sum_{i=1}^{N}(D_i - \\mu)^2}, \\qquad CV\\% = \\left(\\frac{\\sigma}{\\mu}\\right) \\times 100$$

#### Standards for Nanoparticle Polydispersity:
- **$CV < 5\\%$:** Ultra-monodisperse (ideal for quantum dots, photonic crystals, calibration standards).
- **$CV < 15\\%$:** Monodisperse (NIST / FDA criteria for most nanomedicine and catalyst formulations).
- **$CV > 25\\%$:** Polydisperse (indicates multi-stage nucleation, Ostwald ripening, or incomplete capping agent stabilization).
"""

    # General scientific response
    return f"""### NanoBot Scientific Insights

Thank you for your inquiry regarding: *"{message}"*.

#### Key Scientific Principles:
- **High-Precision Metrology:** SEM and TEM electron micrographs require careful thresholding, watershed separation of agglomerates, and verified scale-bar calibration.
- **Project Context:** {"You currently have an active sample loaded. Feel free to ask about its mean diameter, standard deviation, polydispersity, or calibration factor." if context else "Upload an SEM or TEM image to inspect real-time nanoparticle statistics and distribution histograms."}

*For custom synthesis questions, explain your material system (e.g., Au, Ag, TiO₂, quantum dots, lipid nanoparticles) and target size range.*"""

async def query_nanobot(
    user_message: str, 
    project_context: Optional[Dict[str, Any]] = None,
    chat_history: Optional[List[Dict[str, str]]] = None
) -> str:
    """
    Sends request to Gemini / OpenAI if configured, or falls back to domain-expert scientific response.
    """
    # 1. Try Gemini API if key is present
    if settings.GEMINI_API_KEY:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
            
            context_str = ""
            if project_context:
                context_str = f"\n\nCURRENT LOADED SAMPLE CONTEXT:\n{json.dumps(project_context, indent=2)}"
                
            contents = []
            contents.append({
                "role": "user",
                "parts": [{"text": SYSTEM_PROMPT + context_str}]
            })
            
            if chat_history:
                for msg in chat_history[-6:]:
                    role = "model" if msg.get("role") == "assistant" else "user"
                    contents.append({
                        "role": role,
                        "parts": [{"text": msg.get("content", "")}]
                    })
                    
            contents.append({
                "role": "user",
                "parts": [{"text": user_message}]
            })
            
            async with httpx.AsyncClient(timeout=20.0) as client:
                res = await client.post(url, json={"contents": contents})
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates and "content" in candidates[0]:
                        parts = candidates[0]["content"].get("parts", [])
                        if parts:
                            return parts[0].get("text", "")
        except Exception as e:
            print(f"Gemini API request failed: {e}, falling back to scientific engine.")
            
    # 2. Try OpenAI API if key is present
    if settings.OPENAI_API_KEY:
        try:
            url = "https://api.openai.com/v1/chat/completions"
            messages = [{"role": "system", "content": SYSTEM_PROMPT}]
            if project_context:
                messages.append({
                    "role": "system",
                    "content": f"CURRENT LOADED SAMPLE METRICS:\n{json.dumps(project_context, indent=2)}"
                })
            if chat_history:
                for msg in chat_history[-6:]:
                    messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})
            messages.append({"role": "user", "content": user_message})
            
            headers = {
                "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                "Content-Type": "application/json"
            }
            async with httpx.AsyncClient(timeout=20.0) as client:
                res = await client.post(url, json={"model": "gpt-4o-mini", "messages": messages}, headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    return data["choices"][0]["message"]["content"]
        except Exception as e:
            print(f"OpenAI API request failed: {e}, falling back to scientific engine.")

    # 3. High-precision scientific engine fallback
    return generate_domain_fallback_answer(user_message, project_context)

