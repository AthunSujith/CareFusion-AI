"""
Module 4: Temporal Disease Progression & Relationship Analysis
Analyzes structured patient history to detect progression patterns and temporal relationships.
"""

import json
import sys
import os
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional
from collections import defaultdict
import re


class MedicalEvent:
    """Represents a single medical event in the patient timeline"""
    
    def __init__(self, timestamp: datetime, event_type: str, data: Dict[str, Any], 
                 severity: str = "unknown", confidence: float = 0.0):
        self.timestamp = timestamp
        self.event_type = event_type  # symptom, image, dna, test, diagnosis
        self.data = data
        self.severity = severity
        self.confidence = confidence
    
    def __repr__(self):
        return f"MedicalEvent({self.timestamp.date()}, {self.event_type}, severity={self.severity})"


class PatientTimeline:
    """Manages chronological medical events for a patient"""
    
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.events: List[MedicalEvent] = []
        self.symptoms_over_time = defaultdict(list)
        self.diagnoses_over_time = []
        
    def add_event(self, event: MedicalEvent):
        """Add event and maintain chronological order"""
        self.events.append(event)
        self.events.sort(key=lambda e: e.timestamp)
        
    def get_events_in_range(self, start: datetime, end: datetime) -> List[MedicalEvent]:
        """Get events within a time range"""
        return [e for e in self.events if start <= e.timestamp <= end]
    
    def get_recent_events(self, days: int = 90) -> List[MedicalEvent]:
        """Get events from the last N days"""
        cutoff = datetime.now()
        from datetime import timedelta
        start = cutoff - timedelta(days=days)
        return self.get_events_in_range(start, cutoff)


class TemporalAnalyzer:
    """Core temporal reasoning engine"""
    
    def __init__(self, user_data_root: str):
        self.user_data_root = Path(user_data_root)
        
    def load_patient_history(self, user_id: str) -> PatientTimeline:
        """Load all historical data and build timeline"""
        timeline = PatientTimeline(user_id)
        user_path = self.user_data_root / user_id
        
        if not user_path.exists():
            return timeline
        
        # Load Module 1 (Symptom) analyses
        analysis_path = user_path / "analysis"
        if analysis_path.exists():
            for file in analysis_path.glob("analysis_module1_*.json"):
                try:
                    with open(file, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        timestamp = datetime.fromisoformat(data.get('timestamp', ''))
                        
                        output = data.get('analysis_output', {})
                        symptoms = output.get('symptoms', [])
                        recommendation = output.get('recommendation', {})
                        
                        event = MedicalEvent(
                            timestamp=timestamp,
                            event_type='symptom_analysis',
                            data={
                                'symptoms': symptoms,
                                'disease': recommendation.get('disease'),
                                'confidence': recommendation.get('confidence', 0),
                                'bucket': recommendation.get('bucket')
                            },
                            severity=recommendation.get('bucket', 'unknown'),
                            confidence=recommendation.get('confidence', 0)
                        )
                        timeline.add_event(event)
                        
                        # Track symptoms
                        for symptom in symptoms:
                            timeline.symptoms_over_time[symptom].append(timestamp)
                            
                except Exception as e:
                    print(f"Error loading {file}: {e}", file=sys.stderr)
        
        # Load Module 2 (Image) analyses
        if analysis_path.exists():
            for file in analysis_path.glob("analysis_module2_*.json"):
                try:
                    with open(file, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        timestamp = datetime.fromisoformat(data.get('timestamp', ''))
                        
                        output = data.get('analysis_output', {})
                        prediction = output.get('prediction', 'UNKNOWN')
                        probability = output.get('probability', 0)
                        
                        severity = 'high' if prediction == 'TUBERCULOSIS' else 'low'
                        
                        event = MedicalEvent(
                            timestamp=timestamp,
                            event_type='image_analysis',
                            data={
                                'prediction': prediction,
                                'probability': probability,
                                'model': 'WSL-DenseNet121'
                            },
                            severity=severity,
                            confidence=probability
                        )
                        timeline.add_event(event)
                        
                except Exception as e:
                    print(f"Error loading {file}: {e}", file=sys.stderr)
        
        # Load Module 3 (DNA) analyses
        if analysis_path.exists():
            for file in analysis_path.glob("analysis_module3_*.json"):
                try:
                    with open(file, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        timestamp = datetime.fromisoformat(data.get('timestamp', ''))
                        
                        output = data.get('analysis_output', {})
                        findings = output.get('genetic_findings', [])
                        
                        pathogenic_count = sum(1 for f in findings if f.get('clinical_significance') == 'Pathogenic')
                        severity = 'high' if pathogenic_count > 0 else 'low'
                        
                        event = MedicalEvent(
                            timestamp=timestamp,
                            event_type='dna_analysis',
                            data={
                                'pathogenic_variants': pathogenic_count,
                                'total_variants': len(findings),
                                'summary': output.get('summary')
                            },
                            severity=severity,
                            confidence=0.9
                        )
                        timeline.add_event(event)
                except Exception as e:
                    print(f"Error loading DNA: {e}", file=sys.stderr)

        # --- NEW: Load External Lab Reports and Documents ---
        for folder in ["lab_reports", "documents"]:
            doc_path = user_path / folder
            if doc_path.exists():
                for file in doc_path.glob("*"):
                    if file.is_file():
                        # Use file modification time as timestamp since we don't have metadata yet
                        mtime = datetime.fromtimestamp(os.path.getmtime(file))
                        
                        event = MedicalEvent(
                            timestamp=mtime,
                            event_type='external_document',
                            data={
                                'filename': file.name,
                                'folder': folder,
                                'description': f"External {folder.replace('_', ' ')}"
                            },
                            severity='unknown',
                            confidence=0.5
                        )
                        timeline.add_event(event)

        return timeline
    
    def detect_progression_patterns(self, timeline: PatientTimeline, new_observation: str = "") -> Dict[str, Any]:
        """Detect temporal patterns and historical disease relations in patient history"""
        patterns = {
            'symptom_persistence': [],
            'symptom_escalation': [],
            'recurring_cycles': [],
            'diagnostic_gaps': [],
            'disease_relations': [],
            'risk_trajectory': 'stable'
        }
        
        # --- NEW: Disease Correlation Analysis ---
        if new_observation:
            past_diseases = set()
            for event in timeline.events:
                # Extract disease name from various data formats
                disease = event.data.get('disease') or event.data.get('prediction') or event.data.get('summary')
                if disease and disease.upper() != 'UNKNOWN' and disease.upper() != 'NORMAL':
                    past_diseases.add((disease, event.event_type, event.timestamp))

            for disease_name, event_type, timestamp in past_diseases:
                # Check for mention or semantic relation (simple keyword for now)
                if disease_name.lower() in new_observation.lower() or any(word in new_observation.lower() for word in disease_name.lower().split()):
                    patterns['disease_relations'].append({
                        'disease': disease_name,
                        'related_event_type': event_type.replace('_', ' ').title(),
                        'original_date': timestamp.strftime('%Y-%m-%d'),
                        'context': f"Historical record from {timestamp.year} shows {disease_name}. Current observation may indicate recurrence or secondary complication."
                    })

        # Analyze symptom persistence
        for symptom, timestamps in timeline.symptoms_over_time.items():
            if len(timestamps) >= 2:
                duration_days = (timestamps[-1] - timestamps[0]).days
                if duration_days > 30:
                    patterns['symptom_persistence'].append({
                        'symptom': symptom,
                        'duration_days': duration_days,
                        'occurrences': len(timestamps),
                        'first_seen': timestamps[0].isoformat(),
                        'last_seen': timestamps[-1].isoformat()
                    })
        
        # Analyze severity escalation
        recent_events = timeline.get_recent_events(days=180)
        severity_map = {'low': 1, 'medium': 2, 'high': 3, 'critical': 4}
        
        if len(recent_events) >= 2:
            severity_scores = [severity_map.get(e.severity, 0) for e in recent_events]
            if len(severity_scores) >= 2:
                if severity_scores[-1] > severity_scores[0]:
                    patterns['symptom_escalation'].append({
                        'trend': 'increasing',
                        'from': recent_events[0].severity,
                        'to': recent_events[-1].severity,
                        'timespan_days': (recent_events[-1].timestamp - recent_events[0].timestamp).days
                    })
                    patterns['risk_trajectory'] = 'increasing'
                elif severity_scores[-1] < severity_scores[0]:
                    patterns['risk_trajectory'] = 'decreasing'
        
        # Detect diagnostic gaps
        symptom_events = [e for e in timeline.events if e.event_type == 'symptom_analysis']
        image_events = [e for e in timeline.events if e.event_type == 'image_analysis']
        
        if len(symptom_events) > 0 and len(image_events) == 0:
            patterns['diagnostic_gaps'].append({
                'type': 'missing_imaging',
                'recommendation': 'Consider medical imaging for persistent symptoms'
            })
        
        return patterns
    
    def analyze_new_observation(self, timeline: PatientTimeline, new_observation: str) -> Dict[str, Any]:
        """Analyze how new observation fits into patient history"""
        
        # Create a new event for the observation
        new_event = MedicalEvent(
            timestamp=datetime.now(),
            event_type='doctor_observation',
            data={'observation': new_observation},
            severity='unknown',
            confidence=1.0
        )
        
        # Detect patterns
        patterns = self.detect_progression_patterns(timeline, new_observation)
        
        # Calculate risk changes
        risk_analysis = self._calculate_risk_changes(timeline, new_observation, patterns)
        
        # Generate explanation
        explanation = self._generate_explanation(timeline, new_observation, patterns, risk_analysis)
        
        return {
            'temporal_findings': patterns,
            'risk_analysis': risk_analysis,
            'explanation': explanation,
            'timeline_summary': {
                'total_events': len(timeline.events),
                'event_types': self._count_event_types(timeline),
                'timespan_days': self._calculate_timespan(timeline)
            },
            'timeline_events': [
                {
                    'date': e.timestamp.strftime('%Y-%m-%d'),
                    'event_type': e.event_type.replace('_', ' ').title(),
                    'summary': e.data.get('disease') or e.data.get('prediction') or e.data.get('observation', 'Event'),
                    'risk_level': e.severity
                } for e in timeline.events
            ]
        }
    
    def _count_event_types(self, timeline: PatientTimeline) -> Dict[str, int]:
        """Count events by type"""
        counts = defaultdict(int)
        for event in timeline.events:
            counts[event.event_type] += 1
        return dict(counts)
    
    def _calculate_timespan(self, timeline: PatientTimeline) -> int:
        """Calculate total timespan of patient history"""
        if len(timeline.events) < 2:
            return 0
        return (timeline.events[-1].timestamp - timeline.events[0].timestamp).days
    
    def _calculate_risk_changes(self, timeline: PatientTimeline, observation: str, patterns: Dict) -> Dict[str, Any]:
        """Calculate how risk has changed"""
        
        risk_factors = []
        overall_risk = 'moderate'
        
        # Check for persistent symptoms
        if len(patterns['symptom_persistence']) > 0:
            risk_factors.append({
                'factor': 'Persistent symptoms detected',
                'impact': 'increases_risk',
                'details': f"{len(patterns['symptom_persistence'])} symptoms persisting over time"
            })
        
        # Check for escalation
        if len(patterns['symptom_escalation']) > 0:
            risk_factors.append({
                'factor': 'Symptom severity escalation',
                'impact': 'increases_risk',
                'details': 'Severity trending upward over time'
            })
            overall_risk = 'elevated'
        
        # Check for diagnostic gaps
        if len(patterns['diagnostic_gaps']) > 0:
            risk_factors.append({
                'factor': 'Incomplete diagnostic workup',
                'impact': 'uncertainty',
                'details': 'Additional tests may be warranted'
            })
        
        return {
            'overall_risk_level': overall_risk,
            'risk_trajectory': patterns['risk_trajectory'],
            'risk_factors': risk_factors,
            'confidence': 0.75
        }
    
    def _generate_explanation(self, timeline: PatientTimeline, observation: str, 
                            patterns: Dict, risk_analysis: Dict) -> str:
        """Generate human-readable explanation using LLM if available, otherwise fallback"""
        
        # Try LLM Summary first
        llm_summary = self._generate_llm_summary(timeline, observation, patterns, risk_analysis)
        if llm_summary:
            return llm_summary

        # Fallback to template-based summary
        lines = []
        lines.append("### CLINICAL PROGRESSION SUMMARY")
        lines.append("")
        
        # Timeline overview
        if len(timeline.events) > 0:
            first_event = timeline.events[0]
            last_event = timeline.events[-1]
            timespan = (last_event.timestamp - first_event.timestamp).days
            
            lines.append(f"**Historical Span:** {timespan} days across {len(timeline.events)} diagnostic events.")
            lines.append(f"**Observation Period:** {first_event.timestamp.strftime('%Y-%m-%d')} to {last_event.timestamp.strftime('%Y-%m-%d')}")
            lines.append("")
        
        # New observation context
        lines.append("### NEW OBSERVATION CONTEXT")
        lines.append(f"Current Input: *{observation}*")
        lines.append("")
        
        # Detected patterns
        if patterns['symptom_persistence']:
            lines.append("### PERSISTENT CLINICAL PATTERNS")
            for p in patterns['symptom_persistence']:
                lines.append(f"• **{p['symptom'].title()}**: Persistent over {p['duration_days']} days ({p['occurrences']} documented occurrences).")
            lines.append("")
        
        if patterns['disease_relations']:
            lines.append("### HISTORICAL DISEASE CORRELATIONS")
            for rel in patterns['disease_relations']:
                lines.append(f"• **{rel['disease']}**: {rel['context']} (Matched from {rel['original_date']} record)")
            lines.append("")

        if patterns['symptom_escalation']:
            lines.append("### SEVERITY ESCALATION DETECTED")
            for e in patterns['symptom_escalation']:
                lines.append(f"• Disease trajectory shows **{e['trend']} severity** (from {e['from']} to {e['to']}) over a {e['timespan_days']}-day interval.")
            lines.append("")
        
        if patterns['diagnostic_gaps']:
            lines.append("### CLINICAL RECOMMENDATIONS")
            for gap in patterns['diagnostic_gaps']:
                lines.append(f"• {gap['recommendation']}")
            lines.append("")
        
        # Risk assessment
        lines.append("### RISK TRAJECTORY ANALYSIS")
        lines.append(f"**Overall Status:** {risk_analysis['overall_risk_level'].upper()}")
        lines.append(f"**Calculated Trajectory:** {risk_analysis['risk_trajectory'].upper()}")
        lines.append("")
        
        if risk_analysis['risk_factors']:
            lines.append("**Primary Risk Drivers:**")
            for factor in risk_analysis['risk_factors']:
                lines.append(f"• {factor['factor']} — {factor['details']}")
            lines.append("")
        
        lines.append("---")
        lines.append("*Clinical Note: This temporal analysis identifies longitudinal relationships between diagnostic events to support clinical decision-making. It does not constitute a final diagnosis.*")
        return "\n".join(lines)
        return "\n".join(lines)

    def _generate_llm_summary(self, timeline: PatientTimeline, observation: str, 
                            patterns: Dict, risk_analysis: Dict) -> Optional[str]:
        """Use get_chat_model to generate a clinical narrative"""
        try:
            # Dynamically import to avoid circular dependencies
            import sys
            sys.path.append('C:/CareFusion-AI')
            from Reasoning_Sys.pipeline.MY_Model import get_chat_model
            
            llm = get_chat_model(temperature=0.3, max_tokens=1024)
            
            # Construct the prompt
            prompt = f"""
ROLE: You are the CareFusion AI Temporal Reasoning Engine.
TASK: Analyze the patient's medical timeline and generate a professional clinical narrative summary.

PATIENT HISTORY CONTEXT:
- Total Recorded Events: {len(timeline.events)}
- First Event Recorded: {timeline.events[0].timestamp if timeline.events else 'N/A'}
- Recorded Event Types: {self._count_event_types(timeline)}

DETECTED TEMPORAL PATTERNS:
- Persistent Symptoms: {json.dumps(patterns['symptom_persistence'])}
- Escalation Patterns: {json.dumps(patterns['symptom_escalation'])}

RISK ASSESSMENT:
- Current Overall Risk: {risk_analysis['overall_risk_level']}
- Risk Trajectory: {risk_analysis['risk_trajectory']}
- Key Risk Factors: {json.dumps(risk_analysis['risk_factors'])}

NEW DOCTOR OBSERVATION:
"{observation}"

INSTRUCTIONS:
1. Summarize how the new observation fits into the patient's history.
2. Identify if this confirms an existing progression or raises new concerns.
3. Reference specific past dates/events to justify your narrative.
4. DO NOT provide a final diagnosis or treatment plan.
5. Provide the summary in a professional, objective medical tone.

GENERATE CLINICAL NARRATIVE:
"""
            response = llm.invoke(prompt)
            return response.content if hasattr(response, 'content') else str(response)

        except Exception as e:
            print(f"LLM Summary Generation Failed: {e}", file=sys.stderr)
            return None


def temporal_analysis(user_id: str, observation: str, user_data_root: str = "C:/CareFusion-AI/data/users") -> Dict[str, Any]:
    """
    Main entry point for Module 4 temporal analysis
    
    Args:
        user_id: Patient user ID
        observation: New doctor observation or test result
        user_data_root: Root directory for user data
    
    Returns:
        Temporal analysis results
    """
    
    analyzer = TemporalAnalyzer(user_data_root)
    
    # Load patient history
    timeline = analyzer.load_patient_history(user_id)
    
    # Analyze new observation in context
    results = analyzer.analyze_new_observation(timeline, observation)
    
    return results


if __name__ == "__main__":
    """Command-line interface for Module 4"""
    
    if len(sys.argv) < 3:
        print("Usage: python temporal_analysis.py <user_id> <observation>", file=sys.stderr)
        sys.exit(1)
    
    user_id = sys.argv[1]
    observation = sys.argv[2]
    
    try:
        results = temporal_analysis(user_id, observation)
        
        # Output structured JSON
        print("---TEMPORAL_OUTPUT_START---")
        print(json.dumps(results, indent=2, default=str))
        print("---TEMPORAL_OUTPUT_END---")
        
    except Exception as e:
        print(f"---TEMPORAL_ERROR---", file=sys.stderr)
        print(f"Error: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)
