import DateMap from '@/components/map/DateMap';

export default function Home() {
  return (
    <main className="max-w-md mx-auto min-h-screen p-4 flex flex-col gap-4">
      <header className="pt-2 pb-1">
        <h1 className="text-2xl font-black text-rose-500 tracking-tight">Routy</h1>
        <p className="text-sm font-medium text-gray-600">둘만의 데이트 찜 지도</p>
      </header>
      <DateMap />
    </main>
  );
}