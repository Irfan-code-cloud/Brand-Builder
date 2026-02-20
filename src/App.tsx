import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Loader2, Image as ImageIcon, Newspaper, Smartphone, MonitorUp, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

type GeneratedImage = {
  id: string;
  title: string;
  icon: React.ReactNode;
  dataUrl: string | null;
  loading: boolean;
};

export default function App() {
  const [productDesc, setProductDesc] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [images, setImages] = useState<GeneratedImage[]>([
    { id: 'base', title: 'Product Concept', icon: <ImageIcon className="w-4 h-4" />, dataUrl: null, loading: false },
    { id: 'billboard', title: 'Billboard Ad', icon: <MonitorUp className="w-4 h-4" />, dataUrl: null, loading: false },
    { id: 'newspaper', title: 'Newspaper Ad', icon: <Newspaper className="w-4 h-4" />, dataUrl: null, loading: false },
    { id: 'social', title: 'Social Media', icon: <Smartphone className="w-4 h-4" />, dataUrl: null, loading: false },
  ]);

  const generateImages = async () => {
    if (!productDesc.trim()) return;
    
    setIsGenerating(true);
    setError(null);
    
    setImages(prev => prev.map(img => ({ ...img, dataUrl: null, loading: true })));

    try {
      const basePrompt = `A clean, high-quality studio product photography shot of ${productDesc}. Professional lighting, neutral background. Absolutely no people, no hands, no human figures.`;
      const baseResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: basePrompt }] }
      });
      
      let baseImageData = '';
      let baseMimeType = 'image/png';
      
      for (const part of baseResponse.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          baseImageData = part.inlineData.data;
          baseMimeType = part.inlineData.mimeType || 'image/png';
          break;
        }
      }
      
      if (!baseImageData) throw new Error("Failed to generate base product image.");
      
      const baseDataUrl = `data:${baseMimeType};base64,${baseImageData}`;
      
      setImages(prev => prev.map(img => 
        img.id === 'base' ? { ...img, dataUrl: baseDataUrl, loading: false } : img
      ));

      const variations = [
        { 
          id: 'billboard', 
          prompt: `Edit this image to place the product on a large outdoor billboard in a bustling city environment. The product should be the main focus of the billboard. Absolutely no people in the scene.` 
        },
        { 
          id: 'newspaper', 
          prompt: `Edit this image to make it look like a vintage black and white newspaper advertisement featuring this product. Include some mock newspaper text around it. Absolutely no people.` 
        },
        { 
          id: 'social', 
          prompt: `Edit this image to look like an engaging, modern Instagram social media post featuring this product, perhaps resting on a stylish table or aesthetic background. Absolutely no people.` 
        }
      ];

      for (const variation of variations) {
        try {
          const varResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
              parts: [
                {
                  inlineData: {
                    data: baseImageData,
                    mimeType: baseMimeType
                  }
                },
                { text: variation.prompt }
              ]
            }
          });
          
          let varDataUrl = null;
          for (const part of varResponse.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
              varDataUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
              break;
            }
          }
          
          setImages(prev => prev.map(img => 
            img.id === variation.id ? { ...img, dataUrl: varDataUrl, loading: false } : img
          ));
        } catch (err) {
          console.error(`Error generating ${variation.id}:`, err);
          setImages(prev => prev.map(img => 
            img.id === variation.id ? { ...img, loading: false } : img
          ));
        }
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during generation.");
      setImages(prev => prev.map(img => ({ ...img, loading: false })));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#f5f5f5] font-sans selection:bg-[#F27D26] selection:text-white pb-20">
      <div className="max-w-6xl mx-auto px-6 py-12 md:py-20">
        
        <header className="mb-16 max-w-3xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-6"
          >
            <div className="w-10 h-10 rounded-full bg-[#F27D26]/10 flex items-center justify-center border border-[#F27D26]/20">
              <Sparkles className="w-5 h-5 text-[#F27D26]" />
            </div>
            <h1 className="text-sm font-mono tracking-widest uppercase text-[#F27D26]">Brand Builder</h1>
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-light tracking-tight mb-8 leading-tight"
          >
            Imagine your product <br/>
            <span className="font-serif italic text-[#a3a3a3]">everywhere.</span>
          </motion.h2>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <input
              type="text"
              value={productDesc}
              onChange={(e) => setProductDesc(e.target.value)}
              placeholder="e.g. A sleek matte black espresso machine with wood accents"
              className="flex-1 bg-[#141414] border border-[#262626] rounded-xl px-5 py-4 text-white placeholder-[#525252] focus:outline-none focus:border-[#F27D26] focus:ring-1 focus:ring-[#F27D26] transition-all"
              onKeyDown={(e) => e.key === 'Enter' && generateImages()}
              disabled={isGenerating}
            />
            <button
              onClick={generateImages}
              disabled={isGenerating || !productDesc.trim()}
              className="bg-[#F27D26] hover:bg-[#d96b1c] disabled:opacity-50 disabled:hover:bg-[#F27D26] text-black font-medium px-8 py-4 rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  Generate Campaign
                </>
              )}
            </button>
          </motion.div>
          
          {error && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 mt-4 text-sm"
            >
              {error}
            </motion.p>
          )}
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {images.map((img, idx) => (
              <motion.div
                key={img.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-[#141414] border border-[#262626] rounded-2xl overflow-hidden flex flex-col"
              >
                <div className="p-4 border-b border-[#262626] flex items-center gap-3 bg-[#0a0a0a]">
                  <div className="text-[#a3a3a3]">
                    {img.icon}
                  </div>
                  <h3 className="text-sm font-medium tracking-wide">{img.title}</h3>
                  {img.loading && (
                    <Loader2 className="w-4 h-4 animate-spin text-[#F27D26] ml-auto" />
                  )}
                </div>
                
                <div className="relative aspect-square bg-[#0a0a0a] flex items-center justify-center p-6">
                  {img.dataUrl ? (
                    <img 
                      src={img.dataUrl} 
                      alt={img.title} 
                      className="w-full h-full object-contain rounded-lg shadow-2xl"
                    />
                  ) : img.loading ? (
                    <div className="flex flex-col items-center gap-4 text-[#525252]">
                      <Loader2 className="w-8 h-8 animate-spin text-[#262626]" />
                      <p className="text-xs font-mono uppercase tracking-widest">Processing</p>
                    </div>
                  ) : (
                    <div className="text-[#262626] flex flex-col items-center gap-4">
                      <ImageIcon className="w-12 h-12" />
                      <p className="text-xs font-mono uppercase tracking-widest">Awaiting Input</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
