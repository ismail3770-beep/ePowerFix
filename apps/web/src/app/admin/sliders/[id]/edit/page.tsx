"use client";
import { SliderForm } from "@/components/admin/SliderForm";
import { useParams } from "next/navigation";

export default function EditSliderPage() {
  const { id } = useParams() as { id: string };

  const data = {
    id,
    name: "Main Slider",
  };

  return <SliderForm initialData={data} />;
}
