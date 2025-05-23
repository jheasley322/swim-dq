// app/submit/[meetId]/SubmitFormClient.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, addDoc, Timestamp } from "firebase/firestore";

type DQValues = {
  team: string;
  eventNumber: string;
  heatNumber: string;
  laneNumber: string;
  swimmerName: string;
  stroke: string;
  email: string;
};

interface Props {
  meetId: string;
  invitedEmails: string[];
}

const INFRACTIONS: Record<string, string[]> = {
  Medley: ["Stroke Infraction", "Out of Sequence", "Fourth Distance Wrong Stroke"],
  Butterfly: [
    "Alternating",
    "Breast",
    "Scissors",
    "Underwater Recovery",
    "One Hand",
    "Not Separated",
    "No Touch",
    "Other",
  ],
  Backstroke: [
    "No Touch At Turn",
    "Past Vertical at Turn",
    "Delay Arm Pull",
    "Re-Submerged",
    "Other",
  ],
  Breaststroke: ["Alternating", "Butterfly", "Scissors", "Other"],
  Freestyle: ["No Touch At Turn", "Re-Submerged", "Other"],
  Relays: ["Early Take Off", "Changed Order", "Other"],
  Miscellaneous: ["False Start", "Did Not Finish", "Other"],
};

export default function SubmitFormClient({ meetId, invitedEmails }: Props) {
  const { register, handleSubmit, watch } = useForm<DQValues>();
  const [infractions, setInfractions] = useState<string[]>([]);
  const [otherText, setOtherText] = useState("");
  const selectedStroke = watch("stroke");

  // Fetch invited emails if you need dynamic loading (optional)
  useEffect(() => {
    // Already passed in as prop, so no fetch here
  }, []);

  const toggle = (label: string) => {
    setInfractions((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const onSubmit = async (data: DQValues) => {
    if (!invitedEmails.includes(data.email.toLowerCase())) {
      alert("Email not authorized.");
      return;
    }
    await addDoc(
      collection(doc(db, "meets", meetId), "dq_submissions"),
      {
        team: data.team,
        eventNumber: data.eventNumber,
        heatNumber: data.heatNumber,
        laneNumber: data.laneNumber,
        swimmerName: data.swimmerName,
        stroke: data.stroke,
        email: data.email,
        infractions: [
          ...infractions,
          ...(otherText.trim() ? [`Other: ${otherText.trim()}`] : []),
        ],
        submittedAt: Timestamp.now(),
        status: "pending",
      }
    );
    alert("DQ submitted!");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-center mb-6">DQ Submission</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Team */}
          <input
            {...register("team")}
            placeholder="Team"
            className="w-full border p-3 rounded"
            required
          />

          {/* Event / Heat / Lane */}
          <div className="grid grid-cols-3 gap-3">
            <input
              {...register("eventNumber")}
              placeholder="Event #"
              className="border p-3 rounded"
              required
            />
            <input
              {...register("heatNumber")}
              placeholder="Heat #"
              className="border p-3 rounded"
              required
            />
            <input
              {...register("laneNumber")}
              placeholder="Lane #"
              className="border p-3 rounded"
              required
            />
          </div>

          {/* Swimmer */}
          <input
            {...register("swimmerName")}
            placeholder="Swimmer Name"
            className="w-full border p-3 rounded"
            required
          />

          {/* Stroke Selector */}
          <select
            {...register("stroke")}
            className="w-full border p-3 rounded"
            required
          >
            <option value="">Select Stroke</option>
            {Object.keys(INFRACTIONS).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Infractions Pills */}
          {selectedStroke && (
            <div className="space-y-2">
              <p className="font-semibold text-center">Infractions</p>
              <div className="flex flex-wrap justify-center gap-2">
                {INFRACTIONS[selectedStroke]?.map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => toggle(label)}
                    className={`w-full sm:w-1/2 md:w-1/3 py-2 px-3 rounded-full text-sm transition text-center ${
                      infractions.includes(label)
                        ? "bg-black text-white"
                        : "bg-gray-200 text-gray-800"
                    }`}
                  >
                    {label}
                  </button>
                )) || (
                  <p className="text-sm italic text-center">
                    No infractions for {selectedStroke}.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Other */}
          <div className="mt-4">
            <p className="font-semibold mb-1">Other</p>
            <textarea
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
              placeholder="Describe other infraction"
              className="w-full border p-3 rounded"
              rows={2}
            />
          </div>

          {/* Email */}
          <input
            {...register("email")}
            placeholder="Your Email"
            type="email"
            className="w-full border p-3 rounded mt-4"
            required
          />

          {/* Submit */}
          <button className="w-full bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700 transition">
            Submit DQ
          </button>
        </form>
      </div>
    </div>
  );
}
