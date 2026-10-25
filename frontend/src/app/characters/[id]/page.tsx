import SheetScreen from "@/features/sheet/components/sheet/SheetScreen";

export default async function CharacterSheetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SheetScreen characterId={id} />;
}
