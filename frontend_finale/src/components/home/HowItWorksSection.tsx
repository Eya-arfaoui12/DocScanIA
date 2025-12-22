// components/home/HowItWorksSection.tsx
export default function HowItWorksSection() {
  const steps = [
    {
      number: "1",
      title: "Upload Your Documents",
      description: "Import your documents by drag-and-drop or scan them directly from your device.",
      icon: "📤"
    },
    {
      number: "2",
      title: "AI Analyzes Content",
      description: "Our artificial intelligence automatically analyzes and extracts important information.",
      icon: "🤖"
    },
    {
      number: "3",
      title: "Automatic Classification",
      description: "Documents are automatically classified by category and organized intelligently.",
      icon: "🗂️"
    },
    {
      number: "4",
      title: "Instant Access",
      description: "Find any document in seconds with intelligent search.",
      icon: "⚡"
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-brand-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            How It Works?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Four simple steps to digitize and organize your documents
          </p>
        </div>

        <div className="relative">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 via-purple-500 to-pink-500 transform -translate-y-1/2"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-brand-500 text-center">
                  {/* Step number */}
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 text-white font-bold text-2xl mb-6 shadow-lg">
                    {step.number}
                  </div>

                  {/* Icon */}
                  <div className="text-5xl mb-4">
                    {step.icon}
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {step.description}
                  </p>
                </div>

                {/* Arrow for mobile */}
                {index < steps.length - 1 && (
                  <div className="flex justify-center my-4 lg:hidden">
                    <svg className="w-8 h-8 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}