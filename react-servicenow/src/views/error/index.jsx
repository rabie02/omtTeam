// src/pages/NotFound.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
    return (
        <main class="h-screen w-full flex flex-col justify-center items-center bg-cyan-800">
            <h1 class="text-9xl font-extrabold text-white tracking-widest">404</h1>
            <div class="bg-cyan-700 px-2 text-sm rounded rotate-12 absolute shadow text-white">
                Page Not Found
            </div>
            <button class="mt-5">
                <a
                    class="relative inline-block text-sm font-medium text-white group active:text-gray-100 focus:outline-none focus:ring"
                >
                    <span
                        class="absolute inset-0 transition-transform translate-x-0.5 translate-y-0.5 bg-white group-hover:translate-y-0 group-hover:translate-x-0"
                    ></span>

                    <span class="relative block px-8 py-3 bg-[#1A2238] border border-current">
                        <Link to="/">Go Home</Link>
                    </span>
                </a>
            </button>
        </main>
    );
}
