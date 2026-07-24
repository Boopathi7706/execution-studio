import type { VisualizationModel, HeapObjectView, VariableView } from '@/types/visualization.types'

/**
 * Generates a single human-readable sentence explaining what happened during an execution step.
 * Designed to teach JVM concepts, transforming technical state into pedagogical insights.
 *
 * @param prev - The VisualizationModel from the previous step (null on first step)
 * @param curr - The current VisualizationModel
 * @returns A human-readable explanation string
 */
export function generateExplanation(
  prev: VisualizationModel | null,
  curr: VisualizationModel | null,
  step?: any | null,
): string {
  if (!curr) return ''

  // ── 0. Handle Uncaught Exceptions (Transforming Raw Exception Metadata) ──
  if (curr.status === 'EXCEPTION' || curr.exceptionInfo) {
    const ex = curr.exceptionInfo
    const line = ex?.lineNumber || curr.highlights?.currentLine || 1
    const exType = ex?.exceptionType || 'java.lang.RuntimeException'
    const shortType = simplifyType(exType)
    const rawMsg = ex?.exceptionMessage ? `: "${ex.exceptionMessage}"` : ''

    if (shortType === 'NullPointerException' || exType.includes('NullPointerException')) {
      return `NullPointerException at line ${line} — Attempted to access a field, method, or element on a null reference.`
    }
    if (shortType === 'ArrayIndexOutOfBoundsException' || exType.includes('ArrayIndexOutOfBoundsException')) {
      return `ArrayIndexOutOfBoundsException at line ${line} — Attempted to access an array index out of valid bounds${rawMsg}.`
    }
    if (shortType === 'ArithmeticException' || exType.includes('ArithmeticException')) {
      return `ArithmeticException at line ${line} — Encountered an invalid mathematical operation (e.g. division by zero)${rawMsg}.`
    }
    return `Uncaught ${shortType}${rawMsg} at line ${line} — Execution terminated.`
  }

  // ── 0.5. Consume Educational Timeline Stack Transition Events if Step is Present ──
  if (step && step.executionPhase && step.executionPhase !== 'NORMAL_LINE') {
    const phase = step.executionPhase
    const transition = step.transition

    if (phase === 'PROGRAM_START') {
      const entry = transition?.calleeMethod || step.highlightedMethod || 'main'
      return `Program execution started in ${entry}().`
    }

    if (phase === 'METHOD_ENTRY') {
      const caller = transition?.callerMethod ? `${transition.callerMethod}()` : 'main()'
      const callee = transition?.calleeMethod || step.highlightedMethod || 'method'
      if (transition?.isRecursion) {
        return `${callee}() called ${callee}() recursively. A new stack frame was created.`
      }
      return `${caller} called ${callee}(). A new stack frame was created.`
    }

    if (phase === 'CONSTRUCTOR_ENTRY') {
      const caller = transition?.callerMethod ? `${transition.callerMethod}()` : 'main()'
      const callee = transition?.calleeClass ? simplifyType(transition.calleeClass) : 'Object'
      return `${caller} invoked the ${callee} constructor. A new ${callee}() stack frame was created.`
    }

    if (phase === 'METHOD_EXIT') {
      const callee = transition?.calleeMethod || step.highlightedMethod || 'method'
      const caller = transition?.callerMethod ? `${transition.callerMethod}()` : 'the caller'
      const rawRet = transition?.returnValue || curr.returnValue
      if (rawRet) {
        const valStr = formatValueString(rawRet)
        return `${callee}() returned ${valStr} to ${caller}. Its stack frame was removed.`
      }
      return `${callee}() completed and returned control to ${caller}.`
    }

    if (phase === 'CONSTRUCTOR_EXIT') {
      const callee = transition?.calleeClass ? simplifyType(transition.calleeClass) : 'Object'
      const caller = transition?.callerMethod ? `${transition.callerMethod}()` : 'the caller'
      return `${callee}() finished initialization and returned control to ${caller}.`
    }
  }

  const currentLine = curr.highlights?.currentLine ?? 0
  const currentMethod = formatMethodName(curr.highlights?.currentMethod ?? 'main')

  // ── 1. Method call: new frame appeared on top of stack ──────────────────
  const currFrames = curr.stack?.frames ?? []
  const prevFrames = prev?.stack?.frames ?? []
  if (currFrames.length > prevFrames.length) {
    const newFrame = currFrames[0]
    const callerFrame = currFrames[1]
    if (newFrame) {
      const newMethodName = formatMethodName(newFrame.methodName, newFrame.className)
      const caller = callerFrame ? `${formatMethodName(callerFrame.methodName, callerFrame.className)}()` : 'main()'
      return `Called ${newMethodName}() from ${caller} — execution enters a new stack frame at line ${newFrame.lineNumber}.`
    }
  }

  // ── 2. Method return: a frame disappeared or returnValue is present ──────
  if (currFrames.length < prevFrames.length && prevFrames.length > 0) {
    const returnedFrame = prevFrames[0]
    const returningTo = currFrames[0]
    if (returnedFrame) {
      const retMethodName = formatMethodName(returnedFrame.methodName, returnedFrame.className)
      const to = returningTo ? `${formatMethodName(returningTo.methodName, returningTo.className)}()` : 'the caller'
      const retValStr = curr.returnValue ? formatValueString(curr.returnValue) : null
      const retClause = retValStr ? ` and returned value ${retValStr}` : ' and returned'
      return `${retMethodName}() finished${retClause} to ${to}.`
    }
  }

  // ── 3. New heap objects allocated ───────────────────────────────────────
  const currObjects = curr.heap?.objects ?? {}
  const prevObjects = prev?.heap?.objects ?? {}
  const newObjectIds = Object.keys(currObjects).filter((id) => !prevObjects[id])
  if (newObjectIds.length > 0) {
    const newObj: HeapObjectView = currObjects[newObjectIds[0]]
    const typeName = simplifyType(newObj.classNameOrType)
    if (newObjectIds.length === 1) {
      if (newObj.type === 'array') {
        const len = Object.keys(newObj.fieldsOrElements ?? {}).length
        return `A new ${typeName} array of length ${len} was allocated on the heap.`
      }
      return `A new ${typeName} object was created and placed on the heap.`
    }
    return `${newObjectIds.length} new objects were allocated on the heap, including a ${typeName}.`
  }

  // ── 4. Variable change: variable assigned or reassigned ─────────────────
  const currVars = curr.variables?.variables ?? []
  const prevVars = prev?.variables?.variables ?? []
  const changedVar = findChangedVariable(prevVars, currVars)
  if (changedVar) {
    const { variable, isNew } = changedVar
    const val = variable.value
    if (val.kind === 'null') {
      return isNew
        ? `Variable '${variable.name}' was declared and set to null.`
        : `Variable '${variable.name}' was set to null.`
    }
    if (val.kind === 'object_ref' || val.kind === 'array_ref') {
      const objId = val.objectId
      const refObj = objId ? currObjects[objId] : null
      const typeName = refObj ? simplifyType(refObj.classNameOrType) : variable.declaredType
      return isNew
        ? `Variable '${variable.name}' was declared and now references a ${typeName} on the heap.`
        : `Variable '${variable.name}' was reassigned and now references a ${typeName} on the heap.`
    }
    if (isPrimitive(val.kind)) {
      const valStr = val.valueString ?? String(val.value ?? '')
      return isNew
        ? `Variable '${variable.name}' was declared with value ${valStr} — stored directly in the stack frame.`
        : `Variable '${variable.name}' changed to ${valStr}.`
    }
    if (val.kind === 'string') {
      const valStr = val.valueString ?? ''
      return isNew
        ? `Variable '${variable.name}' was declared with String value "${valStr}".`
        : `Variable '${variable.name}' changed to "${valStr}".`
    }
  }

  // ── 5. Heap object field update ─────────────────────────────────────────
  const fieldChange = findChangedField(prevObjects, currObjects)
  if (fieldChange) {
    const { objId, fieldName, newValue } = fieldChange
    const obj = currObjects[objId]
    const typeName = simplifyType(obj?.classNameOrType ?? 'Object')
    if (newValue.kind === 'null') {
      return `Field '${fieldName}' of ${typeName} was set to null — the reference was cleared.`
    }
    if (newValue.kind === 'object_ref' || newValue.kind === 'array_ref') {
      const targetId = newValue.objectId
      const targetObj = targetId ? currObjects[targetId] : null
      const targetType = simplifyType(targetObj?.classNameOrType ?? 'Object')
      return `Field '${fieldName}' of ${typeName} now points to a ${targetType} object on the heap.`
    }
    const valStr = newValue.valueString ?? String(newValue.value ?? '')
    return `Field '${fieldName}' of ${typeName} was updated to ${valStr}.`
  }

  // ── 6. Fallback: describe current executing line ─────────────────────────
  if (currentLine > 0) {
    return `Executing ${currentMethod}() at line ${currentLine}.`
  }

  return `Program is running.`
}

// ── Helper: Exact '<init>' constructor label formatting ───────────────────
function formatMethodName(methodName: string, className?: string): string {
  if (!methodName) return 'main'
  if (methodName === '<init>') {
    return simplifyType(className || 'Object')
  }
  return methodName
}

// ── Helper: DisplayValue formatting ──────────────────────────────────────
function formatValueString(val: import('@/types/visualization.types').DisplayValue): string {
  if (!val) return 'null'
  if (val.kind === 'null') return 'null'
  if (val.kind === 'string') return `"${val.valueString || val.value || ''}"`
  if (val.objectId) return `reference ${val.objectId}`
  return val.valueString || String(val.value ?? '')
}

// ── Helper: simplify java.lang.String → String ────────────────────────────
function simplifyType(fullType: string): string {
  if (!fullType) return 'Object'
  if (fullType.endsWith('[]')) {
    const base = simplifyType(fullType.slice(0, -2))
    return `${base}[]`
  }
  const parts = fullType.split('.')
  return parts[parts.length - 1] ?? fullType
}

// ── Helper: detect which variable changed ────────────────────────────────
function findChangedVariable(
  prevVars: VariableView[],
  currVars: VariableView[],
): { variable: VariableView; isNew: boolean } | null {
  for (const curr of currVars) {
    const prev = prevVars.find((v) => v.name === curr.name)
    if (!prev) return { variable: curr, isNew: true }
    if (varValueChanged(prev, curr)) return { variable: curr, isNew: false }
  }
  return null
}

function varValueChanged(a: VariableView, b: VariableView): boolean {
  const av = a.value
  const bv = b.value
  if (av.kind !== bv.kind) return true
  if (av.objectId !== bv.objectId) return true
  if (av.valueString !== bv.valueString) return true
  return false
}

// ── Helper: detect which heap object field changed ────────────────────────
function findChangedField(
  prevObjects: Record<string, HeapObjectView>,
  currObjects: Record<string, HeapObjectView>,
): { objId: string; fieldName: string; newValue: import('@/types/visualization.types').DisplayValue } | null {
  for (const [objId, currObj] of Object.entries(currObjects)) {
    const prevObj = prevObjects[objId]
    if (!prevObj) continue
    const currFields = currObj.fieldsOrElements ?? {}
    const prevFields = prevObj.fieldsOrElements ?? {}
    for (const [fieldName, newVal] of Object.entries(currFields)) {
      const oldVal = prevFields[fieldName]
      if (!oldVal) continue
      if (
        oldVal.valueString !== newVal.valueString ||
        oldVal.objectId !== newVal.objectId ||
        oldVal.kind !== newVal.kind
      ) {
        return { objId, fieldName, newValue: newVal }
      }
    }
  }
  return null
}

// ── Helper: check if a value kind is a JVM primitive ─────────────────────
function isPrimitive(kind: string): boolean {
  return ['int', 'long', 'short', 'byte', 'float', 'double', 'boolean', 'char', 'primitive'].includes(kind)
}
