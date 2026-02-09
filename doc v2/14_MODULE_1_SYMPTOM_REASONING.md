# Deep Dive: Module 1 (Clinical Advisory Reasoning Engine)

## 1. Introduction: The CARL Architecture
Module 1 has evolved from a simple symptom extractor into the **Clinical Advisory Reasoning Layer (CARL)**. It is no longer just a "Double-Check" mechanism; it is a structured decision-support system designed to empower clinicians with evidence-bound reasoning.

The system operates on a **Triadic Evidence Model**:
1.  **Primary Evidence**: Verbatim patient audio transcripts (via Whisper).
2.  **Inference Signals**: Statistical hypotheses from the multi-bucket classifier and anomaly detectors.
3.  **External Authority**: Admin-curated medical knowledge stored in a versioned Vector Database.

This architecture ensures that the AI never "guesses"—every claim must be tethered to a specific transcript phrase or a verified clinical document.

---

## 2. Stage 1: Front-End Ingestion & Transcription
The system starts with the raw patient voice, ensuring the "Ground Truth" remains untainted by manual entry errors.

### A. Web Audio Ingestion
- **Source**: Secure high-fidelity recording via the Patient Portal.
- **Storage**: Audio is saved to `/audio_store/{user_id}/{timestamp}.wav` with associated database metadata for full auditability.

### B. High-Fidelity Transcription (Whisper)
- **Model**: OpenAI's `Whisper-Base`.
- **Process**: Converts raw audio into an immutable JSON transcript.
- **Constraint**: This transcript becomes the "Single Source of Truth." Any downstream advice MUST reference phrases from this text.

---

## 3. Stage 2: Symptom Normalization (`MY_Prompt.py`)
Patients describe symptoms loosely. CARL normalizes this into a structured schema using an ontology-constrained prompt.

1.  **Ontology Enforcement**: The system maps loose descriptions (e.g., *"head spinning"*) to clinical terms (e.g., `Vertigo`).
2.  **Pydantic Validation**: The output is force-validated against a 500-term medical list. If the model hallucinates a term not in the list, the system rejects the output and triggers a re-normalization loop.

**Structured Output Example**:
```json
{
  "symptoms": ["vertigo", "tinnitus", "nausea"],
  "duration": "subacute",
  "red_flags": ["sudden hearing loss"]
}
```

---

## 4. Stage 3: Statistical Signal Generation
Before reasoning begins, the system generates mathematical "hints" using a hierarchical classification system.

### A. Anomaly Detection (Autoencoders)
- The symptom vector is passed through **7 Discrete Anomaly Buckets** (Most Common to Ultra Rare).
- **The Filter**: If the statistical reconstruction error for a bucket is too high, it is rejected. This prevents the "Common Disease Bias" where the system ignores rare symptoms to satisfy common patterns.

### B. Latent Distance Metrics
- The system calculates the **Latent Distance** between the patient vector and the prototypical cluster for a disease pattern.
- This numeric value is used to express **Uncertainty** in the final report.

---

## 5. Stage 4: The Clinical Advisory Question Engine
This is the heart of CARL. Instead of providing a "diagnosis," the system answers 18 clinician-oriented questions using a **Retrieval-Augmented Generation (RAG)** loop.

### A. The Knowledge Authority (Admin Vector Store)
Unlike generic AI, CARL is restricted:
- **Zero-Memory Policy**: It cannot use its internal training data for medical facts.
- **Admin Ingestion**: Only documents uploaded by the Admin (Guidelines, Journals, Daily Updates) are used as evidence.
- **RAG Pipeline**: PDF/Text -> Semantic Chunking -> `bge-m3` Embeddings -> Namespaced Vector Store.

### B. The 18 Advisory Questions
For every case, the system iterates through 18 questions across 7 categories:

| Category | Description | Key Questions |
| :--- | :--- | :--- |
| **A. Contextual** | Non-disease factors | Benign explanations, Lifestyle, Medication effects. |
| **B. Edge Cases** | Atypical patterns | Early-stage conditions, Rare but high-impact risks. |
| **C. Domain Mapping**| System grouping | Cardiac vs. Neuro vs. Endocrine overlapping. |
| **D. Safety** | Critical exclusion | Red Flags, Concerning progressions. |
| **E. Strategy** | Diagnostic logic | Optimal first tests, Deferrable tests. |
| **F. Next Actions** | Clinical path | Feasible next steps, Branching decision points. |
| **G. Uncertainty** | Risk Disclosure | Underlying assumptions, Areas of highest doubt. |

---

## 6. Stage 5: The Evidence-Bound Answering Template
Every question is answered using a strict, auditable 4-section template. Failure to follow this template results in a system rejection.

### The Template Contract:
1.  **Transcript Evidence**: *"The patient reports [Quote] in the transcript."*
2.  **Knowledge Reference**: *"According to [Admin Doc Name, Date], [Guideline statement]."*
3.  **Reasoned Interpretation**: *"Given the presence of [X], this possibility is considered [Plausible/Unlikely]."*
4.  **Uncertainty Statement**: *"This interpretation is limited by [Missing context, e.g., missing vitals]."*

---

## 7. Technical Specifications
- **Reasoning Model**: `biomistral-advisor` / `MedGemma 1.5`.
- **Retrieval Engine**: `BAAI/bge-m3` with ChromaDB.
- **Response Validation**: Strict JSON-schema enforcement for the 18-question loop.
- **Ethical Bound**: Non-diagnostic, non-prescriptive.

---

## 8. Summary of Data Flow
| Audio | -> | Transcript | -> | Symptoms | -> | Anomaly Signal | -> | RAG Advisory | -> | Doctor UI |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Raw | -> | Verbatim | -> | Normalized | -> | Statistical | -> | Question Loop | -> | Advisory Report |

This pipeline ensures that every "thought" the AI has is visible, citable, and ultimately controlled by the Human Admin who manages the knowledge base.
