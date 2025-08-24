const Testimonials = () => {
  const testimonials = [
    {
      content: "Faxtoro has transformed how we manage our auto repair shop. Our scheduling efficiency improved by 40% and customer satisfaction ratings are at an all-time high.",
      author: "Michael Rodriguez",
      role: "Owner, Rodriguez Auto Care",
      imageUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&q=80",
    },
    {
      content: "The digital vehicle inspection feature alone has increased our average repair order by 15%. Customers trust us more when they can see photos and videos of the issues.",
      author: "Sarah Johnson",
      role: "Manager, Precision Auto Works",
      imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&q=80",
    },
    {
      content: "After trying three different shop management systems, Faxtoro is by far the most intuitive and comprehensive. Our team was up and running in just a few hours.",
      author: "David Chen",
      role: "Owner, Chen's European Auto",
      imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&q=80",
    },
  ];

  return (
    <div id="testimonials" className="bg-gray-50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-blue-600">Testimonials</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Trusted by auto repair shops nationwide
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Hear from shop owners and managers who have transformed their businesses with Faxtoro.
          </p>
        </div>
        
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="flex flex-col justify-between bg-white p-8 shadow-sm rounded-xl border border-gray-100 hover:shadow-md transition-shadow duration-300">
              <div>
                <div className="flex items-center gap-x-2 mb-6">
                  {[0, 1, 2, 3, 4].map((star) => (
                    <svg key={star