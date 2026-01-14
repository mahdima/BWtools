import React from "react";
import { Button } from "@/components/ui/button";
import { addCategory } from "./actions";
import { CategoryImageUpload } from "@/components/CategoryImageUpload";

const AddCategory = () => {
    return (
        <div className="p-10 w-[94%] mx-auto">
            <h1 className="text-2xl font-bold mb-2 text-[#0B1DFF]">Add new Category</h1>

            <form action={addCategory} className="bg-white p-8 rounded-lg shadow-md">
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
                        <CategoryImageUpload name="categoryImage" />
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

