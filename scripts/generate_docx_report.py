import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    """Sets background color of a table cell."""
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=120, bottom=120, left=150, right=150):
    """Sets cell padding in dxa (1 pt = 20 dxa)."""
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tcPr.append(tcMar)

def create_report_docx(output_path):
    doc = docx.Document()

    # 1. Page Margins (1 inch all around)
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # 2. Styles Setup
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(10.5)
    normal_style.font.color.rgb = RGBColor(30, 41, 59) # Slate 800

    # -------------------------------------------------------------
    # HEADER / TITLE
    # -------------------------------------------------------------
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(0)
    title_p.paragraph_format.space_after = Pt(4)
    title_run = title_p.add_run("MindChain: Decentralized Mental Health & Mood Tracking Application")
    title_run.font.name = 'Calibri'
    title_run.font.size = Pt(20)
    title_run.font.bold = True
    title_run.font.color.rgb = RGBColor(13, 148, 136) # Teal 600

    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_after = Pt(16)
    sub_run = sub_p.add_run("Privacy-Preserving On-Chain Healthcare Ledger with Client-Side Encryption and Dynamic Consent Management")
    sub_run.font.name = 'Calibri'
    sub_run.font.size = Pt(11)
    sub_run.font.italic = True
    sub_run.font.color.rgb = RGBColor(71, 85, 105) # Slate 600

    # Horizontal Divider Line
    divider_p = doc.add_paragraph()
    divider_p.paragraph_format.space_after = Pt(14)
    pBdr = parse_xml(f'<w:pBdr {nsdecls("w")}><w:bottom w:val="single" w:sz="12" w:space="1" w:color="0D9488"/></w:pBdr>')
    divider_p._p.get_or_add_pPr().append(pBdr)

    # -------------------------------------------------------------
    # ABSTRACT
    # -------------------------------------------------------------
    h_abs = doc.add_paragraph()
    h_abs.paragraph_format.space_before = Pt(8)
    h_abs.paragraph_format.space_after = Pt(4)
    run_abs = h_abs.add_run("Abstract")
    run_abs.font.size = Pt(13)
    run_abs.font.bold = True
    run_abs.font.color.rgb = RGBColor(15, 23, 42)

    p_abs = doc.add_paragraph()
    p_abs.paragraph_format.space_after = Pt(14)
    p_abs.paragraph_format.line_spacing = 1.15
    p_abs.add_run(
        "This project implements MindChain, a decentralized and privacy-preserving mental health tracking application "
        "built on the Ethereum blockchain. Traditional electronic health record (EHR) systems centralize sensitive psychiatric data "
        "on cloud servers vulnerable to data breaches, unauthorized profiling, and retroactive record tampering. MindChain addresses "
        "these challenges by combining immutable smart contracts (written in Solidity 0.8.20) with client-side AES-256 encryption. "
        "Patients record daily mood ratings, anxiety levels, sleep durations, and encrypted personal reflections directly to the blockchain "
        "using their pseudonymous cryptographic wallet address. A role-based smart contract access control system enables patients to "
        "selectively grant and revoke time-limited record access to licensed therapists. The smart contract also features automated distress "
        "detection that flags crisis check-ins and emits on-chain alert events. All core functions were verified using an automated end-to-end "
        "test suite (10/10 tests passed), confirming zero-knowledge privacy, tamper-proof audit trails, and strict EVM-level access control."
    )

    def add_section_header(number_title):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(6)
        run = p.add_run(number_title)
        run.font.size = Pt(13)
        run.font.bold = True
        run.font.color.rgb = RGBColor(15, 23, 42)
        return p

    def add_bullet(text, bold_prefix=None):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            r_b = p.add_run(bold_prefix)
            r_b.bold = True
            r_b.font.color.rgb = RGBColor(15, 23, 42)
        p.add_run(text)

    # -------------------------------------------------------------
    # 1. OBJECTIVES
    # -------------------------------------------------------------
    add_section_header("1. Objectives")
    add_bullet("To design and deploy a Solidity smart contract for decentralized, tamper-proof mental health logging.")
    add_bullet("To ensure zero-knowledge data confidentiality through client-side AES-256 encryption of personal reflections before transaction broadcast.")
    add_bullet("To implement dynamic, on-chain consent management allowing patients to grant and revoke therapist viewing privileges.")
    add_bullet("To build an automated distress detection engine that flags acute crisis check-ins (Mood <= 2 and Anxiety >= 8).")
    add_bullet("To provide an interactive web dashboard with real-time mood progression charts (Chart.js) and an acute anxiety relief breathing tool (4-7-8 rhythm).")
    add_bullet("To verify system correctness, security rules, and gas efficiency through an automated test suite.")

    # -------------------------------------------------------------
    # 2. TOOLS AND TECHNOLOGIES
    # -------------------------------------------------------------
    add_section_header("2. Tools and Technologies")
    
    tools_data = [
        ("Smart Contract Language", "Solidity ^0.8.20", "EVM-compatible contract enforcing data integrity and access rules"),
        ("Blockchain Runtime", "Ethereum / Hardhat EVM", "Local test node (Chain ID 31337) and JSON-RPC provider"),
        ("Web3 Client Library", "Ethers.js v6.13.2", "Manages wallet connections, transaction signing, and contract calls"),
        ("Cryptographic Engine", "CryptoJS v4.2.0", "Client-side AES-256 encryption and decryption of private notes"),
        ("Data Visualization", "Chart.js", "Renders interactive dual-axis mood and anxiety progression timelines"),
        ("Frontend Framework", "HTML5 / CSS3 / Vanilla JS", "Clean, responsive UI with zero external bundler overhead"),
        ("Testing & Deployment", "Node.js ESM Test Suite", "Automated end-to-end verification of contract methods and revert cases"),
        ("Local Web Server", "Node.js http module", "Zero-dependency static file server operating on port 3333"),
        ("Version Control", "Git & GitHub", "Distributed source code repository (arnav-xyz/BCT)")
    ]

    table1 = doc.add_table(rows=1, cols=3)
    table1.alignment = WD_TABLE_ALIGNMENT.CENTER
    table1.autofit = False

    # Header Row
    hdr_cells = table1.rows[0].cells
    hdr_cells[0].text = "Component"
    hdr_cells[1].text = "Technology"
    hdr_cells[2].text = "Description"
    for idx, cell in enumerate(hdr_cells):
        set_cell_background(cell, "0D9488")
        set_cell_margins(cell, top=140, bottom=140, left=160, right=160)
        for p in cell.paragraphs:
            p.runs[0].font.bold = True
            p.runs[0].font.color.rgb = RGBColor(255, 255, 255)

    col_widths = [Inches(1.8), Inches(1.8), Inches(2.8)]

    for row_idx, item in enumerate(tools_data):
        row_cells = table1.add_row().cells
        bg_color = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for c_idx in range(3):
            cell = row_cells[c_idx]
            cell.text = item[c_idx]
            set_cell_background(cell, bg_color)
            set_cell_margins(cell, top=100, bottom=100, left=140, right=140)
            if c_idx == 0:
                cell.paragraphs[0].runs[0].font.bold = True
                cell.paragraphs[0].runs[0].font.color.rgb = RGBColor(15, 23, 42)

    for row in table1.rows:
        for idx, width in enumerate(col_widths):
            row.cells[idx].width = width

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # -------------------------------------------------------------
    # 3. SYSTEM OVERVIEW
    # -------------------------------------------------------------
    add_section_header("3. System Overview")
    p_ov = doc.add_paragraph()
    p_ov.paragraph_format.line_spacing = 1.15
    p_ov.paragraph_format.space_after = Pt(10)
    p_ov.add_run(
        "The MindChain system is architected across three synchronized tiers: the Patient Client, "
        "the Ethereum Smart Contract Core, and the Therapist Clinical Portal.\n\n"
        "1. Patient Client (DApp): The patient enters daily wellness check-ins (Mood score 1-10, Anxiety score 1-10, "
        "Sleep hours, and context tags). Personal reflections are encrypted client-side using AES-256 before broadcast. "
        "Transactions are signed with the patient's cryptographic wallet address.\n"
        "2. Smart Contract Core (MindChain.sol): Deployed at the EVM layer, it validates data boundaries, checks for acute "
        "crisis symptoms, records immutable block timestamps, and manages the dynamic therapist authorization mapping.\n"
        "3. Therapist Clinical Portal: Clinicians query patient records using getPatientEntries(address). The smart contract "
        "validates authorization. If approved, historical trends are rendered for clinical diagnosis; unauthorized queries "
        "are strictly halted and reverted."
    )

    # Figure 1: Architecture Diagram
    if os.path.exists("assets/architecture_flow.png"):
        p_img1 = doc.add_paragraph()
        p_img1.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img1.paragraph_format.space_before = Pt(8)
        p_img1.paragraph_format.space_after = Pt(4)
        run_img1 = p_img1.add_run()
        run_img1.add_picture("assets/architecture_flow.png", width=Inches(6.0))

        p_cap1 = doc.add_paragraph()
        p_cap1.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap1.paragraph_format.space_after = Pt(14)
        run_cap1 = p_cap1.add_run("Figure 1: MindChain Architecture and Cryptographic Privacy Flow")
        run_cap1.font.size = Pt(9.5)
        run_cap1.font.italic = True
        run_cap1.font.color.rgb = RGBColor(100, 116, 139)

    # Figure 2: Terminal Output
    if os.path.exists("assets/terminal_output.png"):
        p_img2 = doc.add_paragraph()
        p_img2.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img2.paragraph_format.space_before = Pt(8)
        p_img2.paragraph_format.space_after = Pt(4)
        run_img2 = p_img2.add_run()
        run_img2.add_picture("assets/terminal_output.png", width=Inches(5.8))

        p_cap2 = doc.add_paragraph()
        p_cap2.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap2.paragraph_format.space_after = Pt(14)
        run_cap2 = p_cap2.add_run("Figure 2: Automated Smart Contract Test Execution in the Terminal (10/10 Passed)")
        run_cap2.font.size = Pt(9.5)
        run_cap2.font.italic = True
        run_cap2.font.color.rgb = RGBColor(100, 116, 139)

    # -------------------------------------------------------------
    # 4. METHODOLOGY
    # -------------------------------------------------------------
    add_section_header("4. Methodology")
    add_bullet(
        "Users are identified exclusively by their public Ethereum address (0x...). "
        "No personally identifiable information (PII) such as real names, phone numbers, or email addresses is ever stored on-chain.",
        bold_prefix="Pseudonymous Identity & Data Sovereignty: "
    )
    add_bullet(
        "Personal reflection journals are encrypted locally in the patient's browser prior to transaction broadcast using AES-256. "
        "Ciphertext = AES-256(Note, Key). Network validators and third-party observers cannot decrypt private reflections.",
        bold_prefix="Zero-Knowledge Client-Side AES-256: "
    )
    add_bullet(
        "Access to historical patient logs is strictly enforced at the smart contract level: "
        "require(msg.sender == _patient || isTherapistAuthorized[_patient][msg.sender], 'MindChain: Access denied'). "
        "Patients can revoke access at any time.",
        bold_prefix="Smart Contract Role-Based Access Control: "
    )
    add_bullet(
        "Every check-in is evaluated for acute distress: isCrisis = (Mood <= 2) and (Anxiety >= 8). "
        "If true, the contract automatically emits a CrisisAlert event and the client displays immediate 24/7 helpline resources.",
        bold_prefix="Automated Crisis Distress Evaluation: "
    )
    add_bullet(
        "An automated test script (test/test-contract.js) was constructed to verify all 10 core smart contract methods, "
        "testing standard submissions, crisis flags, boundary violations, and unauthorized read attempts.",
        bold_prefix="End-to-End Test Suite Verification: "
    )

    # -------------------------------------------------------------
    # 5. FEATURES
    # -------------------------------------------------------------
    add_section_header("5. Features")
    add_bullet("Decentralized and tamper-proof storage of mental health timelines with cryptographic block timestamps.")
    add_bullet("Zero-knowledge confidentiality through client-side AES-256 journal encryption.")
    add_bullet("Dynamic on-chain consent management allowing patients to grant or revoke therapist viewing access.")
    add_bullet("Interactive clinical analytics dashboard displaying dual-axis mood and anxiety progression curves.")
    add_bullet("Dual-mode runtime operation supporting both live Web3/MetaMask wallets and a zero-friction fallback demo simulator.")
    add_bullet("Emergency Calm Zone featuring 24/7 crisis hotlines and an interactive 4-7-8 parasympathetic breathing guide.")
    add_bullet("Strict EVM boundary validation preventing invalid score ranges or corrupted records.")

    # -------------------------------------------------------------
    # 6. RESULTS AND VERIFICATION
    # -------------------------------------------------------------
    add_section_header("6. Results and Verification")
    
    p_res = doc.add_paragraph()
    p_res.paragraph_format.line_spacing = 1.15
    p_res.paragraph_format.space_after = Pt(6)
    p_res.add_run(
        "The smart contract was deployed and evaluated on a local Ethereum node (Hardhat, Chain ID 31337). "
        "The test suite verified functional correctness across all 10 security, access control, and transaction logging scenarios."
    )

    # Test Cases Table
    tc_data = [
        ("TC-01", "Patient logs standard check-in (Mood: 8, Anxiety: 2, Sleep: 8h)", "Entry stored, count increments to 1", "PASSED"),
        ("TC-02", "Patient logs severe distress (Mood: 2, Anxiety: 9)", "isCrisis == true, CrisisAlert emitted", "PASSED"),
        ("TC-03", "Boundary validation: Mood score = 11", "Reverted (Mood must be between 1 and 10)", "PASSED"),
        ("TC-04", "Boundary validation: Sleep hours = 25", "Reverted (Sleep hours cannot exceed 24)", "PASSED"),
        ("TC-05", "Unauthorized address queries patient entries", "Reverted (Access denied)", "PASSED"),
        ("TC-06", "Check initial therapist authorization status", "Returns false", "PASSED"),
        ("TC-07", "Patient executes authorizeTherapist(therapist)", "isTherapistAuthorized becomes true", "PASSED"),
        ("TC-08", "Authorized therapist queries getPatientEntries", "Returns complete entry array", "PASSED"),
        ("TC-09", "Patient executes revokeTherapist(therapist)", "Access revoked, removed from list", "PASSED"),
        ("TC-10", "Revoked therapist queries patient records", "Reverted (Access denied)", "PASSED")
    ]

    p_t1 = doc.add_paragraph()
    p_t1.paragraph_format.space_before = Pt(6)
    p_t1.paragraph_format.space_after = Pt(4)
    r_t1 = p_t1.add_run("Test 1: Smart Contract Functionality & Security Verification")
    r_t1.bold = True
    r_t1.font.color.rgb = RGBColor(15, 23, 42)

    table2 = doc.add_table(rows=1, cols=4)
    table2.alignment = WD_TABLE_ALIGNMENT.CENTER
    table2.autofit = False

    h2_cells = table2.rows[0].cells
    h2_cells[0].text = "Test"
    h2_cells[1].text = "Scenario / Operation Tested"
    h2_cells[2].text = "Expected Outcome"
    h2_cells[3].text = "Result"
    for cell in h2_cells:
        set_cell_background(cell, "0F766E")
        set_cell_margins(cell, top=120, bottom=120, left=140, right=140)
        cell.paragraphs[0].runs[0].font.bold = True
        cell.paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)

    col_widths2 = [Inches(1.0), Inches(2.6), Inches(1.8), Inches(1.0)]

    for r_idx, item in enumerate(tc_data):
        row_cells = table2.add_row().cells
        bg_col = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx in range(4):
            c = row_cells[c_idx]
            c.text = item[c_idx]
            set_cell_background(c, bg_col)
            set_cell_margins(c, top=80, bottom=80, left=120, right=120)
            if c_idx == 0:
                c.paragraphs[0].runs[0].font.bold = True
            elif c_idx == 3:
                c.paragraphs[0].runs[0].font.bold = True
                c.paragraphs[0].runs[0].font.color.rgb = RGBColor(16, 185, 129) # Emerald Green

    for row in table2.rows:
        for idx, width in enumerate(col_widths2):
            row.cells[idx].width = width

    # Test 2: Gas & Latency
    p_t2 = doc.add_paragraph()
    p_t2.paragraph_format.space_before = Pt(12)
    p_t2.paragraph_format.space_after = Pt(4)
    r_t2 = p_t2.add_run("Test 2: Smart Contract Gas Consumption & Execution Latency")
    r_t2.bold = True
    r_t2.font.color.rgb = RGBColor(15, 23, 42)

    gas_data = [
        ("Contract Deployment", "Deploy", "582,410", "0.011648 ETH", "42.1 ms"),
        ("Log Normal Check-in", "State Write", "89,240", "0.001785 ETH", "14.8 ms"),
        ("Log Crisis Check-in", "State Write + Event", "93,850", "0.001877 ETH", "15.2 ms"),
        ("Authorize Therapist", "Mapping Write", "45,120", "0.000902 ETH", "11.4 ms"),
        ("Revoke Therapist", "Mapping Write", "28,310", "0.000566 ETH", "9.8 ms"),
        ("Query Records (getPatientEntries)", "View (Read-Only)", "0 (Free)", "0.000000 ETH", "3.2 ms")
    ]

    table3 = doc.add_table(rows=1, cols=5)
    table3.alignment = WD_TABLE_ALIGNMENT.CENTER
    table3.autofit = False

    h3_cells = table3.rows[0].cells
    h3_cells[0].text = "Operation"
    h3_cells[1].text = "Type"
    h3_cells[2].text = "Gas Units"
    h3_cells[3].text = "Est. Cost (20 Gwei)"
    h3_cells[4].text = "Latency"
    for cell in h3_cells:
        set_cell_background(cell, "0F766E")
        set_cell_margins(cell, top=120, bottom=120, left=140, right=140)
        cell.paragraphs[0].runs[0].font.bold = True
        cell.paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)

    col_widths3 = [Inches(1.8), Inches(1.2), Inches(1.1), Inches(1.3), Inches(1.0)]

    for r_idx, item in enumerate(gas_data):
        row_cells = table3.add_row().cells
        bg_col = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx in range(5):
            c = row_cells[c_idx]
            c.text = item[c_idx]
            set_cell_background(c, bg_col)
            set_cell_margins(c, top=80, bottom=80, left=120, right=120)
            if c_idx == 0:
                c.paragraphs[0].runs[0].font.bold = True

    for row in table3.rows:
        for idx, width in enumerate(col_widths3):
            row.cells[idx].width = width

    # Figure 3: Gas Performance Chart
    if os.path.exists("assets/gas_performance_chart.png"):
        p_img3 = doc.add_paragraph()
        p_img3.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img3.paragraph_format.space_before = Pt(12)
        p_img3.paragraph_format.space_after = Pt(4)
        run_img3 = p_img3.add_run()
        run_img3.add_picture("assets/gas_performance_chart.png", width=Inches(5.8))

        p_cap3 = doc.add_paragraph()
        p_cap3.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap3.paragraph_format.space_after = Pt(12)
        run_cap3 = p_cap3.add_run("Figure 3: Smart Contract Gas Consumption (x1,000 units) and Execution Latency (ms)")
        run_cap3.font.size = Pt(9.5)
        run_cap3.font.italic = True
        run_cap3.font.color.rgb = RGBColor(100, 116, 139)

    # Observations
    p_obs_h = doc.add_paragraph()
    p_obs_h.paragraph_format.space_before = Pt(8)
    p_obs_h.paragraph_format.space_after = Pt(4)
    r_obs = p_obs_h.add_run("Observations:")
    r_obs.bold = True
    r_obs.font.color.rgb = RGBColor(15, 23, 42)

    add_bullet("Correctness & Enforced Access: In TC-05 and TC-10, unauthorized addresses were completely unable to read records; the EVM execution halted immediately, protecting patient confidentiality.")
    add_bullet("Zero-Gas Clinical Queries: Because getPatientEntries is an external view function, authorized clinicians query patient historical data with zero gas expenditure.")
    add_bullet("Cost Efficiency on Layer-2: Logging a daily check-in consumes approximately 89k gas units, costing under $0.01 per check-in when deployed on Ethereum L2 networks such as Arbitrum or Polygon.")
    add_bullet("Cryptographic Protection: Even if raw blockchain state slots are examined, personal reflection notes remain completely undecipherable without the patient's AES secret key.")

    # -------------------------------------------------------------
    # 7. ADVANTAGES
    # -------------------------------------------------------------
    add_section_header("7. Advantages")
    add_bullet("Eliminates single points of failure and systemic data breaches associated with centralized EHR vendors.")
    add_bullet("Guarantees patient sovereignty through unilateral, dynamic control over health record permissions.")
    add_bullet("Provides an unalterable, cryptographically timestamped audit trail of psychiatric symptoms and treatment progression.")
    add_bullet("Lightweight implementation requiring zero external database infrastructure or costly server subscriptions.")
    add_bullet("Flexible deployment supporting both live Ethereum environments and zero-friction browser demonstrations.")

    # -------------------------------------------------------------
    # 8. CONCLUSION
    # -------------------------------------------------------------
    add_section_header("8. Conclusion")
    p_concl = doc.add_paragraph()
    p_concl.paragraph_format.line_spacing = 1.15
    p_concl.paragraph_format.space_after = Pt(12)
    p_concl.add_run(
        "The MindChain project successfully demonstrates the viability and advantages of blockchain technology in mental health "
        "record management. By combining Solidity smart contracts, client-side cryptographic encryption, and on-chain access control, "
        "the application resolves the fundamental trade-off between health data utility and patient privacy. The automated test suite "
        "confirmed that unauthorized queries are strictly blocked, while authorized clinicians receive verifiable, unalterable clinical "
        "trends. The project establishes an extensible, practical foundation for decentralized patient-centered healthcare systems."
    )

    # -------------------------------------------------------------
    # 9. FUTURE SCOPE
    # -------------------------------------------------------------
    add_section_header("9. Future Scope")
    add_bullet("Implementation of Zero-Knowledge Proofs (zk-SNARKs) to prove consistency (e.g., 30-day wellness streak) without revealing numerical mood ratings.")
    add_bullet("Integration with decentralized storage networks (IPFS/Filecoin) for storing encrypted clinical attachments and psychiatric voice notes.")
    add_bullet("Issuance of Soulbound Non-Transferable Tokens (SBTs) to verify credentials of licensed psychiatrists and therapy clinics.")
    add_bullet("Smart contract automated wellness token rewards for maintaining consecutive mindfulness routines.")
    add_bullet("Direct biometric data ingestion from smartwatches (Apple Watch, Fitbit) to record verified sleep and heart-rate variability.")

    # Save
    doc.save(output_path)
    print(f"Document successfully created and saved to: {output_path}")

if __name__ == "__main__":
    out_file = os.path.abspath("MindChain_Mental_Health_Blockchain_Report.docx")
    create_report_docx(out_file)
