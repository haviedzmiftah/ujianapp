import type { z } from 'zod'

export function formatQuestionIssues(issues: readonly z.core.$ZodIssue[]): Record<string, string> {
  return issues.reduce<Record<string, string>>((details, issue) => {
    const field = issue.path[0]?.toString() ?? '_form'
    details[field] = issue.message
    return details
  }, {})
}
