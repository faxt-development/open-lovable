const Hero = () => {
  return (
    <div className="relative bg-white">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8 lg:py-40">
        <div className="grid grid-cols-1 gap-x-8 gap-y-16 lg:grid-cols-2">
          <div className="lg:pr-8">
            <div className="max-w-xl">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
                Streamline Your Automotive Repair Business
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Faxtoro helps automotive repair shops manage operations, track inventory, schedule appointments, and boost customer satisfaction with our all-in-one SaaS platform.
              </p>
              <div className="mt-10 flex items-center gap-x-6">
                <a
                  href="#"
                  className="rounded-md bg-blue-600 px-5 py-3 text-md font-semibold text-white shadow-md hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all hover:scale-105"
                >
                  Get Started
                </a>
                <a href="#how-it-works" className="text-md font-semibold leading-6 text-gray-900 hover:text-blue-600 transition-colors">
                  Learn more <span aria-hidden="true">→</span>
                </a>
              </div>
              <div className="mt-10 flex items-center gap-x-2 text-sm text-gray-600">
                <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                <span>No credit card required</span>
                <span className="mx-2">•</span>
                <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                <span>14-day free trial</span>
                <span className="mx-2">•</span>
                <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-[4/3] overflow-hidden rounded-xl bg-gray-100 shadow-xl ring-1 ring-gray-400/10">
              <img
                src="https://images.unsplash.com/photo-1613214150384-27e6fb5ff2dd?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80"
                alt="Automotive repair shop using Faxtoro software"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/70 to-transparent opacity-60"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;