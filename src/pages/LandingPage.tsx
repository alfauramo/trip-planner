import { Link } from 'react-router-dom';
import { Plane, Calendar, Receipt, Users, Sparkles, Check, ArrowRight, Star } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { ThemeToggle } from '../components/ThemeToggle';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      <Helmet>
        <title>Trip Planner — Planifica viajes en grupo sin el caos</title>
        <meta
          name="description"
          content="Crea itinerarios, divide gastos y mantén a tu grupo sincronizado. La forma más sencilla de planificar viajes entre amigos."
        />
      </Helmet>

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 dark:bg-stone-900/90 backdrop-blur-xl border-b border-stone-100 dark:border-stone-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center">
              <Plane className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-stone-800 dark:text-white">Trip Planner</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              to="/login"
              className="text-sm text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition-colors"
            >
              Iniciar sesión
            </Link>
            <Link to="/register" className="btn-primary text-sm px-4 py-2">
              Probar gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-50/80 via-transparent to-transparent dark:from-brand-950/30 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-8 sm:pt-36 sm:pb-12 text-center relative">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-stone-900 dark:text-white tracking-tight leading-[1.05]">
            Planifica viajes en grupo
            <br />
            <span className="text-brand-600 dark:text-brand-400">sin perder la cabeza</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-stone-500 dark:text-stone-400 max-w-xl mx-auto leading-relaxed">
            Itinerarios claros, gastos divididos automáticamente, y todo el grupo sincronizado. Deja los 47 mensajes de
            WhatsApp y las hojas de cálculo.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/register"
              className="btn-primary px-10 py-4 text-lg w-full sm:w-auto justify-center shadow-lg shadow-brand-500/30 hover:shadow-xl hover:shadow-brand-500/40 transition-shadow"
            >
              Crear cuenta gratis
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
          <p className="mt-4 text-xs text-stone-400">Sin tarjeta. Empieza en 30 segundos.</p>
        </div>

        {/* Demo cards preview */}
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
      <section className="py-20 sm:py-28 bg-stone-100/50 dark:bg-stone-900/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-brand-600 dark:text-brand-400 mb-3">EL PROBLEMA</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 dark:text-white">
              Planificar un viaje en grupo es un desastre
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                <span className="text-xl">✕</span> Sin Trip Planner
              </h3>
              {[
                'Mensajes perdidos en grupos de WhatsApp',
                'Gastos apuntados en notas y hojas de cálculo',
                'Nadie sabe quién debe qué a quién',
                'Cada persona tiene una versión del plan',
              ].map((item) => (
                <p key={item} className="flex items-start gap-2 text-sm text-stone-600 dark:text-stone-400">
                  <span className="text-red-400 shrink-0 mt-0.5">—</span>
                  {item}
                </p>
              ))}
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-brand-600 dark:text-brand-400 flex items-center gap-2">
                <Check className="w-5 h-5" /> Con Trip Planner
              </h3>
              {[
                'Un único sitio con todo el itinerario',
                'Gastos divididos automáticamente entre el grupo',
                'Cada persona ve lo que debe y lo que ha pagado',
                'Todo el mundo sincronizado en tiempo real',
              ].map((item) => (
                <p key={item} className="flex items-start gap-2 text-sm text-stone-600 dark:text-stone-400">
                  <Check className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                  {item}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features as benefits */}
      <section className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-brand-600 dark:text-brand-400 mb-3">QUÉ PUEDES HACER</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 dark:text-white">
              Todo lo que necesitas en un solo sitio
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Calendar,
                title: 'Itinerario visual',
                desc: 'Días, actividades, horarios y ubicaciones. Arrastra para reordenar. Todo claro para todo el grupo.',
              },
              {
                icon: Receipt,
                title: 'Gastos sin dramas',
                desc: 'Cada gasto se divide automáticamente. El grupo ve al instante quién debe qué. Sin calculadora.',
              },
              {
                icon: Sparkles,
                title: 'IA que planifica por ti',
                desc: 'Di "Tokio 7 días" y la IA te crea el itinerario completo. Días, actividades, horarios. En segundos.',
              },
              {
                icon: Users,
                title: 'Colaboración real',
                desc: 'Invita a quien quieras. Todo el grupo ve los cambios al momento. Sin reenviar PDFs.',
              },
              {
                icon: Check,
                title: 'Checklist de viaje',
                desc: 'Qué llevar, qué reservar, qué no olvidar. Plantillas por tipo de viaje. Progreso visible.',
              },
              {
                icon: Plane,
                title: 'Templates listos',
                desc: 'Barcelona 3 días, Tokio 7 días, Camino de Santiago... Empieza con un viaje ya diseñado.',
              },
            ].map((f) => (
              <div key={f.title} className="card p-6">
                <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/30 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                </div>
                <h3 className="font-semibold text-stone-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works — ultra simple */}
      <section className="py-20 sm:py-28 bg-white dark:bg-stone-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-brand-600 dark:text-brand-400 mb-3">EN 3 PASOS</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 dark:text-white">
              Del "¿por dónde empiezo?" al viaje listo
            </h2>
          </div>
          <div className="space-y-8">
            {[
              {
                step: '1',
                title: 'Crea el viaje',
                desc: 'Nombre, fechas, destino. O dile a la IA "Finde en París" y te lo crea entero.',
              },
              {
                step: '2',
                title: 'Añade el plan',
                desc: 'Días, actividades con horarios, gastos. Todo organizado y visible para el grupo.',
              },
              {
                step: '3',
                title: 'Invita y disfruta',
                desc: 'Comparte el enlace. El grupo ve el itinerario, añade gastos y colabora al instante.',
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

      {/* Social proof placeholder */}
      <section className="py-16 bg-brand-600 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="flex items-center justify-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="w-5 h-5 fill-white text-white" />
            ))}
          </div>
          <p className="text-lg sm:text-xl font-medium">
            "Por fin dejamos de usar WhatsApp para planificar los viajes. Ahora todo el grupo sabe qué toca cada día y
            quién ha pagado qué."
          </p>
          <p className="mt-4 text-sm text-white/60">— Usuario de Trip Planner</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 sm:py-28">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-center text-stone-900 dark:text-white mb-12">Preguntas frecuentes</h2>
          <div className="space-y-6">
            {[
              {
                q: '¿Es gratis?',
                a: 'Sí. Trip Planner es completamente gratuito. Crea todos los viajes que quieras, invita a quien necesites y usa todas las funcionalidades sin límite.',
              },
              {
                q: '¿Cuántas personas pueden colaborar en un viaje?',
                a: 'Sin límite. Invita a todos los que quieras. Cada persona puede ver el itinerario, añadir eventos y registrar gastos.',
              },
              {
                q: '¿Cómo funciona la división de gastos?',
                a: 'Cada gasto se registra indicando quién pagó y entre quiénes se divide. La app calcula automáticamente quién debe qué a quién. Adiós a la calculadora.',
              },
              {
                q: '¿La IA genera itinerarios reales?',
                a: 'Sí. Le dices el destino, los días y tus intereses, y la IA te crea un itinerario día a día con actividades, horarios y consejos. Puedes editarlo todo después.',
              },
              {
                q: '¿Puedo exportar el viaje?',
                a: 'Sí. Puedes imprimirlo como PDF, exportarlo a HTML o descargarlo como calendario (.ics) para llevarlo en Google Calendar o Apple Calendar.',
              },
            ].map((faq) => (
              <div key={faq.q}>
                <h3 className="font-semibold text-stone-900 dark:text-white mb-1">{faq.q}</h3>
                <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 sm:py-28 bg-gradient-to-br from-brand-600 to-brand-900 text-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold">Tu próximo viaje empieza aquí</h2>
          <p className="mt-4 text-lg text-white/70">Gratis. Sin anuncios. Sin límites.</p>
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

      {/* Footer */}
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
          <div className="mt-8 pt-8 border-t border-stone-800 text-center text-sm">Planifica. Viaja. Repite.</div>
        </div>
      </footer>
    </div>
  );
}
