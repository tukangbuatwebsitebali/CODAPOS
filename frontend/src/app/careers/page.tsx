"use client";

import Link from "next/link";
import { ShoppingCart, ArrowLeft, Briefcase, MapPin, Clock, ArrowRight, Heart, Zap, Users, Coffee } from "lucide-react";

const OPENINGS = [
    { title: "Backend Engineer (Go)", team: "Engineering", location: "Jakarta / Remote", type: "Full-time", desc: "Build scalable APIs and services for our POS platform using Go, PostgreSQL, and Redis." },
    { title: "Frontend Engineer (React/Next.js)", team: "Engineering", location: "Jakarta / Remote", type: "Full-time", desc: "Craft beautiful, performant user interfaces for our dashboard and storefront products." },
    { title: "Mobile Engineer (Flutter)", team: "Engineering", location: "Jakarta / Remote", type: "Full-time", desc: "Develop our mobile POS application for Android and iOS using Flutter." },
    { title: "Product Designer (UI/UX)", team: "Design", location: "Jakarta / Remote", type: "Full-time", desc: "Design intuitive, beautiful interfaces that help UMKM owners manage their businesses effortlessly." },
    { title: "Customer Success Specialist", team: "Operations", location: "Jakarta", type: "Full-time", desc: "Help our merchants get the most out of CODAPOS. Onboarding, training, and relationship management." },
    { title: "Content Marketing", team: "Marketing", location: "Jakarta / Remote", type: "Full-time", desc: "Create compelling content that educates and inspires Indonesian small business owners." },
];

const PERKS = [
    { icon: Coffee, title: "Work-Life Balance", desc: "Flexible hours, remote-friendly, unlimited PTO" },
    { icon: Heart, title: "Health Benefits", desc: "BPJS + private insurance, mental health support" },
    { icon: Zap, title: "Growth Budget", desc: "Annual learning budget for courses & conferences" },
    { icon: Users, title: "Great Team", desc: "Work with passionate people who care about impact" },
];

export default function CareersPage() {
    return (
        <div className="landing-page font-sans">
            <nav className="landing-nav landing-nav-scrolled">
                <div className="landing-container flex items-center justify-between h-16">
                    <Link href="/" className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00B894] to-[#00CEC9] flex items-center justify-center"><ShoppingCart className="w-4 h-4 text-white" /></div>
                        <span className="text-lg font-extrabold text-gray-900">CODA<span className="text-[#00B894]">POS</span></span>
                    </Link>
                    <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Beranda</Link>
                </div>
            </nav>

            <main className="pt-28 pb-20">
                <div className="landing-container max-w-4xl">
                    <div className="text-center mb-16">
                        <span className="inline-block text-xs font-bold text-emerald-600 uppercase tracking-[0.2em] bg-emerald-50 px-4 py-1.5 rounded-full mb-4">Karir</span>
                        <h1 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight">
                            Bangun Teknologi untuk <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00B894] to-[#00957a]">Jutaan UMKM</span>
                        </h1>
                        <p className="mt-5 text-lg text-gray-500 max-w-xl mx-auto">Bergabung dengan tim yang berdedikasi membangun masa depan bisnis Indonesia.</p>
                    </div>

                    {/* Perks */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
                        {PERKS.map((p, i) => {
                            const Icon = p.icon;
                            return (
                                <div key={i} className="landing-stat-card">
                                    <Icon className="w-7 h-7 text-[#00B894] mx-auto mb-3" />
                                    <p className="font-bold text-gray-800 text-sm">{p.title}</p>
                                    <p className="text-xs text-gray-400 mt-1">{p.desc}</p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Openings */}
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2"><Briefcase className="w-6 h-6 text-[#00B894]" /> Open Positions</h2>
                    <div className="space-y-4">
                        {OPENINGS.map((job, i) => (
                            <div key={i} className="landing-feature-card p-6 hover:border-[#00B894] group cursor-pointer">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#00B894] transition-colors">{job.title}</h3>
                                        <p className="text-sm text-gray-500 mt-1">{job.desc}</p>
                                        <div className="flex flex-wrap gap-3 mt-3">
                                            <span className="inline-flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full"><Users className="w-3 h-3" />{job.team}</span>
                                            <span className="inline-flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full"><MapPin className="w-3 h-3" />{job.location}</span>
                                            <span className="inline-flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full"><Clock className="w-3 h-3" />{job.type}</span>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-[#00B894] transition mt-1" />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="text-center mt-12 landing-feature-card p-8">
                        <p className="text-gray-500 mb-4">Tidak menemukan posisi yang cocok? Kirim CV Anda ke:</p>
                        <p className="text-lg font-bold text-[#00B894]">careers@codapos.com</p>
                    </div>
                </div>
            </main>

            <footer className="bg-gray-50 border-t border-gray-100 py-8">
                <div className="landing-container text-center">
                    <p className="text-sm text-gray-400">&copy; 2025 CODAPOS. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
