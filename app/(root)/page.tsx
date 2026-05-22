
export default function HomeFeed() {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4 flex flex-col gap-6">
      <div className="border-b border-zinc-800 pb-4 mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Лента</h1>
        <p className="text-zinc-400 text-sm">Здесь будут отображаться посты пользователей.</p>
      </div>
      
      {/* Feed Placeholder */}
      <div className="flex flex-col items-center justify-center h-[50vh] border border-dashed border-zinc-800 rounded-2xl p-6 bg-zinc-950">
        <span className="text-zinc-400">Лента новостей пуста. Добавьте первый пост!</span>
      </div>
    </div>
  );
}
