import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plane, Calendar, Receipt, Users, Sparkles, Check, ArrowRight, Star, ChevronDown } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { ThemeToggle } from '../components/ThemeToggle';

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-stone-200 dark:border-stone-800 last:border-b-0">
      <button onClick={() => setOpen(!open)} className="w-full py-4 flex items-center justify-between text-left">
        <span className="font-medium text-stone-900 dark:text-white pr-4">{question}</span>
        <ChevronDown className={`w-4 h-4 text-stone-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="pb-4 text-sm text-stone-500 dark:text-stone-400 leading-relaxed">{answer}</p>}
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      <Helmet>
        <title>Trip Planner — Hecho para viajeros, por viajeros</title>
        <meta
          name="description"
          content="Crea itinerarios, divide gastos y mantén a tu grupo sincronizado. La herramienta de viajes construida desde la experiencia real."
        />
      </Helmet>

      <nav className="sticky top-0 z-50 bg-white/90 dark:bg-stone-900/90 backdrop-blur-xl border-b border-stone-100 dark:border-stone-800">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-brand-600 flex items-center justify-center">
              <Plane className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </div>
            <span className="font-bold text-sm sm:text-base text-stone-800 dark:text-white">Trip Planner</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Link
              to="/login"
              className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition-colors hidden xs:inline"
            >
              Iniciar sesión
            </Link>
            <Link to="/register" className="btn-primary text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2">
              Probar gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-50/80 via-transparent to-transparent dark:from-brand-950/30 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-20 sm:pt-28 lg:pt-36 pb-6 sm:pb-12 text-center relative">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 text-xs sm:text-sm font-medium mb-4 sm:mb-6">
            Hecho para viajeros, por viajeros
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-stone-900 dark:text-white tracking-tight leading-[1.08] max-w-[20ch] mx-auto">
            El planificador de viajes
            <br />
            <span className="text-brand-600 dark:text-brand-400">que ojalá hubiéramos tenido antes</span>
          </h1>
          <p className="mt-4 sm:mt-6 text-base sm:text-lg lg:text-xl text-stone-500 dark:text-stone-400 max-w-xl mx-auto leading-relaxed px-2">
            Construido por gente que se ha peleado con hojas de cálculo, grupos de WhatsApp y notas perdidas. Para que
            tu próximo viaje en grupo sea solo la parte divertida.
          </p>
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 px-4 sm:px-0">
            <Link
              to="/register"
              className="btn-primary px-8 sm:px-10 py-3.5 sm:py-4 text-base sm:text-lg w-full sm:w-auto justify-center shadow-lg shadow-brand-500/30 hover:shadow-xl hover:shadow-brand-500/40 transition-shadow"
            >
              Crear cuenta gratis
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
            </Link>
          </div>
          <p className="mt-3 sm:mt-4 text-[11px] sm:text-xs text-stone-400">Sin tarjeta. Empieza en 30 segundos.</p>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-20 sm:pb-28">
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { title: 'Finde en Barcelona', desc: '3 días · 8 actividades', icon: '🏖️' },
              { title: 'Tokio 7 días', desc: '7 días · 15 actividades', icon: '🗼' },
              { title: 'Ruta por Roma', desc: '4 días · 10 actividades', icon: '🏛️' },
            ].map((trip) => (
              <div key={trip.title} className="card p-4 sm:p-5 flex items-center gap-4 group cursor-default">
                <span className="text-2xl">{trip.icon}</span>
                <div>
                  <p className="font-medium text-sm text-stone-800 dark:text-stone-200">{trip.title}</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{trip.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem → Solution */}
      <section className="py-16 sm:py-24 lg:py-28 bg-stone-100/50 dark:bg-stone-900/50 overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900 dark:text-white">
              Lo hemos vivido. Por eso lo hemos arreglado.
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-8">
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                <span className="text-lg sm:text-xl">✕</span> Sin Trip Planner
              </h3>
              {[
                '47 mensajes de WhatsApp para decidir un restaurante',
                '"¿Quién pagó el hotel?" — nadie lo sabe',
                'Gastos en notas del móvil que desaparecen',
                'Cada persona tiene una versión distinta del plan',
              ].map((item) => (
                <p key={item} className="flex items-start gap-2 text-xs sm:text-sm text-stone-600 dark:text-stone-400">
                  <span className="text-red-400 shrink-0 mt-0.5">—</span> {item}
                </p>
              ))}
            </div>
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-semibold text-brand-600 dark:text-brand-400 flex items-center gap-2">
                <Check className="w-4 h-4 sm:w-5 sm:h-5" /> Con Trip Planner
              </h3>
              {[
                'Un solo sitio con todo el plan del viaje',
                'Cada gasto se divide solo. Sin calculadora',
                '"Tú debes 23€, yo debo 15€" — claro para todos',
                'El grupo entero ve los cambios al momento',
              ].map((item) => (
                <p key={item} className="flex items-start gap-2 text-xs sm:text-sm text-stone-600 dark:text-stone-400">
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-500 shrink-0 mt-0.5" /> {item}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-24 lg:py-28 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900 dark:text-white">
              Lo que hemos construido para ti
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                icon: Calendar,
                title: 'Itinerario claro',
                desc: 'Días, horarios y ubicaciones. Arrastra para reordenar. Sin capturas de pantalla ni PDFs reenviados.',
              },
              {
                icon: Receipt,
                title: 'Gastos que se entienden',
                desc: 'Registras un gasto y la app lo divide entre quien corresponda. Todo el grupo ve al instante quién debe qué.',
              },
              {
                icon: Sparkles,
                title: 'La IA te ayuda',
                desc: 'Dile "Finde en París" y te genera el itinerario completo. Perfecto para cuando no sabes por dónde empezar.',
              },
              {
                icon: Users,
                title: 'Todo el grupo dentro',
                desc: 'Invita a quien quieras. Cada persona ve el plan, añade actividades y registra lo que paga.',
              },
              {
                icon: Check,
                title: 'No te dejas nada',
                desc: 'Checklist de equipaje, tareas antes del viaje, plantillas según el tipo de destino. Todo controlado.',
              },
              {
                icon: Plane,
                title: 'Empieza rápido',
                desc: 'Templates listos: Barcelona, Tokio, Roma, Camino de Santiago... Elige uno y personalízalo.',
              },
            ].map((f) => (
              <div key={f.title} className="card p-4 sm:p-6">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-brand-50 dark:bg-brand-950/30 flex items-center justify-center mb-3 sm:mb-4">
                  <f.icon className="w-4 h-4 sm:w-5 sm:h-5 text-brand-600 dark:text-brand-400" />
                </div>
                <h3 className="font-semibold text-sm sm:text-base text-stone-900 dark:text-white mb-1.5 sm:mb-2">
                  {f.title}
                </h3>
                <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 sm:py-24 lg:py-28 bg-white dark:bg-stone-900 overflow-hidden">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900 dark:text-white">
              Así de simple es
            </h2>
          </div>
          <div className="space-y-6 sm:space-y-8">
            {[
              {
                step: '1',
                title: 'Crea el viaje',
                desc: 'Ponle nombre, elige fechas. O dile a la IA "Finde en París" y te lo crea entero en segundos.',
              },
              {
                step: '2',
                title: 'Añade el plan',
                desc: 'Días con actividades, horarios y gastos. Todo organizado. Todo el grupo lo ve.',
              },
              {
                step: '3',
                title: 'Comparte y disfruta',
                desc: 'Invita a quien viaja contigo. Ellos también pueden añadir cosas. Adiós al caos.',
              },
            ].map((s) => (
              <div key={s.step} className="flex gap-4 sm:gap-8">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-brand-600 text-white flex items-center justify-center text-lg sm:text-xl font-bold shrink-0">
                  {s.step}
                </div>
                <div className="pt-0.5 sm:pt-1">
                  <h3 className="text-base sm:text-xl font-semibold text-stone-900 dark:text-white">{s.title}</h3>
                  <p className="mt-0.5 sm:mt-1 text-xs sm:text-base text-stone-500 dark:text-stone-400">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-12 sm:py-16 bg-brand-600 text-white overflow-hidden">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="flex items-center justify-center gap-1 mb-3 sm:mb-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 fill-white text-white" />
            ))}
          </div>
          <p className="text-base sm:text-lg lg:text-xl font-medium max-w-xl mx-auto">
            "Por fin dejamos de usar WhatsApp para planificar. Ahora el grupo entero sabe qué toca cada día y quién ha
            pagado qué."
          </p>
          <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-white/60">— Grupo de 6 viajando por Japón</p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 sm:py-28 bg-white dark:bg-stone-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 dark:text-white">Así de simple es</h2>
          </div>
          <div className="space-y-8">
            {[
              {
                step: '1',
                title: 'Crea el viaje',
                desc: 'Ponle nombre, elige fechas. O dile a la IA "Finde en París" y te lo crea entero en segundos.',
              },
              {
                step: '2',
                title: 'Añade el plan',
                desc: 'Días con actividades, horarios y gastos. Todo organizado. Todo el grupo lo ve.',
              },
              {
                step: '3',
                title: 'Comparte y disfruta',
                desc: 'Invita a quien viaja contigo. Ellos también pueden añadir cosas. Adiós al caos.',
              },
            ].map((s) => (
              <div key={s.step} className="flex gap-5 sm:gap-8">
                <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center text-xl font-bold shrink-0">
                  {s.step}
                </div>
                <div className="pt-1">
                  <h3 className="text-xl font-semibold text-stone-900 dark:text-white">{s.title}</h3>
                  <p className="mt-1 text-stone-500 dark:text-stone-400">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-16 bg-brand-600 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="flex items-center justify-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="w-5 h-5 fill-white text-white" />
            ))}
          </div>
          <p className="text-lg sm:text-xl font-medium">
            "Por fin dejamos de usar WhatsApp para planificar. Ahora el grupo entero sabe qué toca cada día y quién ha
            pagado qué."
          </p>
          <p className="mt-4 text-sm text-white/60">— Grupo de 6 viajando por Japón</p>
        </div>
      </section>

      {/* FAQ — conversion focused */}
      <section className="py-20 sm:py-28">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-center text-stone-900 dark:text-white mb-4">¿Alguna duda?</h2>
          <p className="text-center text-stone-500 dark:text-stone-400 text-sm mb-12">
            Si no encuentras tu respuesta,{' '}
            <Link to="/register" className="text-brand-600 hover:underline">
              pruébalo gratis
            </Link>{' '}
            y lo ves en 30 segundos.
          </p>
          <div className="card p-4 sm:p-6 divide-y divide-stone-100 dark:divide-stone-800">
            <FAQItem
              question="¿Qué es exactamente Trip Planner?"
              answer="Una herramienta para planificar viajes en grupo. Itinerarios día a día, gastos compartidos que se dividen solos, checklists, y todo sincronizado para que el grupo entero lo vea. Sin WhatsApp, sin hojas de cálculo."
            />
            <FAQItem
              question="¿Es gratis?"
              answer="Sí, completamente. Todos los viajes que quieras, todas las personas que necesites, todas las funcionalidades. No hay trampa."
            />
            <FAQItem
              question="¿Cuánto se tarda en crear un viaje?"
              answer={
                '30 segundos si tienes claro el destino. Si usas la IA, escribes "Finde en París" y en segundos tienes el itinerario completo listo para editar.'
              }
            />
            <FAQItem
              question="¿Puedo usarlo con más gente?"
              answer="Claro. Invita a quien quieras. Cada persona ve el itinerario, puede añadir actividades y registrar lo que paga. Todo en tiempo real."
            />
            <FAQItem
              question="¿Cómo van los gastos?"
              answer="Registras un gasto, eliges quién pagó y entre quiénes se divide. La app calcula automáticamente quién debe qué a quién. Sin discusiones."
            />
            <FAQItem
              question="¿Funciona bien en el móvil?"
              answer="Está diseñado para usarse sobre todo en el móvil. Es donde más lo necesitas: en el aeropuerto, en el restaurante, en el hotel."
            />
            <FAQItem
              question="¿Qué lo diferencia de otras herramientas?"
              answer="Está construido por gente que ha viajado mucho y sabe lo que falla. No es un gestor de tareas genérico disfrazado de planificador de viajes. Está pensado específicamente para viajes en grupo."
            />
            <FAQItem
              question="¿Mis datos están seguros?"
              answer="Sí. Usamos Supabase como backend, con cifrado en tránsito y en reposo. Tus viajes solo los ves tú y la gente que invites."
            />
            <FAQItem
              question="¿Y si cambio de planes?"
              answer="Editar un viaje es instantáneo. Cambia fechas, añade días, mueve actividades. Todo adaptable. Los viajes cambian, la herramienta también."
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 sm:py-28 bg-gradient-to-br from-brand-600 to-brand-900 text-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold">Tu próximo viaje merece estar bien organizado</h2>
          <p className="mt-4 text-lg text-white/70">Gratis. Hecho con la experiencia de muchos viajes.</p>
          <div className="mt-10">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-white text-brand-700 px-10 py-4 rounded-xl font-semibold text-lg hover:bg-brand-50 transition-colors shadow-lg"
            >
              Crear cuenta gratis
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-stone-900 dark:bg-black text-stone-500 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Plane className="w-4 h-4 text-brand-400" />
              <span className="font-medium text-stone-400">Trip Planner</span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <Link to="/login" className="hover:text-stone-300 transition-colors">
                Iniciar sesión
              </Link>
              <Link to="/register" className="hover:text-stone-300 transition-colors">
                Registrarse
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-stone-800 text-center text-sm">
            Hecho para viajeros, por viajeros.
          </div>
        </div>
      </footer>
    </div>
  );
}
