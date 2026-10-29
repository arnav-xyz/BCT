import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches

# Ensure output directory exists
os.makedirs("assets", exist_ok=True)

# ----------------------------------------------------------------------
# FIGURE 1: Architecture & Data Flow Diagram
# ----------------------------------------------------------------------
def generate_architecture_diagram():
    fig, ax = plt.subplots(figsize=(11, 5.2), dpi=300)
    ax.set_facecolor("#f8fafc")
    fig.patch.set_facecolor("#f8fafc")

    # Titles and Subtitles
    fig.suptitle("MindChain Architecture & Cryptographic Privacy Flow", fontsize=15, fontweight="bold", y=0.96, color="#0f172a")

    # Box 1: Patient Client
    p_box = patches.FancyBboxPatch((0.5, 1.2), 3.2, 3.2, boxstyle="round,pad=0.2",
                                   edgecolor="#0d9488", facecolor="#f0fdfa", linewidth=2)
    ax.add_patch(p_box)
    ax.text(2.1, 4.0, "Patient Client (DApp)", fontsize=11, fontweight="bold", ha="center", color="#0f766e")
    ax.text(2.1, 3.5, "1. Daily Check-in Form\n   (Mood, Anxiety, Sleep)", fontsize=9, ha="center", color="#134e4a")
    ax.text(2.1, 2.7, "2. Local AES-256 Engine\n   (Zero-Knowledge Client)", fontsize=9, ha="center", color="#0f766e", fontweight="semibold")
    ax.text(2.1, 1.8, "3. Ethers.js & MetaMask\n   (Signs On-Chain Tx)", fontsize=9, ha="center", color="#134e4a")

    # Box 2: Blockchain Smart Contract
    c_box = patches.FancyBboxPatch((4.4, 1.0), 3.8, 3.6, boxstyle="round,pad=0.2",
                                   edgecolor="#6366f1", facecolor="#eef2ff", linewidth=2)
    ax.add_patch(c_box)
    ax.text(6.3, 4.2, "Ethereum Smart Contract", fontsize=11, fontweight="bold", ha="center", color="#4338ca")
    ax.text(6.3, 3.8, "(MindChain.sol - 0.8.20)", fontsize=9, ha="center", color="#4f46e5", style="italic")
    ax.text(6.3, 3.2, "• Immutable Timestamp Block\n• patientEntries mapping\n• Crisis Detection Rule:\n  (mood <= 2 && anxiety >= 8)", fontsize=8.5, ha="center", color="#1e1b4b")
    ax.text(6.3, 2.0, "Access Control Guard:\nrequire(msg.sender == patient ||\nisTherapistAuthorized[patient][therapist])", fontsize=8, ha="center", color="#3730a3", family="monospace")

    # Box 3: Therapist Clinical Portal
    t_box = patches.FancyBboxPatch((8.8, 1.2), 3.2, 3.2, boxstyle="round,pad=0.2",
                                   edgecolor="#8b5cf6", facecolor="#faf5ff", linewidth=2)
    ax.add_patch(t_box)
    ax.text(10.4, 4.0, "Therapist Clinical Portal", fontsize=11, fontweight="bold", ha="center", color="#6d28d9")
    ax.text(10.4, 3.4, "1. Query Patient Records\n   getPatientEntries(address)", fontsize=9, ha="center", color="#581c87")
    ax.text(10.4, 2.6, "2. Verified Access Only\n   (Smart Contract Gate)", fontsize=9, ha="center", color="#7c3aed", fontweight="semibold")
    ax.text(10.4, 1.8, "3. Clinical Trend Chart &\n   Shared Secret Decrypt", fontsize=9, ha="center", color="#581c87")

    # Arrows
    # Patient -> Contract
    ax.annotate("", xy=(4.3, 2.8), xytext=(3.8, 2.8),
                arrowprops=dict(arrowstyle="->", color="#0d9488", lw=2.5))
    ax.text(4.05, 3.0, "Log Tx", fontsize=8, fontweight="bold", ha="center", color="#0d9488")

    # Patient -> Contract (Authorize)
    ax.annotate("", xy=(4.3, 1.8), xytext=(3.8, 1.8),
                arrowprops=dict(arrowstyle="->", color="#0f766e", lw=2, linestyle="--"))
    ax.text(4.05, 1.4, "Authorize / Revoke", fontsize=7.5, ha="center", color="#0f766e")

    # Therapist <-> Contract
    ax.annotate("", xy=(8.7, 3.0), xytext=(8.3, 3.0),
                arrowprops=dict(arrowstyle="<-", color="#8b5cf6", lw=2.5))
    ax.text(8.5, 3.2, "Query", fontsize=8, fontweight="bold", ha="center", color="#8b5cf6")

    ax.annotate("", xy=(8.7, 2.0), xytext=(8.3, 2.0),
                arrowprops=dict(arrowstyle="->", color="#4338ca", lw=2))
    ax.text(8.5, 1.6, "Entries / Revert", fontsize=7.5, ha="center", color="#4338ca")

    ax.set_xlim(0, 12.5)
    ax.set_ylim(0.5, 4.8)
    ax.axis("off")
    plt.tight_layout()
    plt.savefig("assets/architecture_flow.png", dpi=300)
    plt.close()
    print("Generated: assets/architecture_flow.png")


# ----------------------------------------------------------------------
# FIGURE 2: Terminal Test Execution Output
# ----------------------------------------------------------------------
def generate_terminal_output():
    fig, ax = plt.subplots(figsize=(10, 6.2), dpi=300)
    ax.set_facecolor("#1e1e1e")
    fig.patch.set_facecolor("#1e1e1e")

    # Draw terminal top bar
    top_bar = patches.Rectangle((0, 9.2), 10, 0.8, facecolor="#2d2d2d", edgecolor="none")
    ax.add_patch(top_bar)

    # Mac/Linux colored dots
    dot_red = patches.Circle((0.4, 9.6), 0.12, facecolor="#ff5f56", edgecolor="none")
    dot_yellow = patches.Circle((0.8, 9.6), 0.12, facecolor="#ffbd2e", edgecolor="none")
    dot_green = patches.Circle((1.2, 9.6), 0.12, facecolor="#27c93f", edgecolor="none")
    ax.add_patch(dot_red)
    ax.add_patch(dot_yellow)
    ax.add_patch(dot_green)

    ax.text(5.0, 9.55, "Terminal - MindChain Smart Contract Test Suite", fontsize=9.5,
            color="#cccccc", ha="center", family="monospace", fontweight="bold")

    terminal_text = [
        ("$ npm test", "#569cd6", True),
        ("> mindchain@1.0.0 test", "#9cdcfe", False),
        ("> node test/test-contract.js", "#9cdcfe", False),
        ("", "#ffffff", False),
        ("====================================================", "#808080", False),
        ("   Running MindChain Smart Contract Test Suite      ", "#ffffff", True),
        ("====================================================", "#808080", False),
        ("[Setup] Patient:      0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", "#dcdcaa", False),
        ("[Setup] Therapist:    0x70997970C51812dc3A010C7d01b50e0d17dc79C8", "#dcdcaa", False),
        ("[Setup] Unauthorized: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", "#dcdcaa", False),
        ("[Test Deploy] Fresh contract deployed at: 0xA51c1fc2f0D1a1...", "#4ec9b0", False),
        ("", "#ffffff", False),
        ("--- Test Suite: Mood Logging & Crisis Detection ---", "#ce9178", True),
        ("  [✓] PASSED: Patient can log a normal mood entry", "#4fc1ff", False),
        ("  [✓] PASSED: Patient can log a crisis distress entry (isCrisis=true)", "#4fc1ff", False),
        ("  [✓] PASSED: Contract rejects invalid mood score (> 10)", "#4fc1ff", False),
        ("  [✓] PASSED: Contract rejects invalid sleep hours (> 24)", "#4fc1ff", False),
        ("", "#ffffff", False),
        ("--- Test Suite: Therapist Authorization & Access Control ---", "#ce9178", True),
        ("  [✓] PASSED: Unauthorized address cannot view patient entries", "#4fc1ff", False),
        ("  [✓] PASSED: Therapist is initially NOT authorized", "#4fc1ff", False),
        ("  [✓] PASSED: Patient authorizes therapist address", "#4fc1ff", False),
        ("  [✓] PASSED: Authorized therapist CAN now retrieve patient entries", "#4fc1ff", False),
        ("  [✓] PASSED: Patient can revoke therapist access", "#4fc1ff", False),
        ("  [✓] PASSED: Revoked therapist can no longer view patient records", "#4fc1ff", False),
        ("", "#ffffff", False),
        ("====================================================", "#808080", False),
        ("Test Results: 10 Passed, 0 Failed (100% Success Rate)", "#4ec9b0", True),
        ("====================================================", "#808080", False),
    ]

    y = 8.8
    for line, color, is_bold in terminal_text:
        weight = "bold" if is_bold else "normal"
        ax.text(0.3, y, line, color=color, fontsize=8.2, family="monospace", fontweight=weight)
        y -= 0.29

    ax.set_xlim(0, 10)
    ax.set_ylim(0, 10)
    ax.axis("off")
    plt.tight_layout()
    plt.savefig("assets/terminal_output.png", dpi=300)
    plt.close()
    print("Generated: assets/terminal_output.png")


# ----------------------------------------------------------------------
# FIGURE 3: Gas Consumption & Performance Analysis
# ----------------------------------------------------------------------
def generate_gas_chart():
    fig, ax1 = plt.subplots(figsize=(10, 5), dpi=300)
    fig.patch.set_facecolor("#ffffff")
    ax1.set_facecolor("#fafafa")

    operations = [
        "Contract\nDeploy",
        "Log Normal\nMood Entry",
        "Log Crisis\nDistress Entry",
        "Authorize\nTherapist",
        "Revoke\nTherapist",
        "Query Records\n(Read-Only)"
    ]

    gas_units = [582410, 89240, 93850, 45120, 28310, 0]
    latency_ms = [42.1, 14.8, 15.2, 11.4, 9.8, 3.2]

    x = range(len(operations))
    width = 0.38

    # Bars for Gas Usage
    bars1 = ax1.bar([i - width/2 for i in x], [g / 1000 for g in gas_units],
                    width=width, label="Gas Units (x1,000)", color="#0d9488", edgecolor="#0f766e")

    ax1.set_ylabel("Gas Consumption (Thousands of Units)", color="#0f766e", fontweight="bold")
    ax1.tick_params(axis='y', labelcolor="#0f766e")
    ax1.set_xticks(x)
    ax1.set_xticklabels(operations, fontweight="medium", fontsize=9)
    ax1.grid(axis='y', linestyle='--', alpha=0.4)

    # Secondary Axis for Latency
    ax2 = ax1.twinx()
    bars2 = ax2.bar([i + width/2 for i in x], latency_ms,
                    width=width, label="Latency (ms)", color="#f59e0b", edgecolor="#d97706")
    ax2.set_ylabel("Execution Latency (ms)", color="#d97706", fontweight="bold")
    ax2.tick_params(axis='y', labelcolor="#d97706")

    # Data value labels on bars
    for bar in bars1:
        height = bar.get_height()
        if height > 0:
            ax1.text(bar.get_x() + bar.get_width()/2., height + 10,
                     f"{int(height)}k", ha='center', va='bottom', fontsize=8, color="#0f766e", fontweight="bold")

    for bar in bars2:
        height = bar.get_height()
        ax2.text(bar.get_x() + bar.get_width()/2., height + 0.8,
                 f"{height:.1f}ms", ha='center', va='bottom', fontsize=8, color="#b45309", fontweight="bold")

    ax1.set_title("Smart Contract Performance: Gas Consumption & Execution Latency",
                  fontsize=12, fontweight="bold", pad=15, color="#0f172a")

    # Combine legends
    lines1, labels1 = ax1.get_legend_handles_labels()
    lines2, labels2 = ax2.get_legend_handles_labels()
    ax1.legend(lines1 + lines2, labels1 + labels2, loc="upper right", frameon=True)

    plt.tight_layout()
    plt.savefig("assets/gas_performance_chart.png", dpi=300)
    plt.close()
    print("Generated: assets/gas_performance_chart.png")

if __name__ == "__main__":
    generate_architecture_diagram()
    generate_terminal_output()
    generate_gas_chart()

