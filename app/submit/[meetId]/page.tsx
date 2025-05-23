// app/submit/[meetId]/page.tsx
import React from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import SubmitFormClient from "./SubmitFormClient";

interface PageProps {
  params: { meetId: string };
}

export const revalidate = 0; // always fresh in dev

export default async function Page({ params: { meetId } }: PageProps) {
  // Fetch meet data on the server
  const ref = doc(db, "meets", meetId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    return <p className="p-4 text-red-600">Meet not found.</p>;
  }

  // We know invitedOfficials exists in your meet docs
  const meetData = snap.data() as {
    invitedOfficials: { name: string; email: string }[];
  };

  // Render the interactive client form
  return <SubmitFormClient meetId={meetId} meetData={meetData} />;
}
