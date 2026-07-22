---
branch: main
last_phase: 3
timestamp: 2026-07-22T20:53:00+08:00
complexity: M
status: in_progress
platform: cursor
approach: A-page-floating-panel
autopilot: false
native_attempted: true
native_method: none
prompt_fallback: askquestion_absent
pending_decision:
  decision_point: checkpoint
  options:
    - { id: next, command: "/od n", label: "Enter Phase 4 QA" }
    - { id: revise, command: "/od ad", label: "Revise / fix" }
    - { id: cancel, command: "/od x", label: "Exit" }
---

## 会话目标
浮层控制台：可拖动 + × 关闭 + 点击外部不自动关闭。

## Key Decisions
- Approach A shipped: empty default_popup + Shadow iframe host

## Deliverables
- Code: T1–T7
- Tests: 120 PASS
- Pack: `.output/omnipilot-lingua-bridge-0.4.31-chrome.zip`

## 恢复指引
手工 SMK 后 `/od n` → Phase 4；或 `/od qa`。
