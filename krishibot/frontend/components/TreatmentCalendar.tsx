"use client"
import { useState, useEffect } from 'react'
import { generateTreatmentSchedule, type TreatmentSchedule } from '@/lib/api'

interface Props {
  diseaseName: string
  cropName: string
  severityStage: string
}

export default function TreatmentCalendar({
  diseaseName, cropName, severityStage
}: Props) {
  const [schedule, setSchedule] = useState<TreatmentSchedule | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function load() {
      try {
        const result = await generateTreatmentSchedule(
          diseaseName, cropName, severityStage
        )
        setSchedule(result)
      } catch {
        setError("Could not generate treatment schedule. Please try again.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [diseaseName, cropName, severityStage])

  if (loading) return (
    <div className="mt-4 p-4 bg-white rounded-xl border border-gray-100">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <div className="w-4 h-4 border-2 border-green-500
          border-t-transparent rounded-full animate-spin"/>
        Generating treatment calendar...
      </div>
    </div>
  )

  if (error) return (
    <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
      <p className="text-sm text-amber-700">{error}</p>
    </div>
  )

  if (!schedule) return null

  return (
    <div className="mt-4 bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 bg-primary-50 border-b border-primary-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-primary-800">
          Treatment Calendar
          </h3>
          <p className="text-xs text-primary-600 mt-0.5">
            {diseaseName} — {severityStage} severity
          </p>
        </div>
        <span className="text-xs bg-primary-100 text-primary-800 px-3 py-1 rounded-full font-medium border border-primary-200">
          {schedule.total_days} day plan
        </span>
      </div>

      <div className="p-4">
        <div className="relative">
        {schedule.schedule.map((item, index) => (
          <div key={index} className="flex gap-3 mb-3">
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0 z-10 ${index === 0 ? 'bg-primary-600' : index === 1 ? 'bg-primary-500' : index === 2 ? 'bg-amber-500' : 'bg-green-600'}`}>
                D{item.day}
              </div>
              {index < schedule.schedule.length - 1 && (
                <div className="w-0.5 bg-primary-100 flex-1 mt-1 min-h-3"/>
              )}
            </div>

            <div className="flex-1 pb-2">
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <p className="text-sm font-medium text-gray-800">
                  {item.action}
                </p>
                {item.product !== "None" && (
                  <span className="inline-block mt-1 text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium">
                    {item.product}
                  </span>
                )}
                <p className="text-xs text-gray-500 mt-1">{item.notes}</p>
              </div>
            </div>
          </div>
        ))}
        </div>

        <div className="mt-2 p-3 bg-amber-50 rounded-lg border border-amber-100">
          <p className="text-xs font-semibold text-amber-800 mb-1">After treatment period</p>
          <p className="text-xs text-amber-700">{schedule.follow_up}</p>
        </div>
      </div>
    </div>
  )
}
