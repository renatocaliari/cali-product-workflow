# Strategic Exploration (Fase 0b)

⚠️ **Read this file only when the user shows interest in strategic exploration.**
Otherwise, skip straight to Fase 1.

---

## Detect Signals

Look for user mentions of:
- Strategic direction: "como evoluir", "novas features", "oportunidades", "estratégia"
- Methods: JTBD, jobs-to-be-done, evolutionary, opportunity mapping, short-cycle
- Exploration: "o que construir", "ideias para o produto"

## Ask

```typescript
ask_user_question({
  questions: [{
    question: `Selecione abordagens estratégicas extras antes do Shape Up.`,
    header: "Abordagens",
    multiSelect: true,
    options: [
      {
        label: "Job-to-Be-Done Framework",
        description: "Análise de jobs funcionais, emocionais e sociais. Necessidades não declaradas."
      },
      {
        label: "Evolutionary Product Thinking",
        description: "Stepping-stones, evolutionary forces, optionality, evitação de convergência prematura."
      },
      {
        label: "Opportunity Mapping",
        description: "Oportunidades ranked por impacto e esforço. Quick wins + strategic bets."
      },
      {
        label: "Short-Cycle Product Method",
        description: "Validação com experimentos rápidos. Métricas, canais, pricing, modelo de negócio."
      },
      {
        label: "Multi-Method Market Analysis",
        description: "PESTLE, Wardley Maps, Delphi, Foresight — análise profunda de mercado."
      }
    ]
  }]
})
```

## Execution

If user selects one or more:

1. Run each selected skill via parallel subagent (fresh context)
   - `cali-job-to-be-done-framework`
   - `cali-evolutionary-principles`
   - `cali-opportunity-mapping`
   - `cali-short-cycle-product`
   - `cali-multi-method-market-analysis`

2. Save individual files to `product-workflow/{YYYY-MM-DD}/{_dir}/`
   - `<skill>-analysis.md`

3. Consolidate into `strategic-insights.md` via subagent with:
   - Executive summary (10-15 bullets)
   - Links to full analyses
   - Top opportunities consolidated
   - Recommended focus areas

4. Show summary in chat with file links

5. For each skill, ask granular integration:
```typescript
ask_user_question({
  questions: [{
    question: `{Skill} — Selecione insights para incorporar ao Shape Up:`,
    header: "Insights",
    multiSelect: true,
    options: [
      // Generated dynamically based on actual analysis output
    ]
  }]
})
```
   - If no insights selected from a skill → skip that skill
   - Proceed to next or Shape Up

6. Integrate selected insights into Shape Up:
   - Inject as context
   - Add sections to spec-product.md (e.g. `## Jobs Considerados`)

If user selects nothing → skip to Fase 1.
