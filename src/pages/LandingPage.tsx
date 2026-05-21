import { Link } from 'react-router-dom';
import { Plane, Calendar, Receipt, Users, Sparkles, Globe, ArrowRight, Check } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      <Helmet>
        <title>Trip Planner — Planifica tus viajes de forma inteligente</title>
        <meta
          name="description"
          content="Crea itinerarios, controla gastos y comparte la experiencia con Trip Planner. La forma más fácil de organizar tus viajes en grupo."
        />
      </Helmet>

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 dark:bg-stone-900/90 backdrop-blur-xl border-b border-stone-100 dark:border-stone-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-sm shadow-brand-200 dark:shadow-brand-900/30">
              <Plane className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-stone-800 dark:text-white">Trip Planner</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition-colors"
            >
              Iniciar sesión
            </Link>
            <Link to="/register" className="btn-primary text-sm px-4 py-2">
              Registrarse gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-50/50 to-transparent dark:from-brand-950/30 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-20 pb-24 sm:pt-32 sm:pb-36 text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Planificación inteligente de viajes
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-stone-900 dark:text-white tracking-tight leading-[1.1]">
            Viajes en grupo
            <br />
            <span className="text-brand-600 dark:text-brand-400">sin el caos</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-stone-500 dark:text-stone-400 max-w-2xl mx-auto leading-relaxed">
            Crea itinerarios, controla gastos compartidos y mantén a todo el grupo sincronizado. La herramienta que
            convierte planificar un viaje en algo tan divertido como hacerlo.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="btn-primary px-8 py-4 text-lg w-full sm:w-auto justify-center">
              Empezar gratis
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link to="/login" className="btn-secondary px-8 py-4 text-lg w-full sm:w-auto justify-center">
              Iniciar sesión
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 sm:py-28 bg-white dark:bg-stone-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 dark:text-white">
              Todo lo que necesitas para tu viaje
            </h2>
            <p className="mt-4 text-lg text-stone-500 dark:text-stone-400 max-w-xl mx-auto">
              Funcionalidades diseñadas para que planificar sea rápido, claro y colaborativo.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Calendar,
                title: 'Itinerario día a día',
                desc: 'Organiza cada jornada con actividades, horarios y ubicaciones. Arrastra y suelta para reordenar.',
              },
              {
                icon: Receipt,
                title: 'Control de gastos',
                desc: 'Registra gastos, divide cuentas automáticamente y ve quién debe qué en cada momento.',
              },
              {
                icon: Users,
                title: 'Viajes en grupo',
                desc: 'Invita a quien quieras, asigna roles y colabora en tiempo real con todo el grupo.',
              },
              {
                icon: Sparkles,
                title: 'IA generativa',
                desc: 'Describe tu destino y la IA crea un itinerario completo con días, actividades y horarios.',
              },
              {
                icon: Globe,
                title: 'Templates listos',
                desc: 'Empieza con plantillas curadas: Barcelona, Tokio, Roma, Bali y más destinos.',
              },
              {
                icon: Check,
                title: 'Checklist inteligente',
                desc: 'Listas de equipaje con plantillas, tareas pre-viaje y seguimiento de progreso.',
              },
            ].map((f) => (
              <div key={f.title} className="card p-6 sm:p-8">
                <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/50 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                </div>
                <h3 className="font-semibold text-stone-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 dark:text-white">En tres pasos</h2>
            <p className="mt-4 text-lg text-stone-500 dark:text-stone-400">
              Del "¿por dónde empiezo?" al "ya está todo listo" en minutos.
            </p>
          </div>
          <div className="space-y-12 sm:space-y-16">
            {[
              {
                step: '1',
                title: 'Crea tu viaje',
                desc: 'Ponle nombre, elige fechas y decide quién viene. O deja que la IA te genere un itinerario completo desde cero.',
              },
              {
                step: '2',
                title: 'Añade actividades y gastos',
                desc: 'Cada día tiene sus eventos con horarios, ubicaciones y costes. Los gastos se dividen automáticamente entre el grupo.',
              },
              {
                step: '3',
                title: 'Comparte y disfruta',
                desc: 'Invita a tus compañeros, sincroniza todo en tiempo real y olvídate de los grupos de WhatsApp para planificar.',
              },
            ].map((s, i) => (
              <div key={s.step} className="flex flex-col sm:flex-row items-start gap-6 sm:gap-10">
                <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center text-xl font-bold shrink-0 shadow-lg shadow-brand-500/30">
                  {s.step}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-stone-900 dark:text-white mb-2">{s.title}</h3>
                  <p className="text-stone-500 dark:text-stone-400 leading-relaxed">{s.desc}</p>
                </div>
                {i < 2 && (
                  <div className="hidden sm:block w-px h-16 bg-stone-200 dark:bg-stone-700 ml-6 absolute translate-x-[23px] translate-y-[52px]" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28 bg-gradient-to-br from-brand-600 to-brand-900 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold">Empieza a planificar tu próximo viaje</h2>
          <p className="mt-4 text-lg text-white/70 max-w-xl mx-auto">
            Gratis, sin límites. Crea tu primer viaje en menos de un minuto.
          </p>
          <div className="mt-10">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-white text-brand-700 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-brand-50 transition-colors shadow-lg"
            >
              Crear cuenta gratis
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-900 dark:bg-black text-stone-400 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Plane className="w-4 h-4 text-brand-400" />
              <span className="font-medium text-stone-300">Trip Planner</span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <Link to="/login" className="hover:text-white transition-colors">
                Iniciar sesión
              </Link>
              <Link to="/register" className="hover:text-white transition-colors">
                Registrarse
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-stone-800 text-center text-sm text-stone-500">
            Hecho para viajeros, por viajeros.
          </div>
        </div>
      </footer>
    </div>
  );
}
