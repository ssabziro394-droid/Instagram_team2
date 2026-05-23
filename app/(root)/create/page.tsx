"use client";

import React, { useState, useRef, ChangeEvent, FormEvent } from "react";
import { useCreatePostMutation, useGetMyPostsQuery } from "@/store/api/feedApi";
import Image from "next/image";
import { ArrowLeft, ZoomIn, Image as ImageIcon, Copy, MapPin, Smile } from "lucide-react";
import { useRouter } from "next/navigation";

const FILTER_OPTIONS = [
  { name: "Original", style: "none" },
  { name: "Clarendon", style: "contrast(1.2) saturate(1.35)" },
  { name: "Gingham", style: "sepia(0.04) contrast(0.95)" },
  { name: "Moon", style: "grayscale(1) contrast(1.1) brightness(1.1)" },
  { name: "Lark", style: "contrast(0.9) brightness(1.2) saturate(1.3)" },
  { name: "Reyes", style: "sepia(0.22) brightness(1.1) contrast(0.85) saturate(0.75)" },
  { name: "Juno", style: "saturate(1.4) contrast(1.15) brightness(1.15) sepia(0.35)" },
  { name: "Slumber", style: "saturate(0.66) brightness(1.05)" },
  { name: "Crema", style: "sepia(0.5) contrast(1.25) brightness(1.15)" },
  { name: "Ludwig", style: "contrast(1.05) saturate(1.1) brightness(1.05)" },
  { name: "Aden", style: "contrast(0.9) brightness(1.2) saturate(0.85)" },
  { name: "Perpetua", style: "contrast(1.1) brightness(1.25)" },
];

export default function CreatePage() {
  const router = useRouter();
  const [step, setStep] = useState<"upload" | "filter" | "details">("upload");
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState("Original");
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [createPost, { isLoading: isCreating }] = useCreatePostMutation();
  const { refetch } = useGetMyPostsQuery(undefined);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      setImages(fileArray);
      setPreviewUrls(fileArray.map((f) => URL.createObjectURL(f)));
      setStep("filter");
    }
  };

  const handleNext = () => {
    if (step === "filter") setStep("details");
    else if (step === "details") handleSubmit();
  };

  const handleBack = () => {
    if (step === "filter") {
      setImages([]);
      setPreviewUrls([]);
      setStep("upload");
    } else if (step === "details") {
      setStep("filter");
    }
  };

  const handleSubmit = async () => {
    if (images.length === 0) return;
    try {
      // In a real scenario with canvas processing, we would apply the CSS filter to the image before upload.
      // For this clone UI, we upload the original image.
      await createPost({ title, content, images }).unwrap();
      refetch();
      router.push("/username"); // Redirect to profile or home
    } catch (error) {
      console.error("Post creation failed", error);
    }
  };

  const activeStyle = FILTER_OPTIONS.find(f => f.name === activeFilter)?.style || "none";

  return (
    <div className="flex flex-1 items-center justify-center p-4 h-full">
      <div 
        className={`bg-ig-card-bg border border-ig-border rounded-xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${
          step === "upload" ? "w-[400px] h-[450px]" : "w-[750px] h-[500px]"
        }`}
      >
        {/* Header */}
        <div className="h-11 border-b border-ig-border flex items-center justify-between px-4 shrink-0">
          {step !== "upload" ? (
            <button onClick={handleBack} className="text-ig-fg hover:opacity-70 transition">
              <ArrowLeft className="w-6 h-6" />
            </button>
          ) : (
            <div className="w-6" />
          )}

          <h1 className="text-ig-fg font-semibold text-[15px]">
            {step === "upload" && "Create new post"}
            {step === "filter" && "Edit"}
            {step === "details" && "Create new post"}
          </h1>

          {step !== "upload" ? (
            <button 
              onClick={handleNext} 
              disabled={isCreating}
              className="text-[#0095f6] hover:text-[#1877f2] font-semibold text-sm transition disabled:opacity-50"
            >
              {isCreating ? "Sharing..." : step === "details" ? "Share" : "Next"}
            </button>
          ) : (
            <div className="w-6" />
          )}
        </div>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden">
          {step === "upload" && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="mb-4">
                <svg aria-label="Icon to represent media such as images or videos" className="text-ig-fg" fill="currentColor" height="77" role="img" viewBox="0 0 97.6 77.3" width="96">
                  <path d="M16.3 24h.3c2.8-.2 4.9-2.6 4.8-5.4-.2-2.8-2.6-4.9-5.4-4.8s-4.9 2.6-4.8 5.4c.1 2.7 2.4 4.8 5.1 4.8zm-2.4-7.2c.5-.6 1.3-1 2.1-1h.2c1.7.1 3.1 1.5 3.1 3.1 0 1.7-1.3 3.1-3 3.1h-.2c-.8 0-1.5-.3-2.1-.9-.5-.5-.8-1.3-.8-2.1s.3-1.6.8-2.2z" fill="currentColor"></path>
                  <path d="M81.5 10.4H16.1c-5.2 0-9.4 4.2-9.4 9.4v48.2c0 5.2 4.2 9.4 9.4 9.4h65.4c5.2 0 9.4-4.2 9.4-9.4V19.8c0-5.2-4.2-9.4-9.4-9.4zm7.4 57.6c0 4.1-3.3 7.4-7.4 7.4H16.1c-4.1 0-7.4-3.3-7.4-7.4V19.8c0-4.1 3.3-7.4 7.4-7.4h65.4c4.1 0 7.4 3.3 7.4 7.4v48.2z" fill="currentColor"></path>
                  <path d="M88.9 66.9c0 1.1-.9 2-2 2H10.7c-1.1 0-2-.9-2-2v-34l22.2-22.2c1.2-1.2 3.1-1.2 4.2 0l16.1 16.1c1.2 1.2 3.1 1.2 4.2 0l7.8-7.8c1.2-1.2 3.1-1.2 4.2 0l21.5 21.5v26.4z" fill="currentColor"></path>
                </svg>
              </div>
              <h2 className="text-[20px] text-ig-fg font-medium mb-6">Drag photos and videos here</h2>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-[#0095f6] hover:bg-[#1877f2] text-white text-sm font-semibold py-1.5 px-4 rounded-lg transition"
              >
                Select from computer
              </button>
              <input 
                type="file" 
                hidden 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                accept="image/*"
                multiple 
              />
            </div>
          )}

          {step === "filter" && (
            <div className="flex w-full h-full">
              {/* Image Preview Left */}
              <div className="w-[450px] h-full relative bg-black flex items-center justify-center shrink-0 border-r border-ig-border overflow-hidden group">
                <Image 
                  src={previewUrls[0]} 
                  alt="Preview" 
                  fill
                  className="object-cover"
                  style={{ filter: activeStyle !== "none" ? activeStyle : undefined }}
                />
                <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white cursor-pointer hover:bg-black/80">
                    <ZoomIn className="w-4 h-4" />
                  </div>
                </div>
              </div>
              
              {/* Filters Right */}
              <div className="flex-1 flex flex-col bg-ig-bg">
                <div className="flex border-b border-ig-border">
                  <button className="flex-1 py-3 text-sm font-semibold text-ig-fg border-b-2 border-ig-fg">Filters</button>
                  <button className="flex-1 py-3 text-sm font-semibold text-ig-secondary">Adjustments</button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="grid grid-cols-3 gap-3">
                    {FILTER_OPTIONS.map((filter) => (
                      <div 
                        key={filter.name}
                        onClick={() => setActiveFilter(filter.name)}
                        className="flex flex-col items-center gap-2 cursor-pointer group"
                      >
                        <div className={`w-full aspect-square rounded overflow-hidden border-2 transition ${activeFilter === filter.name ? 'border-[#0095f6]' : 'border-transparent group-hover:border-ig-border'}`}>
                          <div className="w-full h-full relative">
                            <Image 
                              src={previewUrls[0]} 
                              alt={filter.name} 
                              fill
                              className="object-cover"
                              style={{ filter: filter.style !== "none" ? filter.style : undefined }}
                            />
                          </div>
                        </div>
                        <span className={`text-[12px] ${activeFilter === filter.name ? 'text-[#0095f6] font-semibold' : 'text-ig-secondary'}`}>
                          {filter.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === "details" && (
            <div className="flex w-full h-full">
              {/* Image Preview Left */}
              <div className="w-[450px] h-full relative bg-black flex items-center justify-center shrink-0 border-r border-ig-border">
                <Image 
                  src={previewUrls[0]} 
                  alt="Preview" 
                  fill
                  className="object-cover"
                  style={{ filter: activeStyle !== "none" ? activeStyle : undefined }}
                />
              </div>
              
              {/* Form Right */}
              <div className="flex-1 flex flex-col bg-ig-bg overflow-y-auto">
                <div className="p-4 flex items-center gap-3">
                  <div className="w-7 h-7 bg-gray-300 rounded-full overflow-hidden" />
                  <span className="text-ig-fg font-semibold text-[14px]">username</span>
                </div>
                
                <div className="px-4 pb-2 border-b border-ig-border">
                  <textarea 
                    placeholder="Write a caption..."
                    className="w-full h-32 bg-transparent text-ig-fg placeholder-ig-secondary resize-none focus:outline-none text-sm"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <button className="text-ig-secondary hover:text-ig-fg">
                      <Smile className="w-5 h-5" />
                    </button>
                    <span className="text-xs text-ig-secondary">{content.length}/2200</span>
                  </div>
                </div>

                <div className="border-b border-ig-border px-4 py-3">
                   <input
                     type="text"
                     placeholder="Title (optional)"
                     className="w-full bg-transparent text-ig-fg placeholder-ig-secondary focus:outline-none text-sm"
                     value={title}
                     onChange={(e) => setTitle(e.target.value)}
                   />
                </div>

                <div className="flex items-center justify-between px-4 py-3 border-b border-ig-border cursor-pointer hover:bg-ig-sidebar-hover transition">
                  <span className="text-ig-fg text-sm">Add location</span>
                  <MapPin className="w-4 h-4 text-ig-fg" />
                </div>
                
                <div className="flex items-center justify-between px-4 py-3 border-b border-ig-border cursor-pointer hover:bg-ig-sidebar-hover transition">
                  <span className="text-ig-fg text-sm">Accessibility</span>
                  <ArrowLeft className="w-4 h-4 text-ig-fg rotate-180" />
                </div>
                
                <div className="flex items-center justify-between px-4 py-3 border-b border-ig-border cursor-pointer hover:bg-ig-sidebar-hover transition">
                  <span className="text-ig-fg text-sm">Advanced settings</span>
                  <ArrowLeft className="w-4 h-4 text-ig-fg rotate-180" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
