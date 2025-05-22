"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";

type Official = { name: string; email: string };
type FormValues = {
  date: string;
  homeTeam: string;
  awayTeam: string;
  headOfficial: Official;
  invitedOfficials: Official[];
};

export default function CreateMeetPage() {
  const { register, control, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: {
      invitedOfficials: [{ name: "", email: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "invitedOfficials",
  });

  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [meetLink, setMeetLink] = useState<string | null>(null);

  const onSubmit = async (data: FormValues) => {
    setSubmitting(true);
    try {
      const meetName = `${data.homeTeam} vs ${data.awayTeam} - ${data.date}`;
      const meetRef = await addDoc(collection(db, "meets"), {
        ...data,
        name: meetName,
        createdAt: Timestamp.now(),
        status: "active"
      });
      setMeetLink(meetRef.id);
      reset();
    } catch (e) {
      console.error("Error creating meet:", e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Create Swim Meet</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input {...register("date")} type="date" className="w-full border p-2 rounded" required />
        <input {...register("homeTeam")} placeholder="Home Team" className="w-full border p-2 rounded" required />
        <input {...register("awayTeam")} placeholder="Away Team" className="w-full border p-2 rounded" required />
        
        <div>
          <h2 className="font-semibold">Head Official</h2>
          <input {...register("headOfficial.name")} placeholder="Name" className="w-full border p-2 rounded mt-1" required />
          <input {...register("headOfficial.email")} placeholder="Email" type="email" className="w-full border p-2 rounded mt-1" required />
        </div>

        <div>
          <h2 className="font-semibold">Invited Officials</h2>
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-2 mb-2">
              <input {...register(`invitedOfficials.${index}.name`)} placeholder="Name" className="flex-1 border p-2 rounded" required />
              <input {...register(`invitedOfficials.${index}.email`)} placeholder="Email" type="email" className="flex-1 border p-2 rounded" required />
              <button type="button" onClick={() => remove(index)} className="text-red-500 font-bold">X</button>
            </div>
          ))}
          <button type="button" onClick={() => append({ name: "", email: "" })} className="text-blue-600 underline">Add Official</button>
        </div>

        <button type="submit" disabled={submitting} className="bg-blue-500 text-white py-2 px-4 rounded">
          {submitting ? "Creating..." : "Create Meet"}
        </button>
      </form>

      {meetLink && (
        <div className="mt-4 p-4 bg-green-100 border border-green-400 rounded">
          <p className="font-bold">Meet created!</p>
          <p>Share these links:</p>
          <ul className="text-sm mt-2">
            <li><strong>Submit DQs:</strong> /submit/{meetLink}</li>
            <li><strong>Review DQs:</strong> /review/{meetLink}</li>
            <li><strong>Report:</strong> /report/{meetLink}</li>
          </ul>
        </div>
      )}
    </div>
  );
}