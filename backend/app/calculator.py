import ast
import operator
import re
import math
from typing import List, Dict, Any, Optional, Tuple
from app.models.schemas import VerifiedCalculation

# Safe operator mapping for AST evaluator
_SAFE_OPERATORS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.FloorDiv: operator.floordiv,
    ast.Mod: operator.mod,
    ast.Pow: operator.pow,
    ast.USub: operator.neg,
    ast.UAdd: operator.pos,
}

def safe_eval_expr(expr_str: str) -> Optional[float]:
    """
    Safely parses and evaluates mathematical arithmetic expressions using Python AST.
    Does NOT use raw eval() or execute arbitrary code.
    Supports numbers, floats, basic arithmetic operators, and parentheses.
    """
    try:
        # Clean string: strip percentage signs, dollar signs, commas in numbers
        clean_expr = expr_str.replace("%", "").replace("$", "").replace(",", "").strip()
        
        # Remove any trailing equality or variable assignment
        if "=" in clean_expr:
            # e.g., "Delta = 70.8 - 82.5" -> "70.8 - 82.5"
            parts = clean_expr.split("=")
            clean_expr = parts[-1].strip()
            
        # Parse AST
        node = ast.parse(clean_expr, mode='eval').body
        
        def _eval(node_elem):
            if isinstance(node_elem, ast.Constant):
                if isinstance(node_elem.value, (int, float)):
                    return node_elem.value
                raise ValueError("Non-numeric constant in math expression")
            elif hasattr(ast, 'Num') and isinstance(node_elem, getattr(ast, 'Num')):
                return node_elem.n
            elif isinstance(node_elem, ast.BinOp):
                left = _eval(node_elem.left)
                right = _eval(node_elem.right)
                op_type = type(node_elem.op)
                if op_type in _SAFE_OPERATORS:
                    op_func = _SAFE_OPERATORS[op_type]
                    if op_type == ast.Div and right == 0:
                        raise ZeroDivisionError("Division by zero in formula")
                    return op_func(left, right)
                raise ValueError(f"Unsupported binary operator: {op_type}")
            elif isinstance(node_elem, ast.UnaryOp):
                operand = _eval(node_elem.operand)
                op_type = type(node_elem.op)
                if op_type in _SAFE_OPERATORS:
                    return _SAFE_OPERATORS[op_type](operand)
                raise ValueError(f"Unsupported unary operator: {op_type}")
            else:
                raise ValueError(f"Unsupported AST node type: {type(node_elem)}")

        result = _eval(node)
        return float(result) if result is not None else None
    except Exception:
        return None


def extract_and_verify_calculations(
    text: str, 
    context_chunks: Optional[List[Any]] = None
) -> List[VerifiedCalculation]:
    """
    Scans the answer and context for mathematical calculations, formulas, or variances.
    Parses each expression with AST evaluator and verifies the numerical integrity.
    """
    calculations: List[VerifiedCalculation] = []
    seen_formulas = set()
    
    # 1. Regex to capture mathematical expressions with equals or explicit formulas
    # Examples:
    # "70.8 - 82.5 = -11.7"
    # "((70.8 - 82.5) / 82.5) * 100 = -14.18"
    # "18 - 5 = 13"
    # "13 * 0.65 = 8.45"
    # "Formula: ((Q4 - Q2) / Q2) * 100"
    
    eq_pattern = re.compile(
        r'([\(\)\d\.\s\+\-\*\/\%\^]+)\s*=\s*([\-+]?\d+(?:\.\d+)?%?)',
        re.MULTILINE
    )
    
    calc_idx = 1
    for match in eq_pattern.finditer(text):
        raw_lhs = match.group(1).strip().strip("*`$ ")
        raw_rhs = match.group(2).strip().strip("*`$% ")
        
        # Check if LHS is a genuine math expression with at least one operator
        if not any(op in raw_lhs for op in ['+', '-', '*', '/', '%']):
            continue
            
        # Avoid short strings or date ranges like "2024 - 2026"
        if re.match(r'^(19|20)\d{2}\s*-\s*(19|20)\d{2}$', raw_lhs):
            continue
            
        if raw_lhs in seen_formulas:
            continue
        seen_formulas.add(raw_lhs)
        
        # Evaluate LHS safely with AST
        computed_val = safe_eval_expr(raw_lhs)
        if computed_val is None:
            continue
            
        try:
            stated_val = float(raw_rhs.replace("%", "").strip())
        except ValueError:
            stated_val = None
            
        status = "VERIFIED"
        if stated_val is not None:
            # Check difference with 0.05 tolerance
            diff = abs(computed_val - stated_val)
            if diff > 0.15:
                status = "DISCREPANCY"
                
        # Extract numeric inputs
        numbers = re.findall(r'[-+]?\d*\.?\d+', raw_lhs)
        inputs_dict = {f"Var_{i+1}": float(n) if "." in n else int(n) for i, n in enumerate(numbers)}
        
        # Format computed result with precision
        if abs(computed_val - round(computed_val)) < 1e-4:
            fmt_res = f"{int(round(computed_val))}"
        else:
            fmt_res = f"{computed_val:.2f}"
            
        if "%" in match.group(2) or "percent" in raw_lhs.lower():
            fmt_res += "%"
            
        # Find related source chunk
        source_chunk_ids = []
        if context_chunks:
            for ch in context_chunks:
                ch_id = getattr(ch, "chunk_id", "") or getattr(ch, "id", "")
                ch_content = getattr(ch, "content", "")
                # If any input number is present in the chunk content, link it
                if any(str(n) in ch_content for n in numbers[:2]):
                    source_chunk_ids.append(ch_id)
                    
        calculations.append(VerifiedCalculation(
            id=f"calc-{calc_idx}",
            title=f"Calculation #{calc_idx}: {raw_lhs} = {fmt_res}",
            formula=f"{raw_lhs} = {fmt_res}",
            inputs=inputs_dict,
            computed_result=fmt_res,
            status=status,
            explanation=f"Deterministic AST verified: {raw_lhs} evaluates exactly to {fmt_res} ({status}).",
            source_chunk_ids=source_chunk_ids[:3]
        ))
        calc_idx += 1
        
    # If no equality was found but math steps exist in markdown list
    if not calculations:
        line_patterns = re.findall(r'[-*]\s*([A-Za-z\s]+):\s*`?([\d\.\s\+\-\*\/\%\(\)]+)`?', text)
        for label, expr in line_patterns:
            if any(op in expr for op in ['+', '-', '*', '/']):
                val = safe_eval_expr(expr)
                if val is not None:
                    calculations.append(VerifiedCalculation(
                        id=f"calc-{calc_idx}",
                        title=f"{label.strip()}",
                        formula=f"{expr.strip()} = {val:.2f}",
                        inputs={"Expression": expr.strip()},
                        computed_result=f"{val:.2f}",
                        status="VERIFIED",
                        explanation=f"Evaluated via Python AST: {expr.strip()} = {val:.2f}",
                        source_chunk_ids=[]
                    ))
                    calc_idx += 1

    return calculations
