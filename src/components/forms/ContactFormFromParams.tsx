"use client";

import { useSearchParams } from "next/navigation";
import { ContactForm } from "@/components/forms/ContactForm";

interface ContactFormFromParamsProps {
  showPhone?: boolean;
  showServiceSelect?: boolean;
  submitLabel?: string;
  tone?: "dark" | "light";
}

export function ContactFormFromParams(props: ContactFormFromParamsProps) {
  const searchParams = useSearchParams();
  const service = searchParams.get("service") ?? "";

  return <ContactForm {...props} initialService={service} />;
}
