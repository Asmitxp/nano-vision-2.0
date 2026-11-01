import io
import csv
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage, KeepTogether, PageBreak
)
from app.config import settings

def generate_csv_report(project: Any, particles: List[Any], stats: Dict[str, Any]) -> str:
    """Generates comprehensive CSV of all particle measurements and project metadata."""
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header block
    writer.writerow(["# NanoVision AI - Nanoparticle Size Analysis Report"])
    writer.writerow(["# Project Title", project.title])
    writer.writerow(["# Image Type", project.image_type])
    writer.writerow(["# Generated", datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")])
    writer.writerow(["# Calibration Unit", project.calibration_unit])
    writer.writerow(["# Calibration Factor", f"{project.calibration_factor} {project.calibration_unit}/pixel"])
    writer.writerow(["# Total Valid Particles", stats.get("valid_count", 0)])
    writer.writerow(["# Mean Diameter", f"{stats.get('mean_diameter', 0)} {project.calibration_unit}"])
    writer.writerow(["# Median Diameter", f"{stats.get('median_diameter', 0)} {project.calibration_unit}"])
    writer.writerow(["# Std Deviation", f"{stats.get('std_diameter', 0)} {project.calibration_unit}"])
    writer.writerow(["# CV %", f"{stats.get('cv_percent', 0)}%"])
    writer.writerow([])
    
    # Particle data table
    writer.writerow([
        "Particle ID",
        f"ECD ({project.calibration_unit})",
        f"Area ({project.calibration_unit}²)",
        f"Perimeter ({project.calibration_unit})",
        f"Major Axis ({project.calibration_unit})",
        f"Minor Axis ({project.calibration_unit})",
        f"Feret Max ({project.calibration_unit})",
        "Aspect Ratio",
        "Circularity (0-1)",
        "Center X (px)",
        "Center Y (px)",
        "Is Valid",
        "Is Uncertain"
    ])
    
    for p in particles:
        writer.writerow([
            p.particle_number,
            p.ecd_physical,
            p.area_physical,
            p.perimeter_physical,
            p.major_axis_physical,
            p.minor_axis_physical,
            p.feret_physical or p.major_axis_physical,
            round(p.aspect_ratio, 2),
            round(p.circularity, 3),
            round(p.center_x, 1),
            round(p.center_y, 1),
            "Yes" if p.is_valid else "No",
            "Yes" if p.is_uncertain else "No"
        ])
        
    return output.getvalue()

def generate_excel_report(project: Any, particles: List[Any], stats: Dict[str, Any]) -> io.BytesIO:
    """Generates multi-sheet Excel workbook with formatted tables and summary."""
    wb = openpyxl.Workbook()
    
    # Sheet 1: Summary Dashboard
    ws_summary = wb.active
    ws_summary.title = "Executive Summary"
    
    # Header styling
    dark_header = PatternFill(start_color="0A1638", end_color="0A1638", fill_type="solid")
    cyan_accent = PatternFill(start_color="06B6D4", end_color="06B6D4", fill_type="solid")
    font_title = Font(name="Calibri", size=16, bold=True, color="FFFFFF")
    font_bold = Font(name="Calibri", size=11, bold=True)
    
    ws_summary["A1"] = "NanoVision AI - Nanoparticle Metrology Report"
    ws_summary["A1"].font = font_title
    ws_summary["A1"].fill = dark_header
    ws_summary.merge_cells("A1:E1")
    
    metadata = [
        ("Project Title", project.title),
        ("Microscopy Modality", f"{project.image_type} Electron Microscopy"),
        ("Date Generated", datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")),
        ("Calibration Scale Factor", f"{project.calibration_factor} {project.calibration_unit}/pixel"),
        ("Calibration Unit", project.calibration_unit),
        ("Total Particles Identified", len(particles)),
        ("Statistically Valid Count", stats.get("valid_count", 0)),
        ("Mean ECD", f"{stats.get('mean_diameter', 0)} {project.calibration_unit}"),
        ("Median Diameter", f"{stats.get('median_diameter', 0)} {project.calibration_unit}"),
        ("Standard Deviation", f"{stats.get('std_diameter', 0)} {project.calibration_unit}"),
        ("Polydispersity (CV %)", f"{stats.get('cv_percent', 0)}%"),
        ("Minimum Diameter", f"{stats.get('min_diameter', 0)} {project.calibration_unit}"),
        ("Maximum Diameter", f"{stats.get('max_diameter', 0)} {project.calibration_unit}"),
        ("25th Percentile (P25)", f"{stats.get('p25_diameter', 0)} {project.calibration_unit}"),
        ("75th Percentile (P75)", f"{stats.get('p75_diameter', 0)} {project.calibration_unit}"),
        ("Mean Circularity", f"{stats.get('mean_circularity', 0)}"),
        ("Mean Aspect Ratio", f"{stats.get('mean_aspect_ratio', 0)}")
    ]
    
    for row_idx, (label, val) in enumerate(metadata, start=3):
        cell_lbl = ws_summary.cell(row=row_idx, column=1, value=label)
        cell_val = ws_summary.cell(row=row_idx, column=2, value=val)
        cell_lbl.font = font_bold
        
    ws_summary.column_dimensions["A"].width = 28
    ws_summary.column_dimensions["B"].width = 35
    
    # Sheet 2: Raw Particle Measurements
    ws_data = wb.create_sheet(title="Particle Measurements")
    headers = [
        "ID",
        f"ECD ({project.calibration_unit})",
        f"Area ({project.calibration_unit}²)",
        f"Perimeter ({project.calibration_unit})",
        f"Major Axis ({project.calibration_unit})",
        f"Minor Axis ({project.calibration_unit})",
        f"Feret Diameter ({project.calibration_unit})",
        "Aspect Ratio",
        "Circularity",
        "Center X (px)",
        "Center Y (px)",
        "Valid",
        "Uncertain Flag"
    ]
    
    for col_idx, h in enumerate(headers, start=1):
        cell = ws_data.cell(row=1, column=col_idx, value=h)
        cell.font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
        cell.fill = dark_header
        
    for r_idx, p in enumerate(particles, start=2):
        row_vals = [
            p.particle_number,
            p.ecd_physical,
            p.area_physical,
            p.perimeter_physical,
            p.major_axis_physical,
            p.minor_axis_physical,
            p.feret_physical or p.major_axis_physical,
            round(p.aspect_ratio, 2),
            round(p.circularity, 3),
            round(p.center_x, 1),
            round(p.center_y, 1),
            "TRUE" if p.is_valid else "FALSE",
            "TRUE" if p.is_uncertain else "FALSE"
        ]
        for c_idx, val in enumerate(row_vals, start=1):
            ws_data.cell(row=r_idx, column=c_idx, value=val)
            
    for col in ws_data.columns:
        max_len = max(len(str(cell.value or '')) for cell in col)
        col_letter = openpyxl.utils.get_column_letter(col[0].column)
        ws_data.column_dimensions[col_letter].width = max(max_len + 3, 12)
        
    stream = io.BytesIO()
    wb.save(stream)
    stream.seek(0)
    return stream

def generate_pdf_report(
    project: Any, 
    particles: List[Any], 
    stats: Dict[str, Any], 
    user_name: str = "Researcher"
) -> io.BytesIO:
    """Generates multi-page academic scientific PDF report with embedded microscopy images."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=letter, 
        leftMargin=36, 
        rightMargin=36, 
        topMargin=36, 
        bottomMargin=36
    )
    
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        "NanoTitle",
        parent=styles["Title"],
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#060D24"),
        alignment=0,
        spaceAfter=6
    )
    
    subtitle_style = ParagraphStyle(
        "NanoSubtitle",
        parent=styles["Normal"],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#0891B2"),
        spaceAfter=14
    )
    
    section_style = ParagraphStyle(
        "NanoSection",
        parent=styles["Heading2"],
        fontSize=13,
        leading=16,
        textColor=colors.HexColor("#0F204D"),
        spaceBefore=12,
        spaceAfter=6
    )
    
    body_style = ParagraphStyle(
        "NanoBody",
        parent=styles["Normal"],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#334155")
    )
    
    elements = []
    
    # 1. Header & Title
    elements.append(Paragraph("<b>NanoVision AI</b> | Automated Nanoparticle Size Metrology Report", title_style))
    elements.append(Paragraph(f"Project: <b>{project.title}</b> | Analyst: {user_name} | Date: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}", subtitle_style))
    elements.append(Spacer(1, 8))
    
    # 2. Executive Metadata Table
    unit = project.calibration_unit
    meta_table_data = [
        [
            Paragraph("<b>Microscopy Modality:</b>", body_style),
            Paragraph(f"{project.image_type} Electron Microscopy", body_style),
            Paragraph("<b>Scale Calibration:</b>", body_style),
            Paragraph(f"{project.calibration_factor} {unit}/px", body_style),
        ],
        [
            Paragraph("<b>Valid Particles:</b>", body_style),
            Paragraph(f"{stats.get('valid_count', 0)} of {len(particles)}", body_style),
            Paragraph("<b>Uncertain / Border:</b>", body_style),
            Paragraph(f"{stats.get('uncertain_count', 0)}", body_style),
        ],
        [
            Paragraph("<b>Mean Diameter (ECD):</b>", body_style),
            Paragraph(f"<b>{stats.get('mean_diameter', 0)} {unit}</b>", body_style),
            Paragraph("<b>Std Deviation:</b>", body_style),
            Paragraph(f"± {stats.get('std_diameter', 0)} {unit}", body_style),
        ],
        [
            Paragraph("<b>Median Diameter:</b>", body_style),
            Paragraph(f"{stats.get('median_diameter', 0)} {unit}", body_style),
            Paragraph("<b>Polydispersity (CV):</b>", body_style),
            Paragraph(f"{stats.get('cv_percent', 0)}%", body_style),
        ],
        [
            Paragraph("<b>Range (Min - Max):</b>", body_style),
            Paragraph(f"{stats.get('min_diameter', 0)} - {stats.get('max_diameter', 0)} {unit}", body_style),
            Paragraph("<b>IQR (P25 - P75):</b>", body_style),
            Paragraph(f"{stats.get('p25_diameter', 0)} - {stats.get('p75_diameter', 0)} {unit}", body_style),
        ]
    ]
    
    meta_table = Table(meta_table_data, colWidths=[120, 150, 120, 150])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 14))
    
    # 3. Microscopy Images (Original, Processed, and Particle Segmentation Overlay)
    elements.append(Paragraph("Visual Segmentation & Boundary Detection", section_style))
    
    img_cells = []
    # Try finding image files on disk
    base_dir = settings.BASE_DIR
    orig_path = base_dir / project.original_image if project.original_image else None
    overlay_path = base_dir / project.overlay_image if project.overlay_image else None
    
    img_w, img_h = 250, 170
    
    orig_rl = None
    if orig_path and orig_path.exists():
        try:
            orig_rl = RLImage(str(orig_path), width=img_w, height=img_h)
        except Exception:
            orig_rl = Paragraph("Original micrograph image unavailable", body_style)
            
    overlay_rl = None
    if overlay_path and overlay_path.exists():
        try:
            overlay_rl = RLImage(str(overlay_path), width=img_w, height=img_h)
        except Exception:
            overlay_rl = Paragraph("Overlay micrograph image unavailable", body_style)
            
    if orig_rl and overlay_rl:
        img_table = Table(
            [[orig_rl, overlay_rl], 
             [Paragraph("<b>Figure 1a:</b> Original Raw Micrograph", body_style), 
              Paragraph("<b>Figure 1b:</b> Detected Particle Boundary Overlay", body_style)]],
            colWidths=[265, 265]
        )
        img_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        elements.append(img_table)
    elements.append(Spacer(1, 14))
    
    # 4. Statistical Distribution Table (Histogram Bins)
    elements.append(Paragraph("Particle Size Frequency Distribution", section_style))
    hist_data = [["Bin Range (" + unit + ")", "Bin Midpoint", "Particle Count", "Relative Frequency (%)"]]
    for b in stats.get("histogram", [])[:10]:
        hist_data.append([
            f"{b['bin_start']} - {b['bin_end']}",
            f"{b['bin_mid']}",
            f"{b['count']}",
            f"{b['frequency']}%"
        ])
        
    hist_table = Table(hist_data, colWidths=[140, 130, 130, 140])
    hist_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#060D24")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    elements.append(hist_table)
    elements.append(Spacer(1, 14))
    
    # 5. Scientific Methodology & Uncertainty Statement
    elements.append(Paragraph("Scientific Methodology & Uncertainty Notes", section_style))
    method_text = (
        "<b>Segmentation Algorithm:</b> Contrast-Limited Adaptive Histogram Equalization (CLAHE) was applied "
        "to normalize electron density variations, followed by Otsu adaptive binarization. Touching particles were separated "
        "via Euclidean Distance Transformation and Marker-Controlled Watershed topology.<br/><br/>"
        "<b>Metrology Definitions:</b> Equivalent Circular Diameter (ECD) is calculated from the 2D projected area: "
        "<i>ECD = 2 * sqrt(Area / π)</i>. Notice that 2D transmission and scanning projections assume convex planar orientation; "
        "particles intersecting field boundaries are marked uncertain to prevent statistical truncation bias."
    )
    elements.append(Paragraph(method_text, body_style))
    elements.append(Spacer(1, 14))
    
    # 6. Sample Individual Particle Measurements Table
    elements.append(Paragraph(f"Sample Individual Particle Registry (Showing First 20 of {len(particles)})", section_style))
    part_table_data = [["ID", f"ECD ({unit})", f"Area ({unit}²)", f"Major ({unit})", f"Minor ({unit})", "Aspect Ratio", "Circularity", "Status"]]
    for p in particles[:20]:
        status_str = "Uncertain" if p.is_uncertain else "Valid"
        part_table_data.append([
            str(p.particle_number),
            f"{p.ecd_physical:.2f}",
            f"{p.area_physical:.1f}",
            f"{p.major_axis_physical:.2f}",
            f"{p.minor_axis_physical:.2f}",
            f"{p.aspect_ratio:.2f}",
            f"{p.circularity:.3f}",
            status_str
        ])
        
    part_table = Table(part_table_data, colWidths=[40, 75, 85, 75, 75, 75, 65, 55])
    part_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0891B2")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F1F5F9")]),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
    ]))
    elements.append(part_table)
    
    doc.build(elements)
    buffer.seek(0)
    return buffer

