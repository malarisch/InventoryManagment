import { ArticleTable } from "@/components/articleTable";

export default function ArticlesPage() {
  return (
    <main className="min-h-screen w-full flex flex-col items-center p-5">
      <div className="w-full max-w-5xl flex-1 flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">Articles</h1>
        <ArticleTable pageSize={10} />
      </div>
    </main>
  );
}

