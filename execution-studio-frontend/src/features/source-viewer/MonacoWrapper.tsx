import React, { useRef, useEffect, useCallback } from 'react'
import Editor, { type Monaco } from '@monaco-editor/react'

interface MonacoWrapperProps {
  sourceCode: string
  currentLine: number // 1-indexed
  theme?: 'vs-dark' | 'light'
  onChange?: (value: string) => void
  readOnly?: boolean
}

/**
 * A strongly typed, performant wrapper component for Monaco Editor.
 * Renders Java source code with active execution line highlighting and glyph decorations.
 */
export const MonacoWrapper: React.FC<MonacoWrapperProps> = ({
  sourceCode,
  currentLine,
  theme = 'vs-dark',
  onChange,
  readOnly = false,
}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null)
  const monacoRef = useRef<Monaco | null>(null)
  const decorationsRef = useRef<string[]>([])

  // Clears any active decorations
  const clearDecorations = useCallback(() => {
    if (editorRef.current && decorationsRef.current.length > 0) {
      editorRef.current.deltaDecorations(decorationsRef.current, [])
      decorationsRef.current = []
    }
  }, [])

  // Updates active line decorations and centers line in viewport if outside bounds
  const updateDecorations = useCallback(
    (line: number) => {
      const editor = editorRef.current
      const monaco = monacoRef.current
      if (!editor || !monaco || line <= 0) {
        clearDecorations()
        return
      }

      try {
        const lineCount = editor.getModel()?.getLineCount() || 0
        if (line > lineCount) {
          clearDecorations()
          return
        }

        const newDecorations = [
          {
            range: new monaco.Range(line, 1, line, 1),
            options: {
              isWholeLine: true,
              className: 'active-execution-line-highlight',
              glyphMarginClassName: 'active-execution-line-glyph',
            },
          },
        ]

        decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations)

        // Smooth scroll to executing line if it falls outside the viewport bounds
        editor.revealLineInCenterIfOutsideViewport(line)
      } catch (err: unknown) {
        console.error('Error applying line decorations:', err)
      }
    },
    [clearDecorations],
  )

  // Update decorations when currentLine shifts
  useEffect(() => {
    updateDecorations(currentLine)
  }, [currentLine, updateDecorations])

  // Update decorations if source code changes
  useEffect(() => {
    clearDecorations()
    if (editorRef.current) {
      updateDecorations(currentLine)
    }
  }, [sourceCode, currentLine, clearDecorations, updateDecorations])

  // Cleanup editor resources on unmount
  useEffect(() => {
    return () => {
      clearDecorations()
    }
  }, [clearDecorations])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco
    updateDecorations(currentLine)
  }

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
      <Editor
        height="100%"
        language="java"
        theme={theme}
        value={sourceCode}
        onChange={(val) => onChange?.(val || '')}
        options={{
          readOnly,
          minimap: { enabled: false },
          folding: false,
          automaticLayout: true,
          lineNumbers: 'on',
          glyphMargin: true,
        }}
        onMount={handleEditorDidMount}
      />
    </div>
  )
}

export default MonacoWrapper
