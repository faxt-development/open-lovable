const HowItWorks = () => {
  const steps = [
    {
      id: '01',
      name: 'Sign Up',
      description: 'Create your account and set up your shop profile with basic information about your business.',
    },
    {
      id: '02',
      name: 'Customize Your Workflow',
      description: 'Configure service categories, pricing, technician schedules, and customer communication preferences.',
    },
    {
      id: '03',
      name: 'Import Your Data',
      description: 'Upload your customer database, vehicle information, and inventory details to get started quickly.',
    },
    {
      id: '04',
      name: 'Train Your Team',
      description: 'Use our training resources to get your staff comfortable with the platform in under an hour.',
    },
    {
      id: '05',
      name: 'Go Live',
      description: 'Start using Faxtoro for daily operations and watch your efficiency improve immediately.',
    },
  ];

  return (
    <div id="how-it-works" className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-blue-600">Simple Implementation</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            How Faxtoro Works
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Get up and running with Faxtoro in less than a day. Our streamlined onboarding process ensures you'll be operational quickly with minimal disruption to your business.
          </p>
        </div>
        
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <ol className="space-y-8 relative border-l border-gray-200 dark:border-gray-700 ml-6">
            {steps.map((step, stepIdx) => (
              <li key={step.id} className="ml-6">
                <span className="absolute flex items-center justify-center w-10 h-10 bg-blue-600 rounded-full -left-5 ring-4 ring-white">
                  <span className="text-white font-bold text-sm">{step.id}</span>
                </span>
                <div className="p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
                  <h3 className="flex items-center text-lg font-semibold text-gray-900">{step.name}</h3>
                  <p className="mb-2 text-gray-600">{step.description}</p>
                  {stepIdx !== steps.length - 1 && (
                    <div className="absolute h-6 w-6 bg-blue-100 rounded-full -bottom-3 left-[-0.75rem]"></div>
                  )}
                </div>
              </li>
            ))}
          </ol>
          
          <div className="mt-16 flex justify-center">
            <a
              href="#"
              className="rounded-md bg-blue-600 px-5 py-3 text-md font-semibold text-white shadow-md hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all hover:scale-105"
            >
              Schedule a Demo
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;