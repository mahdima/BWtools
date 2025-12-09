import React from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";
import material from "../../../img/material.jpg"

const AddCategory = () => {
    return (
        <div className="p-10 w-[94%] mx-auto">
            <h1 className="text-2xl font-bold mb-2 text-[#0B1DFF]">Add new Category</h1>

            <form className="bg-white p-8 rounded-lg shadow-md">
                <div className="flex gap-10 w-[90%]">
                    {/* Left Side - Form Fields */}
                    <div className="w-[40%] mx-auto space-y-6">
                        <div>
                            <label htmlFor="categoryName" className="block text-sm font-medium text-black-700 mb-2">
                                Category Name
                            </label>
                            <input
                                type="text"
                                id="categoryName"
                                name="categoryName"
                                className="p-3 block w-full rounded-md border border-gray-300 focus:border-[#0B1DFF] focus:ring-[#0B1DFF] h-[50px] text-gray-700 outline-none transition-colors"
                                placeholder="Category Name"
                            />
                        </div>
                    </div>

                    {/* Right Side - Image Upload */}
                    <div className="w-[30%] flex flex-col items-center">
                        <div className="w-full h-[300px] rounded-lg mb-4 overflow-hidden bg-gray-100 flex items-center justify-center">
                            {/* Using the same image as placeholder, or could be empty state */}
                            <img
                                src={material.src}
                                alt="Category"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="flex gap-6">
                            <Button type="button" variant="outline" size="icon" className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600">
                                <Trash2 className="h-5 w-5" />
                            </Button>
                            <Button type="button" variant="outline" size="icon" className="border-[#0B1DFF] text-[#0B1DFF] hover:bg-blue-50 hover:text-[#0B1DFF]">
                                <Plus className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Bottom Buttons */}
                <div className="flex gap-4 mt-8 pt-4 justify-center">
                    <Button type="button" variant="outline" className="w-[150px] h-[45px] border border-[#FF6B00] text-[#FF6B00] hover:bg-orange-50">
                        Cancel
                    </Button>
                    <Button type="submit" className="bg-[#0B1DFF] hover:bg-[#000ECC] w-[150px] h-[45px] text-white">
                        Add Category
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default AddCategory;
