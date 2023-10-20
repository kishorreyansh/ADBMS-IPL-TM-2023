import type { z } from 'zod'

export type inferErrors<T extends z.ZodTypeAny> = {
  [P in keyof z.infer<T>]?: string
}

export async function validateAction<TSchema extends z.ZodTypeAny>(
  request: Request,
  schema: TSchema
) {
  const formData = await request.formData()
  const fields = Object.fromEntries(formData)
  const result = schema.safeParse(fields) as z.SafeParseReturnType<
    inferErrors<TSchema>,
    z.infer<TSchema>
  >

  if (!result.success) {
    const fieldErrors = result.error.issues.reduce(
      (acc: inferErrors<TSchema>, issue) => {
        const key = (issue.path[0] as keyof TSchema) ?? issue.code
        acc[key] = issue.message
        return acc
      },
      {}
    )

    return {
      fields: null,
      fieldErrors,
    }
  }

  return {
    fields: result.data,
    fieldErrors: null,
  }
}
