import json
import os
import sys
from validate_vcf import validate_vcf, VCFValidationError
from vcf_parser import parse_user_vcf
from disease_mapper import load_clinvar_db, map_diseases

# Check if running in the expected environment
# print(f"DEBUG: Loading run_module3. __name__={__name__}")
import sys


def dna_Analysis(USER_VCF, clinvar_db_path=None):
    """
    Analyze a User's VCF file against ClinVar database.
    """
    # Default path if not provided
    if not clinvar_db_path:
        # Assuming current structure, but using absolute path is safer
        clinvar_db_path = r"C:\CareFusion-AI\dna_disease_identifier\data\clinvar\clinvar_db.json"

    OUTPUT_FILE = r"C:\CareFusion-AI\dna_disease_identifier\final_report.json"
    
    try:
        print("Starting analysis...", file=sys.stderr)
        # 1. Validate VCF
        validate_vcf(USER_VCF)
    
        # 2. Parse variants
        print("Parsing VCF...", file=sys.stderr)
        variants = parse_user_vcf(USER_VCF)
        
        # 3. Load ClinVar database
        print(f"Loading ClinVar database from {clinvar_db_path}...", file=sys.stderr)
        clinvar_db = load_clinvar_db(clinvar_db_path)
    
        # 4. Map diseases
        print("Mapping variants to diseases...", file=sys.stderr)
        pathogenic, informational = map_diseases(variants, clinvar_db)
        
        # Merge for the generic findings list but keep types clear
        results = []
        for p in pathogenic:
            p["status"] = "Pathogenic"
            results.append(p)
        for inf in informational:
            inf["status"] = "Informational"
            results.append(inf)
    
        output = {
            "genetic_findings": results,
            "summary": (
                f"Detected {len(pathogenic)} pathogenic and {len(informational)} informational variants."
                if (pathogenic or informational)
                else "No clinically significant variants detected."
            ),
            "has_pathogenic": len(pathogenic) > 0
        }
        
        # Write output
        with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
            json.dump(output, f, indent=2, ensure_ascii=False)
            
        print(f"Analysis complete. Found {len(findings)} pathogenic variants.", file=sys.stderr)
        print(f"Results saved to {OUTPUT_FILE}", file=sys.stderr)
        return output
    
    except VCFValidationError as e:
        output = {
            "error": "Invalid VCF file",
            "message": str(e)
        }
        print(f"Error: {e}", file=sys.stderr)
        # Write error to file for backend to pick up if needed
        with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
            json.dump(output, f, indent=2, ensure_ascii=False)
        return output
    
    except Exception as e:
        print(f"An unexpected error occurred: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        return {"error": str(e)}

def main():
    import argparse
    import sys

    # Heuristic: If we don't have arguments, we might be being imported or run via wrapper
    # where __name__ == "__main__" for some reason (e.g. wrapper exec issues).
    # In this case, just return and let the wrapper call the function.
    if len(sys.argv) < 2:
        return

    parser = argparse.ArgumentParser()
    parser.add_argument("--vcf", required=True, help="Path to input VCF file")
    # Make clinvar optional with default
    parser.add_argument("--clinvar", required=False, 
                        default=r"C:\CareFusion-AI\dna_disease_identifier\data\clinvar\clinvar_db.json",
                        help="Path to ClinVar JSON database")

    args = parser.parse_args()
    
    if not os.path.exists(args.vcf):
        print(f"Error: VCF file not found: {args.vcf}")
        sys.exit(1)

    result = dna_Analysis(args.vcf, args.clinvar)

    print("---DNA_RESULT_START---")
    print(json.dumps(result, indent=2))
    print("---DNA_RESULT_END---")

if __name__ == "__main__":
    main()
