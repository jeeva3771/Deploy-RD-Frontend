/**
 * Evaluates the logical rate for an item based on the provided inputs (context).
 *
 * @param {Array} logicalRates - The array of rule objects from the item.
 * @param {Object} context - The current input values (e.g., { logic1, logic2, logic3, jobQty }).
 * @returns {Number} - The evaluated rate.
 */
export const evaluateLogicRate = (logicalRates, context) => {
    if (!logicalRates || !Array.isArray(logicalRates) || logicalRates.length === 0) {
        return 0;
    }

    let bestMatch = null;

    for (const rule of logicalRates) {
        let isMatch = false;
        let threshold = 0;
        let type = "other"; // "gt" (greater), "lt" (less), "eq" (equal)

        // 1. New Schema
        if (rule.condition && rule.condition.field) {
            const { field, operator, value } = rule.condition;
            const inputValue = Number(context[field] || 0);
            threshold = Number(value);

            switch (operator) {
                case ">":
                    isMatch = inputValue > threshold;
                    type = "gt";
                    break;
                case ">=":
                    isMatch = inputValue >= threshold;
                    type = "gt";
                    break;
                case "<":
                    isMatch = inputValue < threshold;
                    type = "lt";
                    break;
                case "<=":
                    isMatch = inputValue <= threshold;
                    type = "lt";
                    break;
                case "==":
                    isMatch = inputValue === threshold;
                    type = "eq";
                    break;
                case "!=":
                    isMatch = inputValue !== threshold;
                    break;
            }
        }

        // 2. Legacy Schema (Dynamic Regex)
        else if (rule.variable) {
            const v = rule.variable;

            // greater_than_equal_{N} -> logic3 (legacy mapping)
            const gqeMatch = v.match(/^greater_than_equal_(\d+)$/);
            if (gqeMatch) {
                threshold = Number(gqeMatch[1]);
                if (Number(context.logic3) >= threshold) { isMatch = true; type = "gt"; }
            }

            // less_than_{N} -> logic3
            const ltMatch = v.match(/^less_than_(\d+)$/);
            if (ltMatch) {
                threshold = Number(ltMatch[1]);
                if (Number(context.logic3) < threshold) { isMatch = true; type = "lt"; }
            }

            // greater_than_{N} -> jobQty
            const gtMatch = v.match(/^greater_than_(\d+)$/);
            if (gtMatch) {
                threshold = Number(gtMatch[1]);
                if (Number(context.jobQty) > threshold) { isMatch = true; type = "gt"; }
            }

            // less_than_equal_{N} -> jobQty
            const lqeMatch = v.match(/^less_than_equal_(\d+)$/);
            if (lqeMatch) {
                threshold = Number(lqeMatch[1]);
                if (Number(context.jobQty) <= threshold) { isMatch = true; type = "lt"; }
            }
        }

        // 3. Compare with current best match
        if (isMatch) {
            const price = Number(rule.rate || rule.price || rule["price:"] || 0);

            if (!bestMatch) {
                bestMatch = { price, threshold, type };
            } else {
                // Priority Logic:
                // If types are same:
                //   GT/GTE: Higher threshold is better (Specific > 1000 beats > 100)
                //   LT/LTE: Lower threshold is better (Specific < 100 beats < 1000)
                //   EQ: Exact match (usually unique, but overwrite if exists)

                if (type === "gt" && bestMatch.type === "gt") {
                    if (threshold > bestMatch.threshold) bestMatch = { price, threshold, type };
                } else if (type === "lt" && bestMatch.type === "lt") {
                    if (threshold < bestMatch.threshold) bestMatch = { price, threshold, type };
                } else {
                    // Mixed types or other? Default to last match or keep existing?
                    // Strategy: If we have a 'gt' match vs 'lt', it's ambiguous.
                    // But usually users define ranges. 
                    // Let's stick to "latest wins" for conflicting types, but "smart win" for same types.
                    // However, keeping strict "Smart Win" for now only on same types.
                    bestMatch = { price, threshold, type };
                }
            }
        }
    }

    return bestMatch ? bestMatch.price : 0;
};
