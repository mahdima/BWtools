"use client";

import React, { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import material from "../../img/material.jpg"
import logo from "../../img/Asset 3.png"
import Image from 'next/image';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        login(email);
    };

    return (
        <div className="flex min-h-screen bg-white">
            {/* Left Side - Login Form */}
            <div className="w-full mt-20 lg:w-1/2 flex  justify-center p-8 lg:p-16">
                <div className="w-full max-w-md space-y-8">
                    <div className="flex flex-col items-center mb-10 w-full">
                        <div className="w-full h-full mb-4">
                            <img
                                src={logo.src}
                                alt="WBtools Logo"
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 tracking-tight text-center">
                            Welcome back to WBtools
                        </h2>

                    </div>

                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-5">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                    Email address
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#0B1DFF] focus:border-[#0B1DFF] sm:text-sm transition duration-200"
                                        placeholder="Enter your email"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                    Password
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="current-password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#0B1DFF] focus:border-[#0B1DFF] sm:text-sm transition duration-200"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md border border-red-200">
                                {error}
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#0B1DFF] hover:bg-[#000ECC] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0B1DFF] transition duration-200 transform hover:translate-y-[-1px]"
                            >
                                Sign in
                            </button>
                        </div>

                        <div className="text-center mt-4">
                            <span className="text-sm text-gray-600">Don't have an account? </span>
                            <a href="#" className="font-medium text-[#0B1DFF] hover:text-[#000ECC] text-sm">
                                Contact Support
                            </a>
                        </div>
                    </form>
                </div>
            </div>

            {/* Right Side - Image */}
            <div className="hidden lg:block lg:w-1/2 relative bg-gray-100">
                <img
                    src={material.src}
                    alt="Login Background"
                    className="w-full h-full object-cover"
                />
            </div>
        </div>
    );
}
