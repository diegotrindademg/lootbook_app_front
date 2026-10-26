import { redirect } from "next/navigation";

/** Equipment comes in the next version; Create on the Equipments tab starts a character (contract v1.1, 1). */
export default function NewEquipmentPage() {
  redirect("/characters/create");
}
