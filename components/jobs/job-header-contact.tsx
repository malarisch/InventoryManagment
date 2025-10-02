"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { JobContactModal } from "@/components/forms/job-contact-modal";

interface JobHeaderContactProps {
  jobId: number;
  companyId: number;
  contactId: number | null;
  contactDisplay: string | null;
}

export function JobHeaderContact({ jobId, companyId, contactId, contactDisplay }: JobHeaderContactProps) {
  const [modalOpen, setModalOpen] = useState(false);

  if (!contactId || !contactDisplay) {
    return (
      <>
        <span className="text-muted-foreground">Kein Kontakt zugewiesen</span>
        <Button variant="outline" size="sm" onClick={() => setModalOpen(true)}>
          Kontakt hinzufügen
        </Button>
        <JobContactModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          jobId={jobId}
          companyId={companyId}
          currentContactId={contactId}
        />
      </>
    );
  }

  return (
    <>
      <span>
        Kontakt:{" "}
        <Link href={`/management/contacts/${contactId}`} className="text-primary hover:underline">
          {contactDisplay}
        </Link>
      </span>
      <Button variant="outline" size="sm" onClick={() => setModalOpen(true)}>
        Ändern
      </Button>
      <JobContactModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        jobId={jobId}
        companyId={companyId}
        currentContactId={contactId}
      />
    </>
  );
}
