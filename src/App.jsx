import React, { useCallback, useMemo, useState } from 'react'
import './App.css'

const STEP_TYPES = [
  { type: 'CLEAN_TEXT', label: 'Clean text' },
  { type: 'SUMMARIZE', label: 'Summarize' },
  { type: 'EXTRACT_KEY_POINTS', label: 'Extract key points' },
  { type: 'TAG_CATEGORY', label: 'Tag category' },
]


const FIXED_STEPS = STEP_TYPES.map((s, idx) => ({
  id: `step-${idx + 1}`,
  type: s.type,
  label: s.label,
}))

const MIN_STEPS = 4
const MAX_STEPS = 4
const MAX_HISTORY = 5


function ensureSentenceCase(text) {
  if (!text) return text
  return text
    .split('\n')
    .map((line) => {
      if (!line.trim()) return line
      // Uppercase first letter of the line (supports bullets like "•")
      let updated = line.replace(
        /^(\s*[\u2022\-]?\s*)([a-z])/,
        (_, prefix, ch) => prefix + ch.toUpperCase(),
      )
      // Uppercase letters after sentence-ending punctuation
      updated = updated.replace(/([.!?]\s+)([a-z])/g, (_, sep, ch) => sep + ch.toUpperCase())
      return updated
    })
    .join('\n')
}

function cleanText(input) {
  const cleaned = input.replace(/\s+/g, ' ').trim()
  return ensureSentenceCase(cleaned)
}

function summarizeText(input, maxSentences = 2) {
  const sentences = input
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
  if (!sentences.length) return input
  return ensureSentenceCase(sentences.slice(0, maxSentences).join(' '))
}

function extractKeyPoints(input, maxPoints = 5) {
  const sentences = input
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
  if (!sentences.length) return input
  const points = sentences.slice(0, maxPoints).map((s) => `• ${s}`)
  return ensureSentenceCase(points.join('\n'))
}

function tagCategory(input) {
  const lower = input.toLowerCase()
  const categories = []

  if (/(error|fail|bug|issue)/.test(lower)) categories.push('Bug Report')
  if (/(feature|request|idea|improve)/.test(lower)) categories.push('Feature Request')
  if (/(user|customer|client)/.test(lower)) categories.push('User Feedback')
  if (/(sale|revenue|price|cost)/.test(lower)) categories.push('Business / Sales')

  if (!categories.length) categories.push('General')
  return categories.join(', ')
}

function runStep(type, input) {
  switch (type) {
    case 'CLEAN_TEXT':
      return cleanText(input)
    case 'SUMMARIZE':
      return summarizeText(input)
    case 'EXTRACT_KEY_POINTS':
      return extractKeyPoints(input)
    case 'TAG_CATEGORY':
      return tagCategory(input)
    default:
      return input
  }
}


function Card({ title, children, style }) {
  return (
    <div
      style={{
        background: 'rgba(15,23,42,0.9)',
        borderRadius: 12,
        boxShadow: '0 18px 45px rgba(15,23,42,0.85)',
        border: '1px solid #1f2937',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        ...style,
      }}
    >
      {title && (
        <div
          style={{
            fontWeight: 600,
            fontSize: 15,
            marginBottom: 4,
            color: '#f9fafb',
          }}
        >
          {title}
        </div>
      )}
      {children}
    </div>
  )
}

function Pill({ children }) {
  return (
    <span
      style={{
        padding: '2px 8px',
        borderRadius: 999,
        background: '#0f172a',
        fontSize: 11,
        fontWeight: 500,
        color: '#e5e7eb',
      }}
    >
      {children}
    </span>
  )
}

function App() {
  const [workflowName, setWorkflowName] = useState('My Workflow')
  const steps = FIXED_STEPS
  const [inputText, setInputText] = useState('')
  const [stepOutputs, setStepOutputs] = useState([])
  const [history, setHistory] = useState([])
  const [isRunning, setIsRunning] = useState(false)
  const [activeTab, setActiveTab] = useState('intro') // 'intro' | 'workflow' | 'history'

  const handleRun = useCallback(() => {
    if (!inputText.trim() || !steps.length) return

    const start = performance.now()
    let current = ensureSentenceCase(inputText)
    const outputs = []

    for (const step of steps) {
      current = runStep(step.type, current)
      current = ensureSentenceCase(current)
      outputs.push({
        stepId: step.id,
        stepLabel: step.label,
        output: current,
      })
    }

    const durationMs = performance.now() - start
    setStepOutputs(outputs)

    setHistory((prev) => {
      const next = [
        {
          id: `${Date.now()}`,
          workflowName: workflowName || 'Untitled workflow',
          input: inputText,
          results: outputs,
          startedAt: new Date().toLocaleTimeString(),
          durationMs: Math.round(durationMs),
        },
        ...prev,
      ]
      return next.slice(0, MAX_HISTORY)
    })

    setIsRunning(false)
  }, [inputText, steps, workflowName])

  const handleRunClick = useCallback(() => {
    if (isRunning) return
    setIsRunning(true)
    setTimeout(handleRun, 0)
  }, [isRunning, handleRun])

  const canRun = useMemo(
    () => inputText.trim().length > 0 && steps.length >= MIN_STEPS,
    [inputText, steps.length],
  )

  return (
    <div
      className='flex flex-col min-h-screen'
      style={{
        background: 'radial-gradient(circle at top, #020617, #020617)',
        padding: '24px 0 24px',
        boxSizing: 'border-box',
        fontFamily:
          '-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif',
        color: '#e5e7eb',
      }}
    >
      {/* Header */}
<div
  style={{
    maxWidth: 1120,
    width: '100%',
    margin: '0 auto 16px',
    padding: '0 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    textAlign: 'left',
    gap: 8,
  }}
>

        <div
          style={{
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: -0.03,
            color: '#f9fafb',
          }}
        >
          Workflow Builder Lite
        </div>
        <div
          style={{
            fontSize: 13,
            color: '#9CA3AF',
            maxWidth: 520,
          }}
        >
          Build tiny NLP workflows with four opinionated steps, run them on text, and inspect each transformation in a sleek dark workspace.
        </div>
        <div style={{ marginTop: 4 }}>
          <Pill>4 fixed steps · last 5 runs</Pill>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 20,
          padding: '0 24px',
          justifyContent: 'center',
        }}
      >
        {[
          { id: 'intro', label: 'Intro' },
          { id: 'workflow', label: 'Workflow' },
          { id: 'history', label: 'History' },
        ].map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type='button'
              onClick={() => setActiveTab(tab.id)}
              style={{
                borderRadius: 999,
                border: '1px solid ' + (isActive ? '#6366F1' : '#1f2937'),
                padding: '6px 14px',
                fontSize: 13,
                fontWeight: 500,
                cursor: isActive ? 'default' : 'pointer',
                background: isActive ? '#4F46E5' : '#020617',
                color: isActive ? '#F9FAFB' : '#e5e7eb',
                boxShadow: isActive ? '0 0 0 1px rgba(129,140,248,0.5)' : 'none',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Intro tab */}
      {activeTab === 'intro' && (
        <div
          style={{
            maxWidth: 900,
            width: '100%',
            padding: '0 24px 24px',
            margin: '0 auto',
          }}
        >
          <Card title='How This Workflow Works'>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: 12,
                marginTop: 4,
              }}
            >
              <Card
                title='Clean Text'
                style={{
                  boxShadow: 'none',
                  border: '1px solid #1f2937',
                  background: 'rgba(15,23,42,0.9)',
                }}
              >
                <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>
                  Normalize spacing, trim noise, and standardize casing so your text is tidy and easier for later steps to understand.
                </p>
              </Card>
              <Card
                title='Summarize'
                style={{
                  boxShadow: 'none',
                  border: '1px solid #1f2937',
                  background: 'rgba(15,23,42,0.9)',
                }}
              >
                <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>
                  Compress the cleaned text into a short, readable overview that keeps the most important information.
                </p>
              </Card>
              <Card
                title='Extract Key Points'
                style={{
                  boxShadow: 'none',
                  border: '1px solid #1f2937',
                  background: 'rgba(15,23,42,0.9)',
                }}
              >
                <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>
                  Turn the summary into bullet points so you can quickly scan the main ideas or decisions.
                </p>
              </Card>
              <Card
                title='Tag Category'
                style={{
                  boxShadow: 'none',
                  border: '1px solid #1f2937',
                  background: 'rgba(15,23,42,0.9)',
                }}
              >
                <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>
                  Label the text as a bug report, feature request, user feedback, or business note based on its language.
                </p>
              </Card>
            </div>
          </Card>
        </div>
      )}

      {/* Workflow tab */}
      {activeTab === 'workflow' && (
        <div
          style={{
            width: '100%',
            maxWidth: 1000,
            margin: '0 auto',
            padding: '0 24px 24px',
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1.1fr)',
            gap: 16,
          }}
        >
          {/* Left column: builder */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <Card title='Workflow'>
            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#cbd5f5',
                }}
              >
                Name
              </span>
              <input
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                placeholder='My workflow'
                style={{
                  borderRadius: 8,
                  border: '1px solid #334155',
                  padding: '6px 10px',
                  fontSize: 13,
                  outline: 'none',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                  backgroundColor: '#020617',
                  color: '#e5e7eb',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#6366F1'
                  e.target.style.boxShadow = '0 0 0 1px rgba(129,140,248,0.45)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#334155'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </label>

            <div
              style={{
                marginTop: 4,
                marginBottom: 4,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#cbd5f5',
                }}
              >
                Steps
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: '#9CA3AF',
                  marginLeft: 6,
                }}
              >
                ({steps.length}/{MAX_STEPS})
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                marginBottom: 8,
              }}
            >
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: 6,
                    borderRadius: 8,
                    background: 'rgba(15,23,42,0.9)',
                    border: '1px solid #1f2937',
                  }}
                >
                  <div
                    style={{
                      width: 20,
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#9CA3AF',
                    }}
                  >
                    {index + 1}.
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: '#e5e7eb',
                    }}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
            </Card>
          </div>

          {/* Right column: runner */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <Card title='Run'>
            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#cbd5f5',
                }}
              >
                Input text
              </span>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder='Paste or type text to run through your workflow...'
                rows={6}
                style={{
                  resize: 'vertical',
                  minHeight: 120,
                  borderRadius: 10,
                  border: '1px solid #334155',
                  padding: '8px 10px',
                  fontSize: 13,
                  lineHeight: 1.4,
                  outline: 'none',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                  backgroundColor: '#020617',
                  color: '#e5e7eb',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#6366F1'
                  e.target.style.boxShadow = '0 0 0 1px rgba(129,140,248,0.45)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#334155'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </label>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
                gap: 8,
              }}
            >
              <button
                type='button'
                onClick={handleRunClick}
                disabled={!canRun || isRunning}
                style={{
                  borderRadius: 999,
                  border: 'none',
                  padding: '7px 14px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: !canRun || isRunning ? 'default' : 'pointer',
                  background: !canRun || isRunning ? '#E5E7EB' : '#4F46E5',
                  color: !canRun || isRunning ? '#9CA3AF' : '#F9FAFB',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {isRunning ? (
                  <>
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        border: '2px solid rgba(249,250,251,0.6)',
                        borderTopColor: 'transparent',
                        animation: 'spin 0.7s linear infinite',
                      }}
                    />
                    Running...
                  </>
                ) : (
                  'Run workflow'
                )}
              </button>
              <span
                style={{
                  fontSize: 11,
                  color: '#9CA3AF',
                }}
              >
                Each step runs on the previous output.
              </span>
            </div>

            {/* Step outputs */}
            {stepOutputs.length > 0 ? (
              <div
                style={{
                  borderRadius: 10,
                  border: '1px solid #1f2937',
                  background: 'rgba(15,23,42,0.85)',
                  padding: 8,
                  maxHeight: 260,
                  overflow: 'auto',
                }}
              >
                {stepOutputs.map((res, index) => (
                  <div
                    key={res.stepId}
                    style={{
                      padding: 8,
                      borderRadius: 8,
                      background: '#020617',
                      border: '1px solid #1f2937',
                      marginBottom: index === stepOutputs.length - 1 ? 0 : 6,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: '#e5e7eb',
                        }}
                      >
                        Step {index + 1}: {res.stepLabel}
                      </span>
                      <Pill>Output</Pill>
                    </div>
                    <pre
                      style={{
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        fontSize: 12,
                        color: '#e5e7eb',
                        margin: 0,
                      }}
                    >
                      {res.output}
                    </pre>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  fontSize: 12,
                  color: '#9CA3AF',
                  borderRadius: 8,
                  border: '1px dashed #D1D5DB',
                  padding: 8,
                  textAlign: 'center',
                }}
              >
                Run the workflow to see each step&apos;s output here.
              </div>
            )}
            </Card>
          </div>
        </div>
      )}

      {/* History tab */}
      {activeTab === 'history' && (
        <div
          style={{
            maxWidth: 800,
            width: '100%',
            padding: '0 24px 24px',
            margin: '0 auto',
          }}
        >
          <Card title='Run history (last 5)'>
            {history.length === 0 ? (
              <div
                style={{
                  fontSize: 12,
                  color: '#9CA3AF',
                  borderRadius: 8,
                  border: '1px dashed #1f2937',
                  padding: 8,
                  textAlign: 'center',
                }}
              >
                No runs yet. Your last 5 runs will appear here.
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  maxHeight: 260,
                  overflow: 'auto',
                  fontSize: 12,
                }}
              >
                {history.map((run, idx) => (
                  <div
                    key={run.id}
                    style={{
                      borderRadius: 8,
                      border: '1px solid #1f2937',
                      background: 'rgba(15,23,42,0.9)',
                      padding: 8,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        marginBottom: 4,
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 600,
                          color: '#e5e7eb',
                          fontSize: 12,
                        }}
                      >
                        #{history.length - idx} · {run.workflowName}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: '#9CA3AF',
                        }}
                      >
                        {run.startedAt} · {run.durationMs} ms
                      </div>
                    </div>
                    <div
                      style={{
                        marginBottom: 4,
                        color: '#9CA3AF',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      Input: {run.input.slice(0, 80)}
                      {run.input.length > 80 ? '…' : ''}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: '#cbd5f5',
                      }}
                    >
                      Steps: {run.results.map((r) => r.stepLabel).join(' → ')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Inline keyframes for spinner */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default App
