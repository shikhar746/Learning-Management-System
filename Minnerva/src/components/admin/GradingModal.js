"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Loader2, CheckCircle2, Award, Bot, Code, ExternalLink, GitBranch, FileText, Video, Sparkles } from "lucide-react"

export default function GradingModal({ submission, assignment, onGraded }) {
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const initialTotal =
    submission.totalScore !== null && submission.totalScore !== undefined && submission.totalScore !== 0
      ? submission.totalScore
      : submission.aiSuggestedScore !== null && submission.aiSuggestedScore !== undefined
      ? submission.aiSuggestedScore
      : ""

  const [formData, setFormData] = useState({
    totalScore: initialTotal !== "" ? Math.round(Number(initialTotal)) : "",
    functionalityScore: submission.functionalityScore !== null && submission.functionalityScore !== undefined ? Math.round(Number(submission.functionalityScore)) : "",
    qualityScore: submission.qualityScore !== null && submission.qualityScore !== undefined ? Math.round(Number(submission.qualityScore)) : "",
    aiDetectionScore: submission.aiDetectionScore !== null && submission.aiDetectionScore !== undefined ? Math.round(Number(submission.aiDetectionScore)) : "",
    documentationScore: submission.documentationScore !== null && submission.documentationScore !== undefined ? Math.round(Number(submission.documentationScore)) : "",
    feedback: submission.feedback || submission.aiSuggestedFeedback || "",
    isGradePublished: submission.isGradePublished ?? true,
  })

  const [showKeyConfig, setShowKeyConfig] = useState(false)
  const [showCriteriaConfig, setShowCriteriaConfig] = useState(false)

  const [requireDoc, setRequireDoc] = useState(
    assignment?.requireDocumentation ||
    (assignment?.description && /documentation|readme|doc|report/i.test(assignment.description)) ||
    false
  )
  const [funcWeight, setFuncWeight] = useState(50)
  const [qualWeight, setQualWeight] = useState(30)
  const [aiWeight, setAiWeight] = useState(20)
  const [docWeight, setDocWeight] = useState(15)

  const [aiProvider, setAiProvider] = useState("GEMINI")
  const [aiApiKey, setAiApiKey] = useState("")
  const [savingKey, setSavingKey] = useState(false)
  const [savingCriteria, setSavingCriteria] = useState(false)

  const handleGenerateAiSuggestion = async () => {
    setAiLoading(true)
    setError("")

    try {
      const res = await fetch(`/api/admin/submissions/${submission.id}/ai-suggest`, {
        method: "POST",
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.error && data.error.includes("AI API Key is missing")) {
          setShowKeyConfig(true)
        }
        throw new Error(data.error || "Failed to generate AI suggestion")
      }

      const suggestedTotal = data.aiSuggestedScore ?? data.totalScore
      setFormData((prev) => ({
        ...prev,
        totalScore: suggestedTotal !== null && suggestedTotal !== undefined && suggestedTotal !== "" ? Math.round(Number(suggestedTotal)) : prev.totalScore,
        functionalityScore: data.functionalityScore !== null && data.functionalityScore !== undefined ? Math.round(Number(data.functionalityScore)) : prev.functionalityScore,
        qualityScore: data.qualityScore !== null && data.qualityScore !== undefined ? Math.round(Number(data.qualityScore)) : prev.qualityScore,
        aiDetectionScore: data.aiDetectionScore !== null && data.aiDetectionScore !== undefined ? Math.round(Number(data.aiDetectionScore)) : prev.aiDetectionScore,
        documentationScore: data.documentationScore !== null && data.documentationScore !== undefined ? Math.round(Number(data.documentationScore)) : prev.documentationScore,
        feedback: data.aiSuggestedFeedback ?? prev.feedback,
      }))
    } catch (err) {
      setError(err.message)
    } finally {
      setAiLoading(false)
    }
  }

  const handleSaveGradingCriteria = async (e) => {
    e.preventDefault()
    if (!assignment?.id) return

    setSavingCriteria(true)
    setError("")

    try {
      const res = await fetch(`/api/assignments/${assignment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requireDocumentation: requireDoc,
          gradingCriteria: {
            functionalityWeight: Number(funcWeight),
            qualityWeight: Number(qualWeight),
            aiDetectionWeight: Number(aiWeight),
            documentationWeight: requireDoc ? Number(docWeight) : 0,
          },
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to save grading criteria basis")
      }

      setShowCriteriaConfig(false)
      setError("")
      await handleGenerateAiSuggestion()
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingCriteria(false)
    }
  }

  const handleSaveApiKey = async (e) => {
    e.preventDefault()
    const targetWorkshopId = assignment?.workshopId || submission?.assignment?.workshopId
    if (!targetWorkshopId) {
      setError("Cannot update AI key: Assignment is not linked to a specific workshop cohort.")
      return
    }
    if (!aiApiKey.trim()) {
      setError("Please enter a valid API Key.")
      return
    }

    setSavingKey(true)
    setError("")

    try {
      const res = await fetch(`/api/workshops/${targetWorkshopId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aiProvider,
          aiApiKey: aiApiKey.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to save Workshop AI settings")
      }

      setShowKeyConfig(false)
      setError("")
      // Automatically trigger AI grading after saving key
      await handleGenerateAiSuggestion()
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingKey(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)

    try {
      const res = await fetch(`/api/admin/submissions/${submission.id}/grade`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalScore: Number(formData.totalScore),
          functionalityScore: formData.functionalityScore !== "" && formData.functionalityScore !== null ? Number(formData.functionalityScore) : null,
          qualityScore: formData.qualityScore !== "" && formData.qualityScore !== null ? Number(formData.qualityScore) : null,
          aiDetectionScore: formData.aiDetectionScore !== "" && formData.aiDetectionScore !== null ? Number(formData.aiDetectionScore) : null,
          documentationScore: formData.documentationScore !== "" && formData.documentationScore !== null ? Number(formData.documentationScore) : null,
          feedback: formData.feedback,
          isGradePublished: formData.isGradePublished,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Grading failed")
      }

      setSuccess(true)
      if (onGraded) onGraded(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6 max-w-2xl">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Evaluate Submission (v{submission.version})
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Student: <span className="font-medium text-gray-800">{submission.user?.name || submission.user?.email}</span>
          </p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-blue-100 text-blue-800">
          {submission.status}
        </span>
      </div>

      {assignment && (
        <div className="bg-blue-50/70 border border-blue-200/80 rounded-lg p-4 space-y-1.5 text-xs">
          <h4 className="font-bold text-blue-950 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-blue-600" />
            Problem Statement & Guidelines
          </h4>
          <p className="font-semibold text-blue-900">{assignment.title} (Max: {assignment.maxMarks} pts)</p>
          {assignment.description && (
            <p className="text-blue-800 line-clamp-2">{assignment.description}</p>
          )}
          {assignment.instructions && (
            <p className="text-blue-700 text-[11px] whitespace-pre-wrap pt-1 border-t border-blue-200/60 mt-1">
              {assignment.instructions}
            </p>
          )}
        </div>
      )}

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2 text-xs">
        <h4 className="font-semibold text-gray-700 uppercase tracking-wider mb-2">Student Artifacts</h4>
        {submission.repoUrl && (
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-gray-500" />
            <span className="font-medium text-gray-600">Repository:</span>
            <a href={submission.repoUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline truncate hover:text-blue-800">
              {submission.repoUrl}
            </a>
          </div>
        )}
        {submission.deploymentUrl && (
          <div className="flex items-center gap-2">
            <ExternalLink className="w-4 h-4 text-gray-500" />
            <span className="font-medium text-gray-600">Live Demo:</span>
            <a href={submission.deploymentUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline truncate hover:text-blue-800">
              {submission.deploymentUrl}
            </a>
          </div>
        )}
        {submission.driveUrl && (
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-purple-500" />
            <span className="font-medium text-gray-600">Drive / Video Demo:</span>
            <a href={submission.driveUrl} target="_blank" rel="noreferrer" className="text-purple-600 underline truncate hover:text-purple-800">
              {submission.driveUrl}
            </a>
          </div>
        )}
        {submission.fileUrls?.length > 0 && (
          <div className="space-y-1">
            <span className="font-medium text-gray-600">Attachments:</span>
            {submission.fileUrls.map((url, i) => (
              <div key={i} className="flex items-center gap-2 pl-2">
                <FileText className="w-3.5 h-3.5 text-gray-400" />
                <a href={url} target="_blank" rel="noreferrer" className="text-blue-600 underline truncate hover:text-blue-800">
                  {url}
                </a>
              </div>
            ))}
          </div>
        )}
        {submission.comments && (
          <div className="mt-2 pt-2 border-t border-gray-200 text-gray-600 italic">
            Student Comment: "{submission.comments}"
          </div>
        )}
      </div>

      <div className="space-y-3 bg-purple-50 border border-purple-200 rounded-lg p-3.5 text-xs">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="font-semibold text-purple-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-600" />
              Human-in-the-Loop AI Grading Assist
            </span>
            <p className="text-purple-700">Pre-fill marks and constructive draft feedback for instructor approval.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowCriteriaConfig(!showCriteriaConfig)}
              className="text-purple-700 hover:text-purple-900 hover:bg-purple-100 text-xs"
            >
              {showCriteriaConfig ? "Close Basis Setup" : "⚙️ Grading Basis"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowKeyConfig(!showKeyConfig)}
              className="text-purple-700 hover:text-purple-900 hover:bg-purple-100 text-xs"
            >
              {showKeyConfig ? "Close Key Setup" : "⚙️ AI Key Setup"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={aiLoading}
              onClick={handleGenerateAiSuggestion}
              className="border-purple-300 text-purple-800 hover:bg-purple-100 font-semibold"
            >
              {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Bot className="w-3.5 h-3.5 mr-1.5 text-purple-600" />}
              Generate AI Draft
            </Button>
          </div>
        </div>

        {showCriteriaConfig && (
          <form onSubmit={handleSaveGradingCriteria} className="pt-3 border-t border-purple-200/80 space-y-3 bg-white/80 p-3.5 rounded-md border border-purple-100">
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-950 text-xs">Configure Default Grading Basis for this Assignment</span>
              <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-medium">Saved per assignment</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div className="space-y-1">
                <Label htmlFor="funcWeight" className="text-[11px]">Functionality %</Label>
                <Input
                  id="funcWeight"
                  type="number"
                  min={0}
                  max={100}
                  className="h-8 text-xs"
                  value={funcWeight}
                  onChange={(e) => setFuncWeight(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="qualWeight" className="text-[11px]">Code Quality %</Label>
                <Input
                  id="qualWeight"
                  type="number"
                  min={0}
                  max={100}
                  className="h-8 text-xs"
                  value={qualWeight}
                  onChange={(e) => setQualWeight(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="aiWeight" className="text-[11px]">AI Detection %</Label>
                <Input
                  id="aiWeight"
                  type="number"
                  min={0}
                  max={100}
                  className="h-8 text-xs"
                  value={aiWeight}
                  onChange={(e) => setAiWeight(e.target.value)}
                />
              </div>

              {requireDoc && (
                <div className="space-y-1">
                  <Label htmlFor="docWeight" className="text-[11px]">Documentation %</Label>
                  <Input
                    id="docWeight"
                    type="number"
                    min={0}
                    max={100}
                    className="h-8 text-xs"
                    value={docWeight}
                    onChange={(e) => setDocWeight(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs cursor-pointer font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={requireDoc}
                  onChange={(e) => setRequireDoc(e.target.checked)}
                  className="w-3.5 h-3.5 text-purple-600 rounded"
                />
                Require Documentation Quality Score (README / Report)
              </label>

              <Button type="submit" size="sm" disabled={savingCriteria} className="bg-purple-700 hover:bg-purple-800 text-white text-xs h-7">
                {savingCriteria ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                Save Assignment Basis
              </Button>
            </div>
          </form>
        )}

        {showKeyConfig && (
          <form onSubmit={handleSaveApiKey} className="pt-3 border-t border-purple-200/80 space-y-3 bg-white/70 p-3 rounded-md border border-purple-100">
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-950 text-xs">Configure Workshop AI Provider API Key</span>
              <span className="text-[10px] text-purple-600">Saved to Workshop Settings</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label htmlFor="keyProvider" className="text-[11px]">AI Provider</Label>
                <select
                  id="keyProvider"
                  className="w-full rounded border border-gray-300 p-1.5 text-xs bg-white focus:ring-1 focus:ring-purple-500"
                  value={aiProvider}
                  onChange={(e) => setAiProvider(e.target.value)}
                >
                  <option value="GEMINI">Google Gemini Pro 1.5</option>
                  <option value="GROQ">Groq (Llama-3.3-70B)</option>
                  <option value="QWEN">Qwen 2.5 (Alibaba / Together)</option>
                  <option value="OPENAI">OpenAI GPT-4o</option>
                  <option value="CLAUDE">Anthropic Claude 3.5</option>
                  <option value="KIMI">Moonshot Kimi K3</option>
                </select>
              </div>

              <div className="md:col-span-2 space-y-1">
                <Label htmlFor="aiApiKey" className="text-[11px]">API Key (Saved Securely)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="aiApiKey"
                    type="password"
                    required
                    placeholder="e.g. AIza... or sk-..."
                    className="text-xs py-1 h-8"
                    value={aiApiKey}
                    onChange={(e) => setAiApiKey(e.target.value)}
                  />
                  <Button type="submit" size="sm" disabled={savingKey} className="bg-purple-700 hover:bg-purple-800 text-white text-xs h-8 whitespace-nowrap">
                    {savingKey ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                    Save Key & Evaluate
                  </Button>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
          <span>Grade & feedback saved successfully!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="totalScore" className="flex items-center gap-1.5 font-bold">
            <Award className="w-4 h-4 text-yellow-600" />
            Final Marks / Score (Max: {assignment.maxMarks})
          </Label>
          <Input
            id="totalScore"
            type="number"
            step="1"
            min={0}
            max={assignment.maxMarks}
            required
            placeholder="e.g. 85"
            value={formData.totalScore}
            onChange={(e) => setFormData({ ...formData, totalScore: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="funcScore" className="text-xs flex items-center gap-1 text-gray-600 font-semibold">
              <Code className="w-3.5 h-3.5 text-blue-600" /> Functionality (0-100)
            </Label>
            <Input
              id="funcScore"
              type="number"
              step="1"
              min={0}
              max={100}
              placeholder="e.g. 90"
              className="text-xs"
              value={formData.functionalityScore}
              onChange={(e) => setFormData({ ...formData, functionalityScore: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="qualScore" className="text-xs flex items-center gap-1 text-gray-600 font-semibold">
              <Code className="w-3.5 h-3.5 text-emerald-600" /> Code Quality (0-100)
            </Label>
            <Input
              id="qualScore"
              type="number"
              step="1"
              min={0}
              max={100}
              placeholder="Code Quality (0-100)"
              className="text-xs"
              value={formData.qualityScore}
              onChange={(e) => setFormData({ ...formData, qualityScore: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="aiScore" className="text-xs flex items-center gap-1 text-gray-600 font-semibold">
              <Bot className="w-3.5 h-3.5 text-purple-600" /> AI Detection %
            </Label>
            <Input
              id="aiScore"
              type="number"
              step="1"
              min={0}
              max={100}
              placeholder="Originality (0-100%)"
              className="text-xs"
              value={formData.aiDetectionScore}
              onChange={(e) => setFormData({ ...formData, aiDetectionScore: e.target.value })}
            />
          </div>

          {(requireDoc || formData.documentationScore !== "") && (
            <div className="space-y-1.5">
              <Label htmlFor="docScore" className="text-xs flex items-center gap-1 text-gray-600 font-semibold">
                <FileText className="w-3.5 h-3.5 text-indigo-600" /> Documentation (0-100)
              </Label>
              <Input
                id="docScore"
                type="number"
                step="1"
                min={0}
                max={100}
                placeholder="README / Doc (0-100)"
                className="text-xs"
                value={formData.documentationScore}
                onChange={(e) => setFormData({ ...formData, documentationScore: e.target.value })}
              />
            </div>
          )}
        </div>

        <div className="space-y-2 pt-2">
          <Label htmlFor="feedback">Instructor Feedback & Comments</Label>
          <textarea
            id="feedback"
            rows={4}
            className="w-full rounded-md border border-gray-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Constructive feedback for the student..."
            value={formData.feedback}
            onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="isGradePublished"
            checked={formData.isGradePublished}
            onChange={(e) => setFormData({ ...formData, isGradePublished: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded border-gray-300"
          />
          <Label htmlFor="isGradePublished" className="text-sm font-medium text-gray-700 cursor-pointer">
            Publish Grade to Student Immediately
          </Label>
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          Save & Submit Evaluation
        </Button>
      </form>
    </div>
  )
}
