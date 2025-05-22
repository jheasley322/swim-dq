

"use client";

import { useForm, Controller } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "../../../lib/firebase";
import { doc, getDoc, collection, addDoc, Timestamp } from "firebase/firestore";

interface DQFormValues {
  officialEmail: string;
  swimmerName: string;
  team: string;
  eventNumber: string;
  heatNumber: string;
  laneNumber: string;
  eventType: string;
  infractions: string[];
  notes: string;
}

const INFRACTIONS_MAP: Record<string, string[]> = {
  Butterfly: [
    "Kick: Alternating", "Kick: Breast", "Kick: Scissors",
    "Arms: Non-Simultaneous", "Arms: Underwater Recovery",
    "Touch: One Hand", "Touch: Not Separated", "No Touch",
    "Not Toward Wall", "Head Did Not Break Surface by 15m",
    "Re-Submerged", "Other"
  ],
  Backstroke: [
    "No Touch At Turn", "Past Vertical at Turn", "Delay Arm Pull",
    "Delay Initiating Turn", "Multiple Strokes", "Toes Over Lip",
    "Head Did Not Break Surface by 15m", "Re-Submerged",
    "Not On Back", "Shoulders Past Vertical", "Other"
  ],
  Breaststroke: [
    "Kick: Alternating", "Kick: Butterfly", "Kick: Scissors",
    "Arms: Past Hipline", "Arms: Non-Simultaneous",
    "Elbows Recovered", "Touch: One Hand", "Touch: Not Separated",
    "No Touch", "Not Toward Wall", "Cycle: Double Pulls/Kicks",
    "Kick Before Pull", "Head Not Up Before Hands Turn", "Other"
  ],
  Freestyle: [
    "No Touch At Turn", "Head Did Not Break Surface by 15m", "Re-Submerged", "Other"
  ],
  IM: [
    "Stroke Infraction", "Out of Sequence", "Fourth Distance Wrong Stroke", "Other"
  ],
  Relays: [
    "Stroke Infraction", "Early Take Off", "Changed Order", "Other"
  ],
  Miscellaneous: [
    "False Start", "Declared False Start", "Did Not Finish", "Delay of Meet", "Other"
  ]
};

export default function SubmitDQPage({ params }: { params: { meetId: string } }) {
  const { meetId } = params;
  const { register, handleSubmit, watch, setValue, control } = useForm<DQFormValues>();
  const [loading, setLoading] = useState(true);
  const [meetData, setMeetData] = useState<any>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const selectedEvent = watch("eventType");

  useEffect(() => {
    const fetchMeet = async () => {
      const docRef = doc(db, "meets", meetId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMeetData(data);
      } else {
        setUnauthorized(true);
      }
      setLoading(false);
    };
    fetchMeet();
  }, [meetId]);

  const onSubmit = async (data: DQFormValues) => {
    if (!meetData) return;

    const allowed = meetData.invitedOfficials.some(
      (o: any) => o.email.toLowerCase() === data.officialEmail.toLowerCase()
    );

    if (!allowed) {
      alert("Email not authorized to submit for this meet.");
      return;
    }

    await addDoc(collection(doc(db, "meets", meetId), "dq_submissions"), {
      ...data,
      submittedAt: Timestamp.now(),
      status: "pending"
    });

    alert("DQ Submitted!");
  };

  if (loading) return <p className="p-4">Loading...</p>;
  if (unauthorized) return <p className="p-4 text-red-600">Meet not found.</p>;

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">DQ Submission</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input {...register("officialEmail")} placeholder="Your Email" type="email" required className="w-full border p-2 rounded" />
        <input {...register("swimmerName")} placeholder="Swimmer Name" required className="w-full border p-2 rounded" />
        <input {...register("team")} placeholder="Team" required className="w-full border p-2 rounded" />
        <div className="flex gap-2">
          <input {...register("eventNumber")} placeholder="Event #" required className="w-full border p-2 rounded" />
          <input {...register("heatNumber")} placeholder="Heat #" required className="w-full border p-2 rounded" />
          <input {...register("laneNumber")} placeholder="Lane #" required className="w-full border p-2 rounded" />
        </div>
        <select {...register("eventType")} className="w-full border p-2 rounded" required>
          <option value="">Select Stroke</option>
          {Object.keys(INFRACTIONS_MAP).map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        {selectedEvent && (
          <div className="space-y-1">
            <label className="block font-semibold">Infractions</label>
            {INFRACTIONS_MAP[selectedEvent]?.map((infraction, index) => (
              <label key={index} className="block">
                <input
                  type="checkbox"
                  value={infraction}
                  {...register("infractions")}
                  className="mr-2"
                />
                {infraction}
              </label>
            ))}
          </div>
        )}
        <textarea {...register("notes")} placeholder="Optional notes..." className="w-full border p-2 rounded" />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Submit DQ</button>
      </form>
    </div>
  );
}