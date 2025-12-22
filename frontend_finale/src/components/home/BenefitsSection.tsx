// components/home/BenefitsSection.tsx
export default function BenefitsSection() {
  const benefits = [
    {
      title: "Time Savings",
      description: "Reduce document management time by 90%",
      stat: "90%",
      icon: "⏱️"
    },
    {
      title: "Cost Savings",
      description: "Decrease your physical storage and archiving costs",
      stat: "70%",
      icon: "💰"
    },
    {
      title: "Productivity",
      description: "Improve team efficiency with instant access",
      stat: "+85%",
      icon: "📈"
    },
    {
      title: "Compliance",
      description: "Meet legal standards with secure archiving",
      stat: "100%",
      icon: "✅"
    },
  ];

  return (
    <section className="py-20 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Why Choose DocScan?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              Join thousands of companies that have already transformed their document management with our innovative solution.
            </p>

            <div className="space-y-6">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-6 bg-gray-50 dark:bg-gray-800 rounded-xl hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex-shrink-0 text-4xl">
                    {benefit.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {benefit.title}
                      </h3>
                      <span className="px-3 py-1 text-sm font-bold text-blue-700 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 rounded-full">
                        {benefit.stat}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <img
              src="/images/benefits-illustration.svg"
              alt="Benefits"
              className="w-full h-auto"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  parent.innerHTML = `
                    <div class="w-full aspect-square bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl flex items-center justify-center">
                      <svg class="w-64 h-64 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  `;
                }
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}