import { useEffect, useState } from 'react';
import type { Rule } from '@bidrules/shared';
import { getRules } from '../api';
import { describeRule } from '../format';

/**
 * Preview and apply a bid rule. See docs/SPEC.md §5 for the required behaviour.
 */
export function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [ruleId, setRuleId] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getRules()
      .then((res) => {
        setRules(res.rules);
        setRuleId(res.rules[0]?.id ?? '');
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  const selected = rules.find((r) => r.id === ruleId);

  async function handlePreview() {
    // TODO(candidate): implement preview + apply (docs/SPEC.md §5).
  }

  return (
    <section>
      <div className="page-head">
        <div>
          <h2>Bid rules</h2>
          <p className="muted">Preview the bid changes a rule would make, then apply them.</p>
        </div>
      </div>
      <div className="toolbar">
        <label>
          Rule
          <select value={ruleId} onChange={(e) => setRuleId(e.target.value)}>
            {rules.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
        <button className="primary" onClick={handlePreview} disabled={!ruleId}>
          Preview
        </button>
        <button
          onClick={() => {
            // TODO(candidate): open the New rule form (docs/SPEC.md §5 and docs/design/).
          }}
        >
          New rule
        </button>
      </div>
      {selected && <p className="rule-summary">{describeRule(selected)}</p>}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
