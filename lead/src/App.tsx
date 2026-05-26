import { useState } from 'react';
import { Check } from 'lucide-react';
import { supabase } from './lib/supabase';

function App() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const { error: submitError } = await supabase
        .from('contest_entries')
        .insert([{ name, email }]);

      if (submitError) {
        if (submitError.code === '23505') {
          setError('This email has already been entered. One entry per person.');
        } else {
          setError('Something went wrong. Please try again.');
        }
        setIsSubmitting(false);
        return;
      }

      setIsSubmitted(true);
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-2xl w-full text-center">
          <div className="bg-black rounded-2xl shadow-2xl p-12">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-black" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">You're In!</h1>
            <p className="text-xl text-gray-300 mb-6">
              Your entry has been received. Good luck!
            </p>
            <p className="text-sm text-gray-400">
              We'll announce the winners soon.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col">
        <div className="max-w-6xl mx-auto w-full px-4 py-12">
          <div className="flex justify-between items-center mb-20">
            <div className="flex items-center gap-3 bg-black px-6 py-3 rounded-full">
              <img
                src="https://via.placeholder.com/40x40?text=Kestrel"
                alt="Kestrel"
                className="h-6 w-6"
              />
              <span className="text-white font-bold text-lg">Kestrel</span>
            </div>
            <div className="flex items-center gap-3 bg-black px-6 py-3 rounded-full">
              <img
                src="https://via.placeholder.com/40x40?text=PaBoyz"
                alt="PaBoyz"
                className="h-6 w-6"
              />
              <span className="text-white font-bold text-lg">PaBoyz</span>
            </div>
          </div>

          <div className="text-center mb-16">
            <h1 className="text-7xl md:text-8xl font-bold text-black mb-8 leading-tight">
              Win 1 of 12<br />
              <span className="text-black">
                Kestrel Knives
              </span>
            </h1>
            <p className="text-2xl text-gray-700 max-w-2xl mx-auto">
              Enter with your name and email for a chance to win 1 of 12 Kestrel Knives.
            </p>
          </div>

          <div className="max-w-md mx-auto mb-8">
            <div className="bg-black rounded-2xl shadow-2xl p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-white mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-600 rounded-lg bg-gray-900 text-white focus:ring-2 focus:ring-gray-400 focus:border-transparent outline-none transition-all"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-white mb-2">
                    Your Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-600 rounded-lg bg-gray-900 text-white focus:ring-2 focus:ring-gray-400 focus:border-transparent outline-none transition-all"
                    placeholder="john@example.com"
                  />
                </div>

                {error && (
                  <div className="bg-gray-800 border border-gray-700 text-red-300 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-white text-black font-bold py-4 px-8 rounded-lg hover:bg-gray-200 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-lg shadow-lg"
                >
                  {isSubmitting ? 'Submitting...' : 'Count Me In'}
                </button>
              </form>
            </div>

            <p className="text-center text-gray-600 text-sm mt-4">
              Takes 10 seconds. One entry per person.
            </p>
          </div>
        </div>

        <div className="flex-1" />
      </div>

      <div className="border-t border-gray-200 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold text-black mb-4">Premium Craftsmanship</h2>
              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                Each Kestrel Knife is expertly crafted with precision engineering and premium materials.
                Built for performance and durability, these are the tools serious craftspeople depend on.
              </p>
              <div className="flex gap-8">
                <div>
                  <div className="text-4xl font-bold text-black mb-2">12</div>
                  <div className="text-sm text-gray-600 font-medium">Winners</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-black mb-2">100%</div>
                  <div className="text-sm text-gray-600 font-medium">Fair Draw</div>
                </div>
              </div>
            </div>
            <div>
              <img
                src="https://images.pexels.com/photos/3962286/pexels-photo-3962286.jpeg?auto=compress&cs=tinysrgb&w=600"
                alt="Kestrel Knife"
                className="rounded-xl shadow-2xl w-full h-80 object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
