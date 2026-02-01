from pydantic import BaseModel,Field
from typing import Any, Dict, Tuple, List, Optional
from langchain_core.output_parsers import PydanticOutputParser, StrOutputParser


class SymptomModel(BaseModel):
    symptoms: List[str] = Field(
        ...,
        description=(
            "Distinct patient symptoms described by the patient. "
            "Each item MUST be one of the allowed symptom names from the provided list."
        ),
    )
    duration: Optional[str] = Field(
        None,
        description="Overall duration of the complaints, if mentioned in the text.",
    )
    red_flags: Optional[List[str]] = Field(
        default_factory=list,
        description=(
            "Any severe or emergency warning signs mentioned. "
            "If none are present, this should be an empty list."
        ),
    )
    notes: Optional[str] = Field(
        None,
        description="Additional clarifying notes, if needed.",
    )


parser = PydanticOutputParser(pydantic_object=SymptomModel)



from pydantic import BaseModel, Field
from typing import List, Optional

# MY_Final_Prompt.py
from typing import List, Optional
from pydantic import BaseModel, Field
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import PydanticOutputParser

# ---------- 1) FinalBaseModel (Pydantic v2) ----------
class FinalBaseModel(BaseModel):
    # PATIENT + INPUT SUMMARY
    user_transcript: str = Field(..., description="Full transcript of what the patient said, as extracted from audio.")
    symptoms_experienced: List[str] = Field(..., description="List of symptoms from the transcript.")
    ml_predicted_disease: str = Field(..., description="Disease predicted by the ML model before reasoning validation.")

    # MODEL PREDICTION EVALUATION
    is_model_prediction_correct: str = Field(
        ...,
        description="LLM assessment: one of ['correct','partially correct','uncertain','incorrect']. Give detailed explanation with all evidence and reasoning. Do NOT guess."
    )
    reason_if_model_correct: Optional[str] = Field(
        None,
        description="Evidence from transcript or retrieved content supporting correctness. Do NOT guess."
    )
    reason_if_model_wrong: Optional[str] = Field(
        None,
        description="Evidence or contradictions explaining why the model prediction is wrong or insufficient. Provide valid reasons and cite docs."
    )

    # LLM HYPOTHESIS + REASONING
    llm_hypothesis: str = Field(..., description="LLM-generated differential or most plausible hypothesis based on all evidence.")
    evidence_supporting_llm_hypothesis: str = Field(..., description="Explicit evidence (symptoms, document quotes, clinical logic) supporting the LLM hypothesis. Do not guess.")
    evidence_contradicting_llm_hypothesis: Optional[str] = Field(
        None, description="Any uncertainties, conflicts, or missing information that weaken the hypothesis."
    )

    # RISK ASSESSMENT + RED FLAGS
    red_flag_present: bool = Field(..., description="Whether transcript or retrieved knowledge indicates any red-flag symptoms.")
    red_flag_details: Optional[str] = Field(None, description="List and explanation of concerning symptoms requiring urgent evaluation.")

    # RECOMMENDED NEXT STEPS
    suggested_clinical_actions: str = Field(..., description="Guidance for clinicians on next steps: additional history, exam maneuvers, referrals. Provide detailed explanations.")
    suggested_tests: str = Field(..., description="Recommended investigations (broad categories only) with reasoning. No exact protocols.")
    recommended_specialist: Optional[str] = Field(None, description="If relevant, which specialty should evaluate and why (detailed).")

    # FINAL SYNTHESIS
    final_overall_assessment: str = Field(..., description="A cautious, non-definitive summary combining evidence, uncertainties, and likelihoods.")
    level_of_confidence: str = Field(..., description="Low / moderate / high, based on evidence strength, data quality, and document alignment.")
    key_uncertainties: Optional[str] = Field(None, description="What missing data prevents a definitive conclusion.")
    final_summary_bullets: List[str] = Field(..., description="5–10 bullet point summary of reasoning, evidence, risks, and recommendations.")


# ---------- 2) Prompt template ----------
# This is strict: LLM MUST output only a single JSON object matching FinalBaseModel keys.
template = """
You are a clinical decision-support assistant. You MUST NOT hallucinate, speculate, or guess.
You MUST produce a single, valid JSON object that exactly matches the schema keys listed below.
Do NOT include any commentary, explanation, or text outside the JSON object.

INPUTS (available as variables):
- Retrieved Document(s): {document}
- Extracted Symptoms: {symptoms}
- Duration: {duration}
- Red Flags: {red_flags}
- Model Hypothesis / Prediction: {disease_prediction}
- Original Transcript / User Query: {user_query}

REQUIREMENTS (read carefully):
1) Output must be valid JSON parseable to the FinalBaseModel schema. Only include fields defined in the schema.
2) For every statement of fact, you MUST reference the evidence source:
   - Either quote the retrieved document passage (include short quote) or point to "transcript" as the source.
   - For each evidence claim add a short parenthetical like: [source: transcript] or [source: doc: <short filename or metadata>].
3) Do NOT invent symptoms, tests, results, or facts not present in the transcript or retrieved documents.
4) If evidence is not available to support a claim, explicitly write: "No evidence available." for that field.
5) Keep language concise inside JSON strings; if a field requires multiple reasoning steps, present them as short numbered sentences.
6) Use the following allowed values for `is_model_prediction_correct`: "correct", "partially correct", "uncertain", "incorrect".
7) `red_flag_present` must be a boolean.
8) `level_of_confidence` must be one of: "low", "moderate", "high".
9) `final_summary_bullets` should be a list of 5–10 short strings (bullet-like).

SCHEMA (field order and exact keys required):
{
  "user_transcript": string,
  "symptoms_experienced": [string],
  "ml_predicted_disease": string,
  "is_model_prediction_correct": string,
  "reason_if_model_correct": string | null,
  "reason_if_model_wrong": string | null,
  "llm_hypothesis": string,
  "evidence_supporting_llm_hypothesis": string,
  "evidence_contradicting_llm_hypothesis": string | null,
  "red_flag_present": boolean,
  "red_flag_details": string | null,
  "suggested_clinical_actions": string,
  "suggested_tests": string,
  "recommended_specialist": string | null,
  "final_overall_assessment": string,
  "level_of_confidence": string,
  "key_uncertainties": string | null,
  "final_summary_bullets": [string]
}

Now produce only the JSON object described above. Do NOT add anything else outside the JSON.
"""

# ---------- 3) PromptTemplate object ----------
final_prompt_template = PromptTemplate(
    input_variables=["document", "symptoms", "duration", "red_flags", "disease_prediction", "user_query"],
    template=template.strip()
)

# ---------- 4) PydanticOutputParser (recommended) ----------
# Use this to validate and parse the model output directly into FinalBaseModel.
parser_final = PydanticOutputParser(pydantic_object=FinalBaseModel)

# Usage example (in your pipeline):
# final_chain = final_prompt_template | llm | parser
# final_model: FinalBaseModel = final_chain.invoke({ ... })
# OR: raw = (final_prompt_template | llm).invoke({...}); final_model = parser.parse_result(raw)
