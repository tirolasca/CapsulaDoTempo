import { VideoRecorder } from "./components/VideoRecorder";
import { CapsuleList } from "./components/CapsuleList";
import { AuthButton } from "./components/AuthButton";
import { useAuth } from "./hooks/useAuth";

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-white">
        Carregando...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-950 p-6 text-white">
      <div className="max-w-xl mx-auto flex flex-col gap-8">
        {/* Header */}
        <header className="flex justify-between items-center">
          <h1 className="text-lg font-semibold tracking-wide">
            ⏳ Cápsula do Tempo
          </h1>
          <AuthButton user={user} />
        </header>

        {/* Conteúdo */}
        {user ? (
          <>
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-medium text-gray-300">
                Criar nova cápsula
              </h2>
              <VideoRecorder user={user} />
            </section>

            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-medium text-gray-300">
                Minhas cápsulas
              </h2>
              <CapsuleList user={user} />
            </section>
          </>
        ) : (
          <p className="text-center text-gray-400 mt-10">
            Faça login para criar e visualizar suas cápsulas do tempo.
          </p>
        )}
      </div>
    </div>
  );
}

export default App;
