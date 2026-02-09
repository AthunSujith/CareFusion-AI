# CARL Clinical Advisory Question Set
# Categories A-G (18 Total)

CARL_QUESTIONS = [
    {
        "category": "A",
        "category_name": "NON-DISEASE & CONTEXTUAL FACTORS",
        "questions": [
            {"id": "Q1", "text": "What benign or non-pathological explanations could account for these symptoms?"},
            {"id": "Q2", "text": "Could lifestyle, environment, or recent events plausibly explain these symptoms?"},
            {"id": "Q3", "text": "Are there medication, supplement, or substance-related effects suggested by the transcript?"},
        ]
    },
    {
        "category": "B",
        "category_name": "EDGE CASES & ATYPICAL PRESENTATIONS",
        "questions": [
            {"id": "Q4", "text": "What atypical or early-stage conditions are known to present with this symptom pattern?"},
            {"id": "Q5", "text": "Are there age- or sex-specific atypical presentations to consider?"},
            {"id": "Q6", "text": "Are there rare but high-impact possibilities that should not be missed?"},
        ]
    },
    {
        "category": "C",
        "category_name": "DISEASE DOMAIN MAPPING (NOT DIAGNOSIS)",
        "questions": [
            {"id": "Q7", "text": "Which disease categories are commonly associated with this symptom cluster?"},
            {"id": "Q8", "text": "Are multiple disease domains overlapping based on the symptom combination?"},
            {"id": "Q9", "text": "Which domains are less supported by the current symptom evidence?"},
        ]
    },
    {
        "category": "D",
        "category_name": "SAFETY & RED FLAGS",
        "questions": [
            {"id": "Q10", "text": "Are there red-flag features that require immediate exclusion or escalation?"},
            {"id": "Q11", "text": "Are there contradictions or concerning symptom progressions over time?"},
        ]
    },
    {
        "category": "E",
        "category_name": "DIAGNOSTIC STRATEGY",
        "questions": [
            {"id": "Q12", "text": "What initial diagnostic tests would most efficiently reduce uncertainty?"},
            {"id": "Q13", "text": "What tests should be deferred unless initial findings justify them?"},
            {"id": "Q14", "text": "Are there tests that may appear relevant but are not currently indicated?"},
        ]
    },
    {
        "category": "F",
        "category_name": "NEXT CLINICAL ACTIONS",
        "questions": [
            {"id": "Q15", "text": "What is the most feasible next clinical step based on current evidence?"},
            {"id": "Q16", "text": "What findings would change the clinical direction most significantly?"},
            {"id": "Q17", "text": "If initial tests are normal, what alternative explanations should be reconsidered?"},
        ]
    },
    {
        "category": "G",
        "category_name": "UNCERTAINTY & ASSUMPTIONS",
        "questions": [
            {"id": "Q18", "text": "What assumptions underlie this analysis, and where is uncertainty highest?"},
        ]
    }
]

def get_flattened_questions():
    flat_list = []
    for cat in CARL_QUESTIONS:
        for q in cat["questions"]:
            flat_list.append({
                "category_id": cat["category"],
                "category_name": cat["category_name"],
                "question_id": q["id"],
                "question_text": q["text"]
            })
    return flat_list
