// app/submit/[meetId]/SubmitFormClient.tsx
"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { db } from "@/lib/firebase";
import { doc, collection, addDoc, Timestamp } from "firebase/firestore";

type DQFormValues = {
  team: string;
  eventNumber: string;
  heatNumber: string;
  laneNumber: string;
  swimmerName: string;
  officialEmail: string;
};

interface SubmitFormClientProps {
  meetId: string;
  meetData: {
    invitedOfficials: { name: string; email: string }[];
  };
}

const INFRACTIONS = {
  Medley: [
    "Stroke Infraction",
    "Out of Sequence",
    "Fourth Distance Wrong Stroke",
  ],
  Butterfly: {
    Kick: ["Alternating", "Breast", "Scissors"],
    Arms: ["Non-Simultaneous", "Underwater Recovery"],
    Touch: ["One Hand", "Not Separated", "No Touch"],
    Other: [
      "Not Toward Wall",
      "Head Did Not Break Surface by 15m",
      "Re-Submerged",
    ],
  },
  Backstroke: {
    Other: [
      "No Touch At Turn",
      "Past Vertical at Turn",
      "Delay Arm Pull",
      "Delay Initiating Turn",
      "Multiple Strokes",
      "Toes Over Lip",
      "Head Did Not Break Surface by 15m",
      "Re-Submerged",
      "Not On Back",
      "Shoulders Past Vertical",
    ],
  },
  Breaststroke: {
    Kick: ["Alternating", "Butterfly", "Scissors"],
    Arms: ["Past Hipline", "Non-Simultaneous", "Elbows Recovered"],
    Touch: ["One Hand", "Not Separated", "No Touch"],
    Other: [
      "Not Toward Wall",
      "Cycle: Double Pulls/Kicks",
      "Kick Before Pull",
      "Head Not Up Before Hands Turn",
    ],
  },
  Freestyle: {
    Other: ["No Touch At Turn", "Head Did Not Break Surface by 15m", "Re-Submerged"],
  },
  Relays: { Other: ["Early Take Off", "Changed Order"] },
  Miscellaneous: { Other: ["False Start", "Declared False Start", "Did Not Finish", "Delay of Meet"] },
};

export default function SubmitFormClient({
  meetId,
  meetData,
}: SubmitFormClientProps) {
  const { register, handleSubmit } = useForm<DQFormValues>();
  const [selectedStroke, setSelectedStroke] = useState<string>("");
  const [selectedInfractions, setSelectedInfractions] = useState<string[]>([]);
  const [otherText, setOtherText] = useState<string>("");

  // Combine “Medley” + chosen stroke, remove duplicates
  const strokeTypes = Array.from(new Set(["Medley", selectedStroke]));

  const toggleInfraction = (label: string) => {
    setSelectedInfractions((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const onSubmit = async (data: DQFormValues) => {
    // Check email
    const allowed = meetData.invitedOfficials.some(
      (o) => o.email.toLowerCase() === data.officialEmail.toLowerCase()
    );
    if (!allowed) {
      alert("Email not authorized to submit for this meet.");
      return;
    }

    // Write to Firestore
    await addDoc(
      collection(doc(db, "meets", meetId), "dq_submissions"),
      {
        ...data,
        infractions: [
          ...selectedInfractions,
          ...(otherText ? [`Other: ${otherText}`] : []),
        ],
        submittedAt: Timestamp.now(),
        status: "pending",
      }
    );
    alert("DQ Submitted!");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-xl bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4 text-center">DQ Submission</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Team */}
          <input
            {...register("team")}
            placeholder="Team"
            className="w-full border p-3 rounded"
            required
          />

          {/* Event / Heat / Lane */}
          <div className="grid grid-cols-3 gap-4">
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

          {/* Stroke selector */}
          <select
            value={selectedStroke}
            onChange={(e) => {
              setSelectedStroke(e.target.value);
              setSelectedInfractions([]);
              setOtherText("");
            }}
            className="w-full border p-3 rounded"
            required
          >
            <option value="">Select Stroke</option>
            {Object.keys(INFRACTIONS).map((stroke) => (
              <option key={stroke} value={stroke}>
                {stroke}
              </option>
            ))}
          </select>

          {/* Infractions */}
          {selectedStroke && (
            <div className="space-y-6">
              {strokeTypes.map((type) => {
                const data = INFRACTIONS[type as keyof typeof INFRACTIONS];
                if (!data) return null;

                // Simple array (Medley)
                if (Array.isArray(data)) {
                  return (
                    <section key={type}>
                      <h2 className="font-semibold mb-2">{type} Infractions</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {data.map((label) => (
                          <button
                            key={label}
                            type="button"
                            onClick={() => toggleInfraction(label)}
                            className={`w-full px-4 py-3 rounded transition ${
                              selectedInfractions.includes(label)
                                ? "bg-black text-white"
                                : "bg-gray-200 text-gray-800"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </section>
                  );
                }

                // Object (stroke-specific groups)
                return (
                  <React.Fragment key={type}>
                    {Object.entries(data).map(
                      ([section, items]) =>
                        Array.isArray(items) && (
                          <section key={section}>
                            <h2 className="font-semibold mb-2">{section}</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {items.map((label) => {
                                const value = `${section}: ${label}`;
                                return (
                                  <button
                                    key={value}
                                    type="button"
                                    onClick={() => toggleInfraction(value)}
                                    className={`w-full px-4 py-3 rounded transition ${
                                      selectedInfractions.includes(value)
                                        ? "bg-black text-white"
                                        : "bg-gray-200 text-gray-800"
                                    }`}
                                  >
                                    {label}
                                  </button>
                                );
                              })}
                            </div>
                          </section>
                        )
                    )}
                  </React.Fragment>
                );
              })}

              {/* Other */}
              <div>
                <h2 className="font-semibold mb-2">Other</h2>
                <input
                  type="text"
                  value={otherText}
                  onChange={(e) => setOtherText(e.target.value)}
                  placeholder="Describe other infraction"
                  className="w-full border p-3 rounded"
                />
              </div>
            </div>
          )}

          {/* Email & Submit */}
          <div className="space-y-4">
            <input
              {...register("officialEmail")}
              placeholder="Your Email"
              type="email"
              required
              className="w-full border p-3 rounded"
            />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700 transition"
            >
              Submit DQ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
