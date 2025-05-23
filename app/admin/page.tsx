"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { Timestamp, collection, addDoc, getDocs, updateDoc, doc } from "firebase/firestore";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import Link from "next/link";

interface Official {
  name: string;
  email: string;
}

interface Meet {
  id: string;
  name: string;
  date: string;
  status: string;
  createdAt: Timestamp;
}

interface FormValues {
  date: string;
  homeTeam: string;
  awayTeam: string;
  headOfficial: Official;
  invitedOfficials: Official[];
}

export default function AdminPage() {
  const { register, control, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: {
      invitedOfficials: [{ name: "", email: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "invitedOfficials",
  });

  const [submitting, setSubmitting] = useState(false);
  const [meets, setMeets] = useState<Meet[]>([]);
  const [createdMeetId, setCreatedMeetId] = useState<string | null>(null);

  const onSubmit = async (data: FormValues) => {
    setSubmitting(true);
    try {
      const meetName = `${data.homeTeam} vs ${data.awayTeam} - ${data.date}`;
      const meetRef = await addDoc(collection(db, "meets"), {
        ...data,
        name: meetName,
        createdAt: Timestamp.now(),
        status: "active",
      });
      setCreatedMeetId(meetRef.id);
      reset();
      fetchMeets();
    } catch (e) {
      console.error("Error creating meet:", e);
    } finally {
      setSubmitting(false);
    }
  };

  const fetchMeets = async () => {
    const snapshot = await getDocs(collection(db, "meets"));
    const results: Meet[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name,
        date: data.date,
        status: data.status,
        createdAt: data.createdAt,
      };
    });

    results.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) return dateB - dateA;

      const createdA = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0;
      const createdB = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0;
      return createdB - createdA;
    });

    setMeets(results);
  };

  const closeMeet = async (id: string) => {
    const ref = doc(db, "meets", id);
    await updateDoc(ref, { status: "closed" });
    fetchMeets();
  };

  useEffect(() => {
    fetchMeets();
  }, []);

  const renderLink = (label: string, href: string) => (
    <Link href={href} className="text-blue-600 underline" title={typeof window !== 'undefined' ? `${window.location.origin}${href}` : href}>
      {label}
    </Link>
  );

  return (
    <div className="max-w-xl mx-auto p-4 space-y-8">
      <div>
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

        {createdMeetId && (
          <div className="mt-4 p-4 bg-green-100 border border-green-400 rounded">
            <p className="font-bold">Meet created!</p>
            <ul className="text-sm mt-2">
              <li><strong>Submit:</strong> {renderLink("Submit DQs", `/submit/${createdMeetId}`)}</li>
              <li><strong>Review:</strong> {renderLink("Review DQs", `/review/${createdMeetId}`)}</li>
              <li><strong>Report:</strong> {renderLink("Meet Report", `/report/${createdMeetId}`)}</li>
            </ul>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-bold mb-2">All Meets</h2>
        {meets.length === 0 ? (
          <p>No meets found.</p>
        ) : (
          <ul className="space-y-2">
            {meets.map((meet) => (
              <li key={meet.id} className="border p-2 rounded space-y-1">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{meet.name}</p>
                    <p className="text-sm text-gray-600">Status: {meet.status}</p>
                  </div>
                  {meet.status === "active" && (
                    <button onClick={() => closeMeet(meet.id)} className="text-red-500 underline">Close Meet</button>
                  )}
                </div>
                <div className="pl-2 text-sm space-y-1">
                  {meet.status === "active" && (
                    <>
                      <div><strong>Submit:</strong> {renderLink("Submit DQs", `/submit/${meet.id}`)}</div>
                      <div><strong>Review:</strong> {renderLink("Review DQs", `/review/${meet.id}`)}</div>
                    </>
                  )}
                  <div><strong>Report:</strong> {renderLink("Meet Report", `/report/${meet.id}`)}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
