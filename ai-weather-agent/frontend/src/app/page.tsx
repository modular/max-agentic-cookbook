import Chat from './components/Chat';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto"> {/* Increased from max-w-6xl */}
        <h1 className="text-3xl font-bold text-center mb-8">
          Personalized AI Weather Agent
        </h1>

        {/* Increased width and height */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden w-[1000px] h-[800px] mx-auto">
          <Chat />
        </div>
      </div>
    </div>
  );
}
