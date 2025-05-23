// app/admin/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import Link from "next/link";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  Timestamp,
} from "firebase/firestore";

type Official = { name: string; email: string };
type Meet = {
  id: string;
  name: string;
  date: string;
  status: "active" | "closed";
  createdAt: Timestamp;
};

type FormValues = {
  date: string;
  homeTeam: string;
  awayTeam: string;
  headOfficial: Official;
  invitedOfficials: Official[];
};

export default function AdminPage() {
  const { register, control, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: { invitedOfficials: [{ name: "", email: "" }] },
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "invitedOfficials",
  });

  const [meets, setMeets] = useState<Meet[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [newId, setNewId] = useState<string | null>(null);

  // Fetch & sort meets by date, then createdAt
  async function fetchMeets() {
    const snap = await getDocs(collection(db, "meets"));
    const list = snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as any) } as Meet))
      .sort((a, b) => {
        const da = +new Date(a.date),
          dbd = +new Date(b.date);
        if (da !== dbd) return dbd - da;
        return b.createdAt.toMillis() - a.createdAt.toMillis();
      });
    setMeets(list);
  }

  useEffect(() => {
    fetchMeets();
  }, []);

  // Create a new meet
  async function onCreate(data: FormValues) {
    setSubmitting(true);
    const name = `${data.homeTeam} vs ${data.awayTeam} - ${data.date}`;
    const ref = await addDoc(collection(db, "meets"), {
      ...data,
      name,
      status: "active",
      createdAt: Timestamp.now(),
    });
    setNewId(ref.id);
    reset();
    await fetchMeets();
    setSubmitting(false);
  }

  // Close a meet
  async function onClose(id: string) {
    await updateDoc(doc(db, "meets", id), { status: "closed" });
    fetchMeets();
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex justify-center">
      <div className="w-full max-w-2xl space-y-8">
        {/* — Create Meet */}
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-4">Create Swim Meet</h2>
          <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
            <input
              {...register("date")}
              type="date"
              required
              className="w-full border p-2 rounded"
            />
            <input
              {...register("homeTeam")}
              placeholder="Home Team"
              required
              className="w-full border p-2 rounded"
            />
            <input
              {...register("awayTeam")}
              placeholder="Away Team"
              required
              className="w-full border p-2 rounded"
            />

            <div>
              <h3 className="font-medium">Head Official</h3>
              <input
                {...register("headOfficial.name")}
                placeholder="Name"
                required
                className="w-full border p-2 rounded mt-1"
              />
              <input
                {...register("headOfficial.email")}
                type="email"
                placeholder="Email"
                required
                className="w-full border p-2 rounded mt-1"
              />
            </div>

            <div>
              <h3 className="font-medium">Invited Officials</h3>
              {fields.map((f, i) => (
                <div
                  key={f.id}
                  className="flex gap-2 mt-2 items-center"
                >
                  <input
                    {...register(`invitedOfficials.${i}.name` as const)}
                    placeholder="Name"
                    required
                    className="flex-1 border p-2 rounded"
                  />
                  <input
                    {...register(`invitedOfficials.${i}.email` as const)}
                    placeholder="Email"
                    required
                    className="flex-1 border p-2 rounded"
                  />
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    className="text-red-500"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => append({ name: "", email: "" })}
                className="text-blue-600 mt-2"
              >
                + Add Official
              </button>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 text-white w-full py-2 rounded"
            >
              {submitting ? "Creating..." : "Create Meet"}
            </button>

            {newId && (
              <div className="mt-4 text-sm bg-green-100 p-3 rounded space-y-1">
                <div>
                  <Link href={`/submit/${newId}`} className="underline">
                    Submit
                  </Link>
                </div>
                <div>
                  <Link href={`/review/${newId}`} className="underline">
                    Review
                  </Link>
                </div>
                <div>
                  <Link href={`/report/${newId}`} className="underline">
                    Report
                  </Link>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* — All Meets */}
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-4">All Meets</h2>
          {meets.length === 0 ? (
            <p>No meets yet.</p>
          ) : (
            <ul className="space-y-4">
              {meets.map((m) => (
                <li key={m.id} className="p-4 border rounded">
                  <p className="font-semibold">{m.name}</p>
                  <p className="text-sm text-gray-600 mb-2">
                    Status: {m.status}
                  </p>
                  {m.status === "active" && (
                    <button
                      onClick={() => onClose(m.id)}
                      className="text-red-500 underline mb-2"
                    >
                      Close Meet
                    </button>
                  )}
                  <div className="space-y-1">
                    {m.status === "active" && (
                      <div>
                        <Link
                          href={`/submit/${m.id}`}
                          className="underline"
                        >
                          Submit
                        </Link>
                      </div>
                    )}
                    {m.status === "active" && (
                      <div>
                        <Link
                          href={`/review/${m.id}`}
                          className="underline"
                        >
                          Review
                        </Link>
                      </div>
                    )}
                    <div>
                      <Link
                        href={`/report/${m.id}`}
                        className="underline"
                      >
                        Report
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
