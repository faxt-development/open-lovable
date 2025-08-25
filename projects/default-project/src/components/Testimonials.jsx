import React from 'react';

const Testimonials = () => {
  const testimonials = [
    {
      id: 1,
      name: 'Sarah Johnson',
      role: 'CTO at TechFlow',
      image: 'https://randomuser.me/api/portraits/women/32.jpg',
      quote: 'Implementing this API has transformed our development workflow. Our team can now focus on building features instead of managing infrastructure.',
    },
    {
      id: 2,
      name: 'Michael Chen',
      role: 'Lead Developer at StartupHub',
      image: 'https://randomuser.me/api/portraits/men/46.jpg',
      quote: 'The documentation is excellent and the support team responds quickly. We were able to integrate the API in just a few hours.',
    },
    {
      id: 3,
      name: 'Emily Rodriguez',
      role: 'Product Manager at GrowthCo',
      image: 'https://randomuser.me/api/portraits/women/65.jpg',
      quote: 'This solution has helped us scale our application without worrying about backend infrastructure. Highly recommended!',
    }
  ];

  return (
    <section id="testimonials" className="py-20 bg-gray-100">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">What Our Customers Say</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Don't just take our word for it - hear from some of our satisfied customers
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="bg-white p-8 rounded-lg shadow-lg">
              <div className="flex items-center mb-4">
                <img 
                  src={testimonial.image} 
                  alt={testimonial.name} 
                  className="w-16 h-16 rounded-full mr-4 object-cover"
                />
                <div>
                  <h4 className="font-bold text-lg">{testimonial.name}</h4>
                  <p className="text-gray-600">{testimonial.role}</p>
                </div>
              </div>
              <p className="text-gray-700 italic">"{testimonial.quote}"</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;