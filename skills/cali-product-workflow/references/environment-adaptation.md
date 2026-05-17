# Environment Adaptation

This skill is designed to work in multiple environments.
The tools below may vary. Follow the rules:

## Tool: ask_user_question

| Environment | How to Use |
|---|---|
| **pi.dev** | ✅ Available. Use directly for interactive questions. |
| **Fusion** | ⚠️ Replace with planning mode (questions go to dashboard before execution) or approval requests (for decisions during execution). If neither is available, list the question as "## DECISION NEEDED" in the output. |

## Tool: subagent

| Environment | How to Use |
|---|---|
| **pi.dev** | ✅ Available. Use `subagent({ agent, task, output, skills?, reads? })`. |
| **Fusion** | ⚠️ Replace with `fn_delegate_task({ agent_id, description })` to delegate work. Or create child tasks with `fn_task_create`. |

## Tool: plannotator annotate --gate

| Environment | How to Use |
|---|---|
| **pi.dev** | ✅ Available via bash. Use `plannotator annotate <file>.md --gate`. |
| **Fusion** | ⚠️ After planning, the task goes to the `in-review` column. Review the PROMPT.md on the board. If approved, move to `todo`. For blocking notifications, create an approval request. The executor picks it up automatically. |

## Command: /supervise

| Environment | How to Use |
|---|---|
| **pi.dev** | ✅ Available via chat command. |
| **Fusion** | ⚠️ Replace with `fn_mission_create` to create a Mission→Milestone→Slice hierarchy. Fusion's board already tracks progress. |

## Command: /skill:cali-product-scope-executor

| Environment | How to Use |
|---|---|
| **pi.dev** | ✅ Available. Use after all planning is done. |
| **Fusion** | ⚠️ Replace with the native executor. Tasks in `todo` with an approved plan are automatically picked up by the executor on the next heartbeat. Create tasks with `fn_task_create` or use missions. |

## Tool: todo

| Environment | How to Use |
|---|---|
| **pi.dev** | ✅ Available as `todo` tool. |
| **Fusion** | ⚠️ Replace with the native kanban board. Create tasks with `fn_task_create`. Use TodoStore for checklists. |

## IDENTICAL tools (work in both)

```
read  →  read      (read files)
bash  →  bash      (run commands)
write →  write     (write files)
edit  →  edit      (edit files)
grep  →  grep      (search files)
```

## General rule

1. **Try the default tool first.** If it exists, use it.
2. **If it fails** (tool not found, "command not found"), check the table above for an equivalent in your environment.
3. **If there is no clear equivalent**, execute the intent in the best possible way with available tools and document any adaptations made.
4. **The content in `references/` is neutral** — works in any environment without adaptation.
