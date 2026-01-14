"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, Send } from "lucide-react";
import { addOrderNote } from "@/app/(dashboard)/order/actions";

interface OrderNotesProps {
  orderId: string;
  notes: {
    id: number;
    note: string;
    created_at: string;
    admins: { full_name: string } | null;
  }[];
}

export function OrderNotes({ orderId, notes }: OrderNotesProps) {
  const [newNote, setNewNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addOrderNote(orderId, newNote.trim());
      setNewNote("");
    } catch (error) {
      console.error("Failed to add note:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
        <h2 className="font-semibold text-gray-900 flex items-center">
          <MessageSquare className="h-5 w-5 mr-2 text-[#0B1DFF]" />
          Internal Notes
        </h2>
      </div>
      <div className="p-6">
        {/* Add Note Form */}
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add a note..."
              className="flex-1 px-4 py-2 rounded-lg border border-gray-200 focus:border-[#0B1DFF] focus:ring-1 focus:ring-[#0B1DFF] outline-none text-sm"
            />
            <Button
              type="submit"
              disabled={!newNote.trim() || isSubmitting}
              className="bg-[#0B1DFF] hover:bg-blue-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>

        {/* Notes List */}
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {notes.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No notes yet</p>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className="p-3 rounded-lg bg-gray-50 border border-gray-100"
              >
                <p className="text-sm text-gray-800">{note.note}</p>
                <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                  <span>{note.admins?.full_name || "Admin"}</span>
                  <span>{new Date(note.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
