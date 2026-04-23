import {
  Leaf,
  Shield,
  Wifi,
  CheckCircle,
  Users,
  Sprout,
  MessageSquare,
  Camera,
  CloudSun,
} from "lucide-react";

const STATS = [
  { value: "5+", label: "Core Crop Profiles" },
  { value: "2", label: "Working Languages" },
  { value: "24/7", label: "Field Support Availability" },
  { value: "Offline", label: "Primary Operating Mode" },
] as const;

const CAPABILITIES = [
  {
    title: "Disease Detection",
    description:
      "Analyze crop and leaf photos to identify likely disease patterns and receive practical next-step guidance.",
    icon: Camera,
  },
  {
    title: "Advisory Guidance",
    description:
      "Get clear recommendations for irrigation, nutrition, pest prevention, and seasonal crop care.",
    icon: Sprout,
  },
  {
    title: "Conversational Support",
    description:
      "Ask farming questions in natural language and receive concise, decision-focused responses.",
    icon: MessageSquare,
  },
  {
    title: "Weather-Aware Decisions",
    description:
      "Use weather context to plan field operations, reduce risk, and improve timing of critical actions.",
    icon: CloudSun,
  },
] as const;

const PRINCIPLES = [
  {
    title: "Farmer First",
    description:
      "Designed for practical use in real field conditions with clear language and actionable recommendations.",
    icon: Users,
  },
  {
    title: "Private by Design",
    description:
      "Farm data and images stay under your control, with a privacy-focused experience by default.",
    icon: Shield,
  },
  {
    title: "Reliable Offline Access",
    description:
      "Built for regions with unstable connectivity so support remains available when it is needed most.",
    icon: Wifi,
  },
] as const;

const IMPACT_AREAS = [
  "Faster disease response and treatment planning",
  "Improved irrigation and fertilizer timing",
  "Better preparedness for weather-related risks",
  "Consistent guidance across the crop lifecycle",
  "Greater confidence in day-to-day field decisions",
  "Accessible support in English and Bangla",
] as const;

export default function AboutPage() {
  return (
    <div className="bg-white">
      <section className="bg-gradient-to-br from-primary-800 via-primary-700 to-primary-600 text-white py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary-400/60 bg-primary-600/60 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-primary-100">
            <Leaf size={14} />
            Agriculture Intelligence Platform
          </div>

          <h1 className="mt-6 text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight max-w-4xl">
            KrishiBot helps farming teams make confident, data-informed crop decisions.
          </h1>

          <p className="mt-5 text-primary-100 text-lg max-w-3xl leading-relaxed">
            KrishiBot delivers practical agricultural support through disease analysis,
            guided advisory workflows, and conversational assistance tailored to real
            field operations.
          </p>
        </div>
      </section>

      <section className="py-12 sm:py-14 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {STATS.map(({ value, label }) => (
              <div
                key={label}
                className="rounded-2xl border border-primary-100 bg-primary-50 px-5 py-6 text-center"
              >
                <div className="text-3xl sm:text-4xl font-extrabold text-primary-700 tracking-tight">
                  {value}
                </div>
                <div className="mt-1 text-xs sm:text-sm font-semibold uppercase tracking-wide text-gray-600">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900">What KrishiBot Delivers</h2>
          <p className="mt-4 text-lg text-gray-600 max-w-3xl leading-relaxed">
            The platform is designed to reduce uncertainty in field operations and support
            faster, clearer agricultural decisions across crop planning, protection, and
            production.
          </p>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {CAPABILITIES.map(({ title, description, icon: Icon }) => (
              <div
                key={title}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-100">
                  <Icon size={21} className="text-primary-700" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-gray-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-primary-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900">How We Build Trust</h2>
          <p className="mt-4 text-lg text-gray-600 max-w-3xl leading-relaxed">
            KrishiBot is built around reliability, clarity, and ownership of data,
            so advisory support stays practical and dependable in real-world use.
          </p>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {PRINCIPLES.map(({ title, description, icon: Icon }) => (
              <div
                key={title}
                className="rounded-2xl border border-primary-100 bg-white p-6"
              >
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-100">
                  <Icon size={20} className="text-primary-700" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-gray-900">{title}</h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900">Operational Value</h2>
          <p className="mt-4 text-lg text-gray-600 max-w-3xl leading-relaxed">
            Teams using KrishiBot can standardize advisory workflows and respond more
            quickly to common crop health and planning challenges.
          </p>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {IMPACT_AREAS.map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-xl border border-primary-100 bg-primary-50 p-4"
              >
                <CheckCircle size={18} className="mt-0.5 shrink-0 text-primary-700" />
                <span className="text-sm leading-relaxed text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
