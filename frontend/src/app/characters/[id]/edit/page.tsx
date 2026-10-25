import EditorScreen from "@/features/sheet/components/editor/EditorScreen";

export default async function EditCharacterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditorScreen characterId={id} />;
}
